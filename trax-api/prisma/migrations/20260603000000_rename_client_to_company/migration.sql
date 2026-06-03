-- Migration: Rename clients table to companies and update all related tables
-- This migration renames the "clients" concept to "companies" throughout the database.

-- Step 1: Rename tables
ALTER TABLE clients RENAME TO companies;
ALTER TABLE user_clients RENAME TO user_companies;
ALTER TABLE client_meta_configs RENAME TO company_meta_configs;

-- Step 2: Rename columns (clientId → companyId)
ALTER TABLE user_companies RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE integrations RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE reports RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE scheduled_posts RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE company_meta_configs RENAME COLUMN "clientId" TO "companyId";

-- Step 3: Update foreign key constraints (Postgres drops and recreates)
-- Note: Prisma will handle FK recreation via migrate dev; this is informational.

-- Step 4: Rename notify_new_client column in users
ALTER TABLE users RENAME COLUMN "notify_new_client" TO "notify_new_company";

-- Step 5: Update enums
-- UserRole: CLIENT_VIEWER → COMPANY_VIEWER
ALTER TYPE "UserRole" RENAME VALUE 'CLIENT_VIEWER' TO 'COMPANY_VIEWER';

-- AuditEntityType: CLIENT → COMPANY
ALTER TYPE "AuditEntityType" RENAME VALUE 'CLIENT' TO 'COMPANY';

-- Step 6: Update sequences/indexes (Postgres renames indexes automatically when tables are renamed)

-- Step 7: Update agency plan column
ALTER TABLE agencies RENAME COLUMN "maxClients" TO "maxCompanies";
