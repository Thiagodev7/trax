-- CreateTable
CREATE TABLE "client_meta_configs" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "products" JSONB NOT NULL,
    "states" JSONB NOT NULL,
    "stateBudgetByProduct" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "reachFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.72,
    "secondaryAccountColor" VARCHAR(7) NOT NULL DEFAULT '#06B6D4',
    "sparklineDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_meta_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_meta_configs_clientId_key" ON "client_meta_configs"("clientId");

-- AddForeignKey
ALTER TABLE "client_meta_configs" ADD CONSTRAINT "client_meta_configs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
