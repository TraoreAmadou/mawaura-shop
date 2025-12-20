/*
  Warnings:

  - You are about to drop the column `paymentProviderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProviderSessionId` on the `Order` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "customerName" TEXT,
    "totalCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingStatus" TEXT NOT NULL DEFAULT 'PREPARATION',
    "shippingAddress" TEXT,
    "notes" TEXT,
    "paymentProvider" TEXT NOT NULL DEFAULT 'CINETPAY',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentTransactionId" TEXT,
    "paymentMethod" TEXT,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerName", "email", "id", "notes", "paymentProvider", "paymentStatus", "shippingAddress", "shippingStatus", "status", "totalCents", "updatedAt", "userId") SELECT "createdAt", "customerName", "email", "id", "notes", coalesce("paymentProvider", 'CINETPAY') AS "paymentProvider", "paymentStatus", "shippingAddress", "shippingStatus", "status", "totalCents", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_paymentTransactionId_key" ON "Order"("paymentTransactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
