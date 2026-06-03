-- AlterTable
ALTER TABLE "companies" RENAME CONSTRAINT "clients_pkey" TO "companies_pkey";

-- AlterTable
ALTER TABLE "company_meta_configs" RENAME CONSTRAINT "client_meta_configs_pkey" TO "company_meta_configs_pkey";

-- AlterTable
ALTER TABLE "super_admins" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_companies" RENAME CONSTRAINT "user_clients_pkey" TO "user_companies_pkey";

-- RenameForeignKey
ALTER TABLE "companies" RENAME CONSTRAINT "clients_agencyId_fkey" TO "companies_agencyId_fkey";

-- RenameForeignKey
ALTER TABLE "company_meta_configs" RENAME CONSTRAINT "client_meta_configs_clientId_fkey" TO "company_meta_configs_companyId_fkey";

-- RenameForeignKey
ALTER TABLE "integrations" RENAME CONSTRAINT "integrations_clientId_fkey" TO "integrations_companyId_fkey";

-- RenameForeignKey
ALTER TABLE "reports" RENAME CONSTRAINT "reports_clientId_fkey" TO "reports_companyId_fkey";

-- RenameForeignKey
ALTER TABLE "scheduled_posts" RENAME CONSTRAINT "scheduled_posts_clientId_fkey" TO "scheduled_posts_companyId_fkey";

-- RenameForeignKey
ALTER TABLE "user_companies" RENAME CONSTRAINT "user_clients_clientId_fkey" TO "user_companies_companyId_fkey";

-- RenameForeignKey
ALTER TABLE "user_companies" RENAME CONSTRAINT "user_clients_userId_fkey" TO "user_companies_userId_fkey";

-- RenameIndex
ALTER INDEX "clients_agencyId_idx" RENAME TO "companies_agencyId_idx";

-- RenameIndex
ALTER INDEX "clients_agencyId_isActive_idx" RENAME TO "companies_agencyId_isActive_idx";

-- RenameIndex
ALTER INDEX "client_meta_configs_clientId_key" RENAME TO "company_meta_configs_companyId_key";

-- RenameIndex
ALTER INDEX "integrations_agencyId_clientId_idx" RENAME TO "integrations_agencyId_companyId_idx";

-- RenameIndex
ALTER INDEX "integrations_clientId_provider_externalAccount_key" RENAME TO "integrations_companyId_provider_externalAccount_key";

-- RenameIndex
ALTER INDEX "reports_agencyId_clientId_createdAt_idx" RENAME TO "reports_agencyId_companyId_createdAt_idx";

-- RenameIndex
ALTER INDEX "reports_agencyId_clientId_idx" RENAME TO "reports_agencyId_companyId_idx";

-- RenameIndex
ALTER INDEX "scheduled_posts_agencyId_clientId_status_idx" RENAME TO "scheduled_posts_agencyId_companyId_status_idx";

-- RenameIndex
ALTER INDEX "user_clients_agencyId_userId_idx" RENAME TO "user_companies_agencyId_userId_idx";
