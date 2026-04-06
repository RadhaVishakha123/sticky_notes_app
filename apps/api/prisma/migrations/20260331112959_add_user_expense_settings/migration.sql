-- CreateTable
CREATE TABLE "user_expense_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "summaryTime" TEXT NOT NULL DEFAULT '20:00',
    "budget80AlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "budget100AlertEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_expense_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_expense_settings_userId_key" ON "user_expense_settings"("userId");

-- AddForeignKey
ALTER TABLE "user_expense_settings" ADD CONSTRAINT "user_expense_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
