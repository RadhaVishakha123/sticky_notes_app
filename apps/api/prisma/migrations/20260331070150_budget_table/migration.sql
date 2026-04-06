/*
  Warnings:

  - A unique constraint covering the columns `[userId,month]` on the table `budgets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `month` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "budgets_userId_key";

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "month" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "budgets_userId_idx" ON "budgets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_userId_month_key" ON "budgets"("userId", "month");
