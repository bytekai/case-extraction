# Architecture & Design Decisions

## GraphQL not used for file uploads

File uploads use an HTTP POST endpoint instead of GraphQL.

**Reasoning:**

GraphQL file uploads require additional libraries and complexity (graphql-upload, multipart request handling). A standard HTTP POST endpoint with multipart/form-data provides a simpler, more standard approach for file uploads that works seamlessly with standard HTTP clients and tools. GraphQL is better suited for flexible querying where clients can request specific fields, so it's used for read operations while HTTP handles file uploads.

## Streaming Architecture

Parsers and extraction services use streams (Readable) as input/output, allowing each component to decide when to buffer in memory.

**Reasoning:**

This design keeps the architecture open for future optimizations (streaming HTML parsing, chunked LLM processing, parallel extraction) without requiring interface changes. Current implementations buffer streams immediately for processing, but the stream-based interface allows for future streaming optimizations without changing component contracts.

## Extraction is kept in the same language as the document

Extractions preserve the original document language rather than translating to a common language.

Legal terminology carries language-specific nuances that don't translate cleanly. Concepts often have distinct meanings in their original legal system that may not map directly to equivalents in other languages. Keeping the original language avoids translation errors and preserves semantic precision.

Translation also introduces ambiguity when handling culturally-specific references, procedural terms, and institutional names. The LLM would need to make assumptions about meaning, increasing the risk of misinterpretation.

If translation is needed, that becomes a separate concern handled after extraction is complete.

## Dates are stored as date-only strings

Dates are stored in `YYYY-MM-DD` format without time or timezone information.

Legal documents typically specify dates without times. Storing dates as date-only strings avoids timezone conversion issues that can shift dates. Date-only storage preserves the exact date as it appears in the document and simplifies date comparisons and queries.

## Language-specific schemas and prompts

The system uses different extraction schemas and prompts based on the detected document language.

**Reasoning:**

Legal terminology and document structures vary by language and legal system. Different languages use different decision types and legal concepts. Language-specific prompts can emphasize language-appropriate legal concepts and citation formats. The system detects language automatically using the `franc` library, then selects the appropriate schema and prompt set.

This isn't based on any formal studies. I thought it would be something fun to have a conversation about.

## Court and office fields can be null

Both `court` and `office` fields are nullable, allowing documents to have neither, one, or both.

**Reasoning:**

Not all legal documents involve courts. Administrative decisions, agency rulings, and regulatory determinations may only involve an administrative office without a judicial body. Conversely, some court decisions may not involve a separate administrative office. Making both fields nullable accommodates the full range of legal document types while maintaining clear separation between judicial bodies (courts) and administrative bodies (offices).

## Using AI SDK with Zod for extraction

The system uses the `ai` package with Zod schemas for structured extraction from LLMs.

**Reasoning:**

We don't strictly need the `ai` package for what we're doing. We could use fetch, the OpenRouter SDK, or OpenAI SDK directly and parse JSON responses manually. We use it for ease of use.
