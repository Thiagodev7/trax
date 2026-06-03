-- AlterTable: User — adiciona campos 2FA TOTP
ALTER TABLE "users" ADD COLUMN "totp_secret" VARCHAR(64),
                    ADD COLUMN "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
                    ADD COLUMN "totp_enabled_at" TIMESTAMP(3);

-- AlterTable: Report — adiciona campos IA (sumário + insights)
ALTER TABLE "reports" ADD COLUMN "ai_summary" TEXT,
                      ADD COLUMN "ai_insights" JSONB,
                      ADD COLUMN "ai_generated_at" TIMESTAMP(3);
