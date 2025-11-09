import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Min, Max, Matches, ValidateIf } from 'class-validator';

export enum ExtractionSortField {
    CREATED_AT = 'createdAt',
    DATE_OF_DECISION = 'dateOfDecision',
    TITLE = 'title',
    CASE_NUMBER = 'caseNumber',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

registerEnumType(ExtractionSortField, {
    name: 'ExtractionSortField',
});

registerEnumType(SortOrder, {
    name: 'SortOrder',
});

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAGINATION_LIMIT = 100;

@InputType()
export class ExtractionFilter {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
        court?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
        office?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
        language?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
        decisionType?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
        caseNumber?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Matches(DATE_REGEX, { message: 'dateFrom must be in YYYY-MM-DD format' })
        dateFrom?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Matches(DATE_REGEX, { message: 'dateTo must be in YYYY-MM-DD format' })
        dateTo?: string;
}

@InputType()
export class ExtractionSort {
    @Field(() => ExtractionSortField, { nullable: true })
    @ValidateIf((o: ExtractionSort) => o.field !== undefined && o.field !== null)
    @IsEnum(ExtractionSortField)
        field?: ExtractionSortField;

    @Field(() => SortOrder, { nullable: true })
    @ValidateIf((o: ExtractionSort) => o.order !== undefined && o.order !== null)
    @IsEnum(SortOrder)
        order?: SortOrder;
}

@InputType()
export class PaginationInput {
    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @IsOptional()
    @Min(1)
    @Max(MAX_PAGINATION_LIMIT)
        limit?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @IsOptional()
    @Min(0)
        offset?: number;
}

export const MAX_PAGINATION_LIMIT_VALUE = MAX_PAGINATION_LIMIT;

