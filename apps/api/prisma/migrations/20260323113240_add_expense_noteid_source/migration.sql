-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "noteId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';
