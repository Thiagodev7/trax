-- CreateTable: super_admins
CREATE TABLE "super_admins" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "email"        VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "name"         VARCHAR(255) NOT NULL,
    "isActive"     BOOLEAN      NOT NULL DEFAULT true,
    "lastLoginAt"  TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");
