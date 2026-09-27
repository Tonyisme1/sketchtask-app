-- Preserve existing notes while adding the title required by the synchronized
-- Notes workspace. Existing sticky notes become untitled notes.
ALTER TABLE "StickyNote" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
