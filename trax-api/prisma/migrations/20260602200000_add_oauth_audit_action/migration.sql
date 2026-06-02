-- AlterEnum: adiciona OAUTH_CONNECT ao enum AuditAction
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'OAUTH_CONNECT';
