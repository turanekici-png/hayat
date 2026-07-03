CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "logoUrl" TEXT,
    "branch" TEXT,
    "accountName" TEXT,
    "type" TEXT,
    "description" TEXT,
    "tlIban" TEXT,
    "dolarIban" TEXT,
    "euroIban" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BankAccount_isActive_idx" ON "BankAccount"("isActive");
CREATE INDEX "BankAccount_sortOrder_idx" ON "BankAccount"("sortOrder");
