-- Yalnizca ekleme yapar; mevcut veriler degismez.

-- AlterTable
ALTER TABLE "SiteSection" ADD COLUMN "goalValue" DOUBLE PRECISION;
ALTER TABLE "SiteSection" ADD COLUMN "currentValue" DOUBLE PRECISION;
ALTER TABLE "SiteSection" ADD COLUMN "goalUnit" TEXT;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "registryNo" TEXT,
    "affiliationNote" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "footerAbout" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "youtubeUrl" TEXT,
    "donationImpacts" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
