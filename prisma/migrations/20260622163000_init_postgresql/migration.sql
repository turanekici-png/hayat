-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENEL_BAGIS',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProvider" TEXT NOT NULL DEFAULT 'demo',
    "paymentRef" TEXT,
    "kvkkConsent" BOOLEAN NOT NULL DEFAULT false,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "refundConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT,
    "badge" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "href" TEXT,
    "buttonLabel" TEXT,
    "secondaryHref" TEXT,
    "secondaryButtonLabel" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "layout" TEXT NOT NULL DEFAULT 'CARD',
    "theme" TEXT NOT NULL DEFAULT 'LIGHT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "titleSize" INTEGER NOT NULL DEFAULT 32,
    "subtitleSize" INTEGER NOT NULL DEFAULT 14,
    "bodySize" INTEGER NOT NULL DEFAULT 16,
    "titleColor" TEXT,
    "subtitleColor" TEXT,
    "bodyColor" TEXT,
    "textAlign" TEXT NOT NULL DEFAULT 'left',
    "contentWidth" TEXT NOT NULL DEFAULT 'normal',
    "paddingY" INTEGER NOT NULL DEFAULT 56,
    "cardWidth" TEXT NOT NULL DEFAULT 'normal',
    "minHeight" INTEGER,
    "cardPadding" INTEGER NOT NULL DEFAULT 32,
    "marginTop" INTEGER NOT NULL DEFAULT 0,
    "marginBottom" INTEGER NOT NULL DEFAULT 0,
    "borderRadius" INTEGER NOT NULL DEFAULT 32,
    "borderColor" TEXT,
    "backgroundColor" TEXT,
    "customTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSectionImage" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSectionImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AidApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "householdCount" INTEGER,
    "monthlyIncome" DOUBLE PRECISION,
    "employment" TEXT,
    "vehicleInfo" TEXT,
    "iban" TEXT,
    "aidType" TEXT NOT NULL DEFAULT 'GIDA',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "trackingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AidApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'demo',
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SacrificeOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "shares" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION,
    "type" TEXT NOT NULL DEFAULT 'KURBAN',
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SacrificeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyPage" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENEL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopupSetting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "buttonLabel" TEXT,
    "buttonUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "showOnce" BOOLEAN NOT NULL DEFAULT true,
    "delaySeconds" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionGroupLabel" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionGroupLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_receiptNo_key" ON "Donation"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_paymentRef_key" ON "Donation"("paymentRef");

-- CreateIndex
CREATE UNIQUE INDEX "DonationType_code_key" ON "DonationType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AidApplication_applicationNo_key" ON "AidApplication"("applicationNo");

-- CreateIndex
CREATE UNIQUE INDEX "SacrificeOrder_orderNo_key" ON "SacrificeOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyPage_type_key" ON "PolicyPage"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyPage_slug_key" ON "PolicyPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SectionGroupLabel_type_key" ON "SectionGroupLabel"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "SiteSectionImage" ADD CONSTRAINT "SiteSectionImage_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "SiteSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AidApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsLog" ADD CONSTRAINT "SmsLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AidApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
