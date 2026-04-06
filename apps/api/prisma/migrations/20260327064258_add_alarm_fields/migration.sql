-- AlterTable
ALTER TABLE "events" ADD COLUMN     "alarmAt" TIMESTAMP(3),
ADD COLUMN     "alarmSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "alarmAt" TIMESTAMP(3),
ADD COLUMN     "alarmSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "events_alarmAt_idx" ON "events"("alarmAt");

-- CreateIndex
CREATE INDEX "todos_alarmAt_idx" ON "todos"("alarmAt");
