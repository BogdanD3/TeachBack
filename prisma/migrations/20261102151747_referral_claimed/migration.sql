-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "trialEndsAt" DATETIME,
    "bonusDays" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" DATETIME,
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "referralClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("bonusDays", "createdAt", "email", "id", "lastActiveAt", "name", "passwordHash", "plan", "points", "referralCode", "referredById", "streak", "trialEndsAt") SELECT "bonusDays", "createdAt", "email", "id", "lastActiveAt", "name", "passwordHash", "plan", "points", "referralCode", "referredById", "streak", "trialEndsAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
