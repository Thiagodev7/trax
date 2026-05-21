-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationProvider" ADD VALUE 'INSTAGRAM';
ALTER TYPE "IntegrationProvider" ADD VALUE 'FACEBOOK_PAGE';
ALTER TYPE "IntegrationProvider" ADD VALUE 'NECTAR_CRM';

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "moduleConfig" JSONB;

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "metricType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(255),
    "entityName" VARCHAR(255),
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_metrics_integrationId_date_idx" ON "daily_metrics"("integrationId", "date");

-- CreateIndex
CREATE INDEX "daily_metrics_integrationId_metricType_date_idx" ON "daily_metrics"("integrationId", "metricType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_integrationId_date_metricType_entityId_key" ON "daily_metrics"("integrationId", "date", "metricType", "entityId");

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
