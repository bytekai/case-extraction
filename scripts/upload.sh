#!/bin/bash

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <file-path> [api-url]"
    echo "Example: $0 ./samples/mfkn.html"
    exit 1
fi

FILE_PATH="$1"
API_URL="${2:-http://localhost:3000}"

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File not found: $FILE_PATH"
    exit 1
fi

FILE_NAME=$(basename "$FILE_PATH")
CONTENT_TYPE="text/html"
if [[ "$FILE_PATH" == *.pdf ]]; then
    CONTENT_TYPE="application/pdf"
fi

echo "Processing file: $FILE_NAME"
echo "Uploading to: $API_URL/api/extractions/upload"
echo ""

echo "Uploading and processing file..."
RESPONSE=$(curl -s -X POST "$API_URL/api/extractions/upload" \
    -F "file=@$FILE_PATH;type=$CONTENT_TYPE")

ERROR=$(echo "$RESPONSE" | jq -r '.message // .error // empty')
if [ ! -z "$ERROR" ]; then
    echo "Error: $ERROR"
    echo ""
    echo "Full response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

ID=$(echo "$RESPONSE" | jq -r '.id // empty')
if [ -z "$ID" ]; then
    echo "Error: No extraction data in response"
    echo ""
    echo "Full response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo ""
echo "✓ Processing completed successfully!"
echo ""
echo "$RESPONSE" | jq -r '"
═══════════════════════════════════════════════════════════════
EXTRACTION RESULT
═══════════════════════════════════════════════════════════════

ID:            \(.id)
Title:         \(.title)
Decision Type: \(.decisionType)
Language:      \(.language)
Case Number:   \(.caseNumber // "N/A")
Date:          \(.dateOfDecision // "N/A")
Court:         \(.court // "N/A")
Office:        \(.office // "N/A")
Source:        \(.source)
Created:       \(.createdAt)

───────────────────────────────────────────────────────────────
SUMMARY
───────────────────────────────────────────────────────────────
\(.summary)

───────────────────────────────────────────────────────────────
CONCLUSION
───────────────────────────────────────────────────────────────
\(.conclusion)
═══════════════════════════════════════════════════════════════
"'

exit 0
