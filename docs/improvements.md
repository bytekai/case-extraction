# Improvements

## Better Error Handling

The current error handling wraps all failures in generic `BadRequestException` and doesn't distinguish between different failure types. There's no retry logic for transient failures, and the system doesn't handle files that exceed the large language model's context window limit.

A more robust error handling system would include custom exception classes, structured error responses with error codes, and retry logic with exponential backoff. For files that exceed context limits, we could implement chunking strategies, use summarization to reduce content size, or reject files upfront with clear error messages. Circuit breakers for external services would prevent cascading failures.

This improves reliability and debuggability, but adds complexity. Chunking strategies also add cost and complexity, as they require multiple LLM calls and intelligent merging logic.

## Async Processing, Work Queues and Background Jobs

The system currently processes uploads synchronously, which isn't ideal for production. We should process uploads asynchronously using a work queue.

This could be done with Redis + BullMQ or RabbitMQ.

## PostgreSQL for Production

The system currently uses SQLite, which works great for development and small deployments. For production environments with higher concurrency or multiple servers, this could become a bottleneck.

PostgreSQL would provide better concurrent write performance, full-text search capabilities, support for multi-server deployments, and more advanced indexing options.

## Persisting files for later retrieval and usage

The system currently doesn't persist uploaded files.

To support some improvements below, we need a way to retrieve uploaded files later. Something like MinIO or S3 would work well for this.

## Multi-Step Extraction and Prompting

Right now extraction uses the same generic prompt for every document. Better approach: first classify the document type, then use a tailored prompt for that specific type.

This means more accurate extractions for specialized content and better handling of edge cases. Downside is more prompt templates to maintain and the classification step adds some cost.

## PDF Semantic Extraction

Currently, PDF parsing extracts plain text while keeping basic structure (paragraph breaks, line breaks). But semantic elements like titles, headings, and hierarchy aren't explicitly preserved.

Libraries like `pdfjs-dist` (Mozilla's PDF.js) could extract text with font size, position, and styling metadata. This would let us identify titles (large font, centered), headings (larger, bold), subheadings, and maintain document hierarchy based on visual formatting.

## Support Multiple Results per Upload

Right now the system only stores one extraction result per upload. We should allow multiple results, each with metadata like a `version` (UUID) to identify different extraction runs and a `source` field to track which model or method produced it.

## Presigned URLs for Uploads

Using presigned URLs would let us avoid routing files directly through our system, saving bandwidth. We could also configure the S3 bucket to emit events when files are uploaded, triggering the extraction process asynchronously.

## Multiple Extractions with Scoring and Ranking

Generate multiple extractions in parallel (different models, prompts, temperatures), score them using LLM evaluation or rule-based heuristics, then pick the best one. Store all results with version and source metadata for comparison and learning.

This gives higher accuracy and helps us learn which approaches work best. Trade-off is significantly increased cost from multiple LLM calls per document.

## Fully Streaming Architecture

Process the entire pipeline as a stream, handling files chunk-by-chunk instead of buffering in memory.

Better scalability and lower memory usage, but adds complexity that might be overengineering for some cases.

## Extract Country

The system doesn't extract country information, which could be useful for filtering and organizing documents by legal system.

Country extraction would enable country-level filtering and help identify the legal system quickly. However, this can be ambiguous for international courts, EU courts, or federal systems. Court names and language detection already provide strong signals for country identification, so the value depends on whether explicit country-level filtering is needed for the use case.

## Rate Limiting

The system currently has no rate limiting on API endpoints.

This could be done with `@nestjs/throttler` or Redis-based rate limiting. Different limits could be applied to different endpoints (e.g., stricter limits on file uploads vs. queries).

## Unit Tests

The codebase currently lacks unit tests.

Critical areas to test include: extraction service logic, filter/sort/pagination builders, language detection, error handling, and input validation.

## JSDoc Documentation

Public APIs and complex functions lack JSDoc comments.

Adding JSDoc to public methods, interfaces, and complex functions would improve developer experience with better inline documentation and parameter descriptions. Especially valuable for extraction service methods, GraphQL resolvers, and utility functions.
