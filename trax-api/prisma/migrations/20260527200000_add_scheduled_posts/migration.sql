-- CreateEnum
CREATE TYPE "ScheduledPostStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED');
CREATE TYPE "ScheduledPostPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK');

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "platform" "ScheduledPostPlatform" NOT NULL,
    "caption" TEXT,
    "mediaUrl" VARCHAR(1024) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledPostStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" VARCHAR(255),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scheduled_posts_agencyId_clientId_status_idx" ON "scheduled_posts"("agencyId", "clientId", "status");
CREATE INDEX "scheduled_posts_scheduledAt_status_idx" ON "scheduled_posts"("scheduledAt", "status");

ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
