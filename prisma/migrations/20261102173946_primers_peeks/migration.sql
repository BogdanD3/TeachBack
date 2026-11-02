-- CreateTable
CREATE TABLE "Primer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "depth" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Primer_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeachSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "covered" TEXT NOT NULL DEFAULT '',
    "peeks" TEXT NOT NULL DEFAULT '',
    "score" INTEGER,
    "pipSummary" TEXT,
    "evaluation" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "TeachSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeachSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeachSession" ("covered", "evaluation", "finishedAt", "id", "pipSummary", "score", "startedAt", "status", "topicId", "userId") SELECT "covered", "evaluation", "finishedAt", "id", "pipSummary", "score", "startedAt", "status", "topicId", "userId" FROM "TeachSession";
DROP TABLE "TeachSession";
ALTER TABLE "new_TeachSession" RENAME TO "TeachSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Primer_topicId_depth_key" ON "Primer"("topicId", "depth");
