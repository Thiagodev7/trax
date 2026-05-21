-- AddAgencyPlan migration
-- Adiciona enum AgencyPlan e campos de billing à tabela agencies

-- Cria o enum AgencyPlan
CREATE TYPE "AgencyPlan" AS ENUM ('TRIAL', 'STARTER', 'PRO', 'AGENCY', 'ENTERPRISE');

-- Adiciona as novas colunas à tabela agencies
ALTER TABLE "agencies"
  ADD COLUMN "plan" "AgencyPlan" NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN "stripeCustomerId" VARCHAR(255),
  ADD COLUMN "stripeSubscriptionId" VARCHAR(255),
  ADD COLUMN "maxClients" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "customCss" TEXT,
  ADD COLUMN "supportEmail" VARCHAR(255),
  ADD COLUMN "reportFooter" TEXT;

-- Unique constraints para IDs do Stripe
CREATE UNIQUE INDEX "agencies_stripeCustomerId_key" ON "agencies"("stripeCustomerId");
CREATE UNIQUE INDEX "agencies_stripeSubscriptionId_key" ON "agencies"("stripeSubscriptionId");
