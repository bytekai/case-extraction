import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Extraction, FileType, Prisma } from '@prisma/client';
import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { franc } from 'franc';
import { parseHtml, parsePdf } from '../common/utils/parser.util';
import { Readable } from 'node:stream';
import { getErrorMessage } from '../common/utils/error.util';
import { streamToBuffer } from '../common/utils/stream.util';
import { buildSchema } from './extraction.schema';
import { getSystemPrompt } from './extraction.prompts';
import { ExtractionFilter, ExtractionSort, PaginationInput, ExtractionSortField, SortOrder, MAX_PAGINATION_LIMIT_VALUE } from './extraction.inputs';
import { ExtractionPaginationResult } from './extraction.entity';

@Injectable()
export class ExtractionService {
    private readonly logger = new Logger(ExtractionService.name);
    private readonly openrouter: ReturnType<typeof createOpenRouter>;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is not set');
        }
        this.openrouter = createOpenRouter({ apiKey });
    }

    async processFile(file: Express.Multer.File): Promise<Extraction> {
        this.logger.log(`Starting processing for file: ${file.originalname} (${file.mimetype})`);

        if (!file.mimetype || (file.mimetype !== 'text/html' && file.mimetype !== 'application/pdf')) {
            throw new BadRequestException('File must be either HTML or PDF');
        }
        const fileType = file.mimetype === 'application/pdf' ? FileType.PDF : FileType.HTML;

        try {
            this.logger.log(`Parsing ${fileType} file: ${file.originalname}`);
            const stream = Readable.from(file.buffer);
            let textStream: Readable;
            if (fileType === FileType.HTML) {
                textStream = await parseHtml(stream);
            } else {
                textStream = await parsePdf(stream);
            }
            const buffer = await streamToBuffer(textStream);
            const textContent = buffer.toString('utf-8');
            const textLength = textContent.length;
            this.logger.log(`Extracted ${textLength} characters from ${file.originalname}`);

            this.logger.log(`Detecting language for ${file.originalname}`);
            const language = this.detectLanguage(textContent);
            this.logger.log(`Detected language: ${language} for ${file.originalname}`);

            const schema = buildSchema(language);
            const systemPrompt = getSystemPrompt(language);
            const modelName = this.configService.get<string>('OPENROUTER_MODEL') || 'openai/gpt-5';
            const model = this.openrouter(modelName);
            this.logger.log(`Sending extraction request to large language model (${modelName}) for ${file.originalname}`);
            const { object } = await generateObject({
                model,
                schema,
                system: systemPrompt,
                prompt: textContent,
                maxRetries: 0,
                output: 'object',
                mode: 'json',
                temperature: 0.2,
                maxOutputTokens: 8000,
            });

            this.logger.log(`Extraction completed for ${file.originalname}, saving to database`);
            const extraction = await this.prisma.extraction.create({
                data: {
                    fileType,
                    originalFileName: file.originalname,
                    source: modelName,
                    title: object.title,
                    decisionType: object.decisionType,
                    dateOfDecision: object.dateOfDecision || null,
                    office: object.office,
                    court: object.court,
                    caseNumber: object.caseNumber,
                    summary: object.summary,
                    conclusion: object.conclusion,
                    language,
                },
            });
            this.logger.log(`Successfully processed ${file.originalname} -> extraction ${extraction.id} (case: ${object.caseNumber || 'N/A'})`);
            return extraction;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            this.logger.error(`Failed to process ${file.originalname}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`Failed to process file: ${errorMessage}`);
        }
    }

    private detectLanguage(text: string): 'da' | 'en' {
        if (!text || text.trim().length === 0) {
            return 'da';
        }
        const francResult = franc(text);
        const mapping: Record<string, 'da' | 'en'> = {
            'eng': 'en',
            'en': 'en',
            'dan': 'da',
            'da': 'da',
        };
        return mapping[francResult] ?? 'da';
    }

    async findById(id: string): Promise<Extraction | null> {
        return this.prisma.extraction.findUnique({
            where: { id },
        });
    }

    async findAll(
        filter?: ExtractionFilter,
        sort?: ExtractionSort,
        pagination?: PaginationInput,
    ): Promise<ExtractionPaginationResult> {
        if (filter) {
            this.validateFilter(filter);
        }

        const where = this.buildWhereClause(filter);
        const orderBy = this.buildOrderBy(sort);

        const limit = pagination?.limit ?? 10;
        const offset = pagination?.offset ?? 0;

        if (limit > MAX_PAGINATION_LIMIT_VALUE) {
            throw new BadRequestException(`Limit cannot exceed ${MAX_PAGINATION_LIMIT_VALUE}`);
        }

        const [items, total] = await Promise.all([
            this.prisma.extraction.findMany({
                where,
                orderBy,
                take: limit,
                skip: offset,
            }),
            this.prisma.extraction.count({ where }),
        ]);

        return {
            items,
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
        };
    }

    private validateFilter(filter: ExtractionFilter): void {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (filter.dateFrom && !dateRegex.test(filter.dateFrom)) {
            throw new BadRequestException('dateFrom must be in YYYY-MM-DD format');
        }
        if (filter.dateTo && !dateRegex.test(filter.dateTo)) {
            throw new BadRequestException('dateTo must be in YYYY-MM-DD format');
        }
        if (filter.dateFrom && filter.dateTo && filter.dateFrom > filter.dateTo) {
            throw new BadRequestException('dateFrom must be less than or equal to dateTo');
        }
    }

    private buildWhereClause(filter?: ExtractionFilter): Prisma.ExtractionWhereInput {
        if (!filter) {
            return {};
        }
        const where: Prisma.ExtractionWhereInput = {};
        if (filter.court?.trim()) {
            where.court = { contains: filter.court.trim() };
        }
        if (filter.office?.trim()) {
            where.office = { contains: filter.office.trim() };
        }
        if (filter.language?.trim()) {
            where.language = filter.language.trim();
        }
        if (filter.decisionType?.trim()) {
            where.decisionType = { contains: filter.decisionType.trim() };
        }
        if (filter.caseNumber?.trim()) {
            where.caseNumber = { contains: filter.caseNumber.trim() };
        }
        if (filter.dateFrom || filter.dateTo) {
            where.dateOfDecision = {};
            if (filter.dateFrom) {
                where.dateOfDecision.gte = filter.dateFrom;
            }
            if (filter.dateTo) {
                where.dateOfDecision.lte = filter.dateTo;
            }
        }
        return where;
    }

    private buildOrderBy(sort?: ExtractionSort): Prisma.ExtractionOrderByWithRelationInput {
        if (!sort || !sort.field || !sort.order) {
            return { createdAt: 'desc' };
        }
        const fieldMap: Record<ExtractionSortField, keyof Prisma.ExtractionOrderByWithRelationInput> = {
            [ExtractionSortField.CREATED_AT]: 'createdAt',
            [ExtractionSortField.DATE_OF_DECISION]: 'dateOfDecision',
            [ExtractionSortField.TITLE]: 'title',
            [ExtractionSortField.CASE_NUMBER]: 'caseNumber',
        };
        const field = fieldMap[sort.field];
        const order = sort.order === SortOrder.ASC ? 'asc' : 'desc';
        return { [field]: order } as Prisma.ExtractionOrderByWithRelationInput;
    }

    async update(
        id: string,
        data: {
            title?: string;
            decisionType?: string;
            dateOfDecision?: string | null;
            office?: string;
            court?: string;
            caseNumber?: string;
            summary?: string;
            conclusion?: string;
        },
    ): Promise<Extraction> {
        return this.prisma.extraction.update({
            where: { id },
            data,
        });
    }
}
