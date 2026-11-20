-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "StoreState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "grade" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "buyPrice" DOUBLE PRECISION,
    "exchangePrice" DOUBLE PRECISION,
    "requiresSerial" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "payments" JSONB,
    "serials" JSONB,
    "customerId" TEXT,
    "tillId" TEXT,
    "cashReceived" DOUBLE PRECISION,
    "changeDue" DOUBLE PRECISION,
    "refundedAt" BIGINT,
    "originalSaleId" TEXT,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "customerId" TEXT,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDoc" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "KnowledgeDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSkill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL,

    CONSTRAINT "AiSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Till" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "openedAt" BIGINT,
    "openedBy" TEXT,
    "openingFloat" DOUBLE PRECISION NOT NULL,
    "closedAt" BIGINT,
    "closedBy" TEXT,
    "expectedCash" DOUBLE PRECISION,
    "countedCash" DOUBLE PRECISION,
    "variance" DOUBLE PRECISION,
    "shortageReason" TEXT,
    "managerTag" TEXT,

    CONSTRAINT "Till_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCart" (
    "id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "customerId" TEXT,
    "discount" DOUBLE PRECISION NOT NULL,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "SavedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "receiptFooter" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL,
    "browserModel" TEXT NOT NULL,
    "kbEnabled" BOOLEAN NOT NULL,
    "skillsEnabled" BOOLEAN NOT NULL,
    "activeTillId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_receiptNo_key" ON "Sale"("receiptNo");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_tillId_idx" ON "Sale"("tillId");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftVoucher_code_key" ON "GiftVoucher"("code");

-- CreateIndex
CREATE INDEX "GiftVoucher_customerId_idx" ON "GiftVoucher"("customerId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftVoucher" ADD CONSTRAINT "GiftVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

