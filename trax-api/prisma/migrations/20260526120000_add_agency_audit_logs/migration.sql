-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('AGENCY_USER', 'SUPER_ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PUBLISH', 'SYNC', 'TEST', 'INVITE');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('AGENCY', 'CLIENT', 'USER', 'REPORT', 'INTEGRATION', 'AUTH');

-- CreateTable
CREATE TABLE "agency_audit_logs" (
    "id" UUID NOT NULL,
    "agencyId" UUID,
    "actorType" "AuditActorType" NOT NULL,
    "userId" UUID,
    "superAdminId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" VARCHAR(255),
    "entityName" VARCHAR(255),
    "description" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agency_audit_logs_agencyId_createdAt_idx" ON "agency_audit_logs"("agencyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "agency_audit_logs_agencyId_entityType_createdAt_idx" ON "agency_audit_logs"("agencyId", "entityType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "agency_audit_logs_action_idx" ON "agency_audit_logs"("action");

-- CreateIndex
CREATE INDEX "agency_audit_logs_createdAt_idx" ON "agency_audit_logs"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "agency_audit_logs" ADD CONSTRAINT "agency_audit_logs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_audit_logs" ADD CONSTRAINT "agency_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
