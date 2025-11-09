import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');
    const port = process.env.PORT ?? 3000;

    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
    const logger = new Logger('Bootstrap');
    logger.error('Error starting the application:', error instanceof Error ? error.stack : String(error));
    process.exit(1);
});
