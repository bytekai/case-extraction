import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExtractionService } from './extraction.service';
import { ExtractionResolver } from './extraction.resolver';
import { ExtractionController } from './extraction.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [ExtractionController],
    providers: [ExtractionService, ExtractionResolver],
    exports: [ExtractionService],
})
export class ExtractionModule {}
