# Legal Case Document Extraction

A NestJS application that extracts structured information from legal case documents (HTML and PDF) using large language models.

For more details on design decisions and architecture, see [`docs/design.md`](docs/design.md). For potential improvements and production readiness notes, see [`docs/improvements.md`](docs/improvements.md).

## Quick Start

### Using Dev Container

1. **Open in VS Code** and select "Reopen in Container" when prompted
2. **Configure environment** - Edit `.env` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```
3. **Start the application:**
   ```bash
   pnpm start:dev
   ```

The application will be available at `http://localhost:3000`

### Local Development

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenRouter API key:

   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Initialize database:**

   ```bash
   pnpm prisma:migrate:dev
   ```

   **Note:** The application uses SQLite by default for simplicity. The database file is stored at `./dev.db` (or as specified in `DATABASE_URL`).

4. **Start the application:**
   ```bash
   pnpm start:dev
   ```

The application will be available at `http://localhost:3000`

## Usage

### Upload and Process Files

Use the provided script to upload and extract data from legal documents:

```bash
./scripts/upload.sh ./samples/mfkn.html
```

Or use the REST API directly:

```bash
curl -X POST http://localhost:3000/api/extractions/upload \
  -F "file=@./path/to/document.html"
```

### GraphQL API

Access the GraphQL playground at `http://localhost:3000/graphql`

**Query extractions:**

```graphql
query {
  extractions {
    items {
      id
      title
      decisionType
      language
      caseNumber
      dateOfDecision
      court
      office
      summary
      conclusion
    }
    total
    limit
    offset
    hasMore
  }
}
```

**Query by ID:**

```graphql
query {
  extraction(id: "uuid") {
    id
    title
    summary
  }
}
```

**Query with filtering, sorting, and pagination:**

```graphql
query {
  extractions(
    filter: {
      court: "Court of Justice"
      language: "en"
      dateFrom: "2023-01-01"
      dateTo: "2023-12-31"
    }
    sort: { field: DATE_OF_DECISION, order: DESC }
    pagination: { limit: 20, offset: 0 }
  ) {
    items {
      id
      title
      dateOfDecision
      court
    }
    total
    limit
    offset
    hasMore
  }
}
```

**Available filter fields:**

- `court` - Filter by court name (partial match)
- `office` - Filter by office name (partial match)
- `language` - Filter by language (`da` or `en`)
- `decisionType` - Filter by decision type (partial match)
- `caseNumber` - Filter by case number (partial match)
- `dateFrom` - Filter by date of decision from (YYYY-MM-DD)
- `dateTo` - Filter by date of decision to (YYYY-MM-DD)

**Available sort fields:**

- `CREATED_AT` - Sort by creation date
- `DATE_OF_DECISION` - Sort by decision date
- `TITLE` - Sort by title
- `CASE_NUMBER` - Sort by case number

**Sort orders:**

- `ASC` - Ascending
- `DESC` - Descending

## Environment Variables

Required:

- `DATABASE_URL` - SQLite database path (default: `file:./dev.db`)
- `OPENROUTER_API_KEY` - Your OpenRouter API key

Optional:

- `OPENROUTER_MODEL` - Model to use (default: `openai/gpt-5`)
- `PORT` - Application port (default: `3000`)

## Project Structure

```
src/
├── cases/                    # Case extraction module
│   ├── extraction.controller.ts  # REST upload endpoint
│   ├── extraction.service.ts     # Extraction logic
│   ├── extraction.resolver.ts    # GraphQL resolvers
│   ├── extraction.entity.ts      # GraphQL type
│   ├── extraction.schema.ts      # Zod validation schemas
│   └── extraction.prompts.ts     # LLM prompts
├── common/                   # Shared utilities
│   └── utils/
│       └── parser.util.ts    # HTML/PDF parsing
├── prisma/                   # Prisma service
└── config/                   # Configuration
```

## Supported File Types

- HTML documents
- PDF documents

The system automatically detects document language (Danish/English) and uses appropriate extraction prompts.
