-- Remove the retired notebook feature while keeping task, note and journal data.
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_notebookId_fkey";
ALTER TABLE "Task" DROP COLUMN IF EXISTS "notebookId";
ALTER TABLE "JournalEntry" DROP COLUMN IF EXISTS "notebookId";
DROP TABLE IF EXISTS "Notebook";
