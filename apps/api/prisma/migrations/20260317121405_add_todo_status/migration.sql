-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "status" "TodoStatus" NOT NULL DEFAULT 'TODO';
