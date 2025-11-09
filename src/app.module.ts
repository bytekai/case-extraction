import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module';
import { ExtractionModule } from './cases/extraction.module';
import { validate } from './config/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate,
            validationOptions: {
                whitelist: true,
            },
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
        }),
        PrismaModule,
        ExtractionModule,
    ],
})
export class AppModule { }
