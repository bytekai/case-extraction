import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    OnApplicationShutdown,
    Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

type PrismaTransactionClient = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

interface TransactionOptions {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
    maxRetries?: number;
}

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
    private readonly logger = new Logger(PrismaService.name);
    private readonly defaultMaxRetries = 3;
    private readonly defaultRetryDelay = 1000;

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }

    async onApplicationShutdown(): Promise<void> {
        await this.$disconnect();
    }

    async executeInTransaction<T>(
        callback: (prisma: PrismaTransactionClient) => Promise<T>,
        options: TransactionOptions = {},
    ): Promise<T> {
        const {
            maxWait = 5000,
            timeout = 10000,
            isolationLevel = Prisma.TransactionIsolationLevel.Serializable,
            maxRetries = this.defaultMaxRetries,
        } = options;

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.$transaction(
                    callback,
                    {
                        maxWait,
                        timeout,
                        isolationLevel,
                    },
                );
            } catch (error) {
                lastError = error as Error;

                if (!this.isRetryableError(error) || attempt === maxRetries) {
                    throw error;
                }

                const delay = this.defaultRetryDelay * Math.pow(2, attempt);
                this.logger.warn(
                    `Transaction failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`,
                );

                await this.sleep(delay);
            }
        }

        throw lastError || new Error('Transaction failed after retries');
    }

    private isRetryableError(error: unknown): boolean {
        if (!(error instanceof Error)) {
            return false;
        }

        if (
            error.message.includes('P1001') ||
            error.message.includes('P1008') ||
            error.message.includes('P1017') ||
            error.message.includes('deadlock') ||
            error.message.includes('connection') ||
            error.message.includes('timeout')
        ) {
            return true;
        }

        if (
            error.message.includes('40P01') ||
            error.message.includes('40001') ||
            error.message.includes('55P03')
        ) {
            return true;
        }

        return false;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
