-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileType" TEXT,
    "originalFileName" TEXT,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "dateOfDecision" TEXT,
    "office" TEXT,
    "court" TEXT,
    "caseNumber" TEXT,
    "summary" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Result_caseNumber_idx" ON "Result"("caseNumber");

-- CreateIndex
CREATE INDEX "Result_court_idx" ON "Result"("court");

-- CreateIndex
CREATE INDEX "Result_dateOfDecision_idx" ON "Result"("dateOfDecision");

-- CreateIndex
CREATE INDEX "Result_language_idx" ON "Result"("language");
