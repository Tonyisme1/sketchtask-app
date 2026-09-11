-- Extend tasks with multi-day and multi-tag metadata used by the client.
ALTER TABLE "Task" ADD COLUMN "startDate" TEXT;
ALTER TABLE "Task" ADD COLUMN "endDate" TEXT;
ALTER TABLE "Task" ADD COLUMN "tags" TEXT;

-- Keep deletions visible to every offline client during reconciliation.
CREATE TABLE "DeletedEntity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedEntity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeletedEntity_userId_entityType_entityId_key"
    ON "DeletedEntity"("userId", "entityType", "entityId");
CREATE INDEX "DeletedEntity_userId_deletedAt_idx"
    ON "DeletedEntity"("userId", "deletedAt");

ALTER TABLE "DeletedEntity"
    ADD CONSTRAINT "DeletedEntity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
