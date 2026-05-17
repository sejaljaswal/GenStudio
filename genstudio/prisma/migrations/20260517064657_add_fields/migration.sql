-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "steps" INTEGER,
    "seed" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "imageUrl" TEXT,
    "falRequestId" TEXT,
    "errorMessage" TEXT,
    "completedAt" DATETIME,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Generation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Generation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Generation" ("createdAt", "height", "id", "imageUrl", "negativePrompt", "prompt", "seed", "status", "steps", "updatedAt", "width") SELECT "createdAt", "height", "id", "imageUrl", "negativePrompt", "prompt", "seed", "status", "steps", "updatedAt", "width" FROM "Generation";
DROP TABLE "Generation";
ALTER TABLE "new_Generation" RENAME TO "Generation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
