-- Store whether a calendar item is a completable task or a non-completable event.
ALTER TABLE "Task" ADD COLUMN "itemType" TEXT NOT NULL DEFAULT 'task';

-- Preserve existing event rows created before the explicit item type existed.
UPDATE "Task" SET "itemType" = 'event' WHERE "timeType" = 'event';
