-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "borderRadius" VARCHAR(20) NOT NULL DEFAULT 'medium',
ADD COLUMN     "loginBackgroundUrl" VARCHAR(1024),
ADD COLUMN     "loginLayout" VARCHAR(20) NOT NULL DEFAULT 'centered',
ADD COLUMN     "loginSubtitle" VARCHAR(255),
ADD COLUMN     "loginTitle" VARCHAR(255),
ADD COLUMN     "portalLayout" VARCHAR(20) NOT NULL DEFAULT 'sidebar',
ADD COLUMN     "themeMode" VARCHAR(20) NOT NULL DEFAULT 'dark';
