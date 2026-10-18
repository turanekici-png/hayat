-- Yalnizca ekleme yapar; mevcut veriler degismez. Varsayilan: basvuru acik (mevcut davranis).

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "applicationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "applicationUrl" TEXT;
