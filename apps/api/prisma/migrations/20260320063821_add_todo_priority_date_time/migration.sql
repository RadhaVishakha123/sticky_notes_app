-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "dueTime" TEXT,
ADD COLUMN     "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM';
