-- Preferências de notificação por e-mail (usuário da agência)
ALTER TABLE "users" ADD COLUMN "notify_report_published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notify_integration_errors" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notify_new_client" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "notify_weekly_summary" BOOLEAN NOT NULL DEFAULT true;
