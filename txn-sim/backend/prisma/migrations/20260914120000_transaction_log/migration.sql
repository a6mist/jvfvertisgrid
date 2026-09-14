CREATE TABLE "TransactionLogEntry" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "result" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLogEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransactionLogEntry_date_idx" ON "TransactionLogEntry"("date");
CREATE INDEX "TransactionLogEntry_createdAt_idx" ON "TransactionLogEntry"("createdAt");

ALTER TABLE "TransactionLogEntry" ADD CONSTRAINT "TransactionLogEntry_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;