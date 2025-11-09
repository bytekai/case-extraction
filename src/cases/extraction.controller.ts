import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractionService } from './extraction.service';
import { Extraction } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('api/extractions')
export class ExtractionController {
    private readonly logger = new Logger(ExtractionController.name);
    private readonly maxFileSizePDF: number;
    private readonly maxFileSizeHTML: number;
    constructor(
        private readonly extractionService: ExtractionService,
        private readonly configService: ConfigService,
    ) {
        this.maxFileSizePDF = this.configService.get<number>('MAX_FILE_SIZE_PDF') || DEFAULT_MAX_FILE_SIZE_BYTES;
        this.maxFileSizeHTML = this.configService.get<number>('MAX_FILE_SIZE_HTML') || DEFAULT_MAX_FILE_SIZE_BYTES;
    }
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Extraction> {
        this.logger.log(`Received file upload request: ${file?.originalname || 'no file'}`);

        if (!file) {
            this.logger.warn('File upload request received without file');
            throw new BadRequestException('No file uploaded');
        }

        if (file.mimetype !== 'text/html' && file.mimetype !== 'application/pdf') {
            this.logger.warn(`Invalid file type attempted: ${file.mimetype} for file ${file.originalname}`);
            throw new BadRequestException('File must be either HTML or PDF');
        }

        const maxFileSize = file.mimetype === 'application/pdf' ? this.maxFileSizePDF : this.maxFileSizeHTML;
        if (file.size > maxFileSize) {
            this.logger.warn(`File too large: ${file.originalname} (${file.size} bytes, max: ${maxFileSize} bytes)`);
            throw new BadRequestException(`File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB`);
        }

        this.logger.log(`Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
        return this.extractionService.processFile(file);
    }
}
