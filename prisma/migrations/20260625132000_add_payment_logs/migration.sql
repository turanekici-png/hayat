-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "donationId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'vakifkatilim',
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentRef" TEXT,
    "responseCode" TEXT,
    "message" TEXT,
    "requestMethod" TEXT,
    "callbackUrl" TEXT,
    "ipAddress" TEXT,
    "requestData" TEXT,
    "responseData" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentLog_donationId_idx" ON "PaymentLog"("donationId");

-- CreateIndex
CREATE INDEX "PaymentLog_paymentRef_idx" ON "PaymentLog"("paymentRef");

-- CreateIndex
CREATE INDEX "PaymentLog_status_idx" ON "PaymentLog"("status");

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
