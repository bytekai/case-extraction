import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export class EnvironmentVariables {
    @IsString()
        DATABASE_URL!: string;

    @IsString()
        OPENROUTER_API_KEY!: string;

    @IsOptional()
    @IsString()
        OPENROUTER_MODEL?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
        PORT?: number;

    @IsOptional()
    @IsString()
        APP_URL?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1024)
        MAX_FILE_SIZE_PDF?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1024)
        MAX_FILE_SIZE_HTML?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1000)
        MAX_CONTEXT_TOKENS?: number;

    @IsOptional()
    @IsString()
        LOG_LEVEL?: string;

    @IsOptional()
    @IsString()
        NODE_ENV?: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });
    if (errors.length > 0) {
        const errorMessages = errors
            .map((error: { constraints?: Record<string, string> }) => Object.values(error.constraints || {}).join(', '))
            .join('; ');
        throw new Error(`Environment validation failed: ${errorMessages}`);
    }
    return validatedConfig;
}

