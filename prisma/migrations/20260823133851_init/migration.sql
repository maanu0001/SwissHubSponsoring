-- CreateEnum
CREATE TYPE "SponsorStatus" AS ENUM ('DRAFT', 'NOT_CONTACTED', 'CONTACTED', 'IN_TALKS', 'CONFIRMED', 'DECLINED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PageVisibility" AS ENUM ('PUBLIC', 'PASSWORD_PROTECTED');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('MONEY', 'PRIZES', 'GAME_KEYS', 'HARDWARE', 'SERVICES', 'COMBINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('PLANNED', 'OPEN', 'RUNNING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaSourceType" AS ENUM ('UPLOAD', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('STANDARD', 'MAIN_SPONSOR', 'HARDWARE_PARTNER', 'KEY_GIVEAWAY_PARTNER', 'IT_TECH_PARTNER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'PERSONAL_INTRO', 'WHY_PARTNERSHIP', 'TOURNAMENT', 'REACH', 'SPONSORING_PROPOSAL', 'BENEFITS', 'BUDGET_USAGE', 'VISION', 'ABOUT_SWISSHUB', 'TOURNAMENT_HISTORY', 'PAST_PARTNERS', 'TWITCH_VOD', 'SOCIAL_PROOF', 'CTA', 'CUSTOM_TEXT', 'GALLERY', 'STATS', 'PROCESS', 'CONTACT', 'RICH_TEXT');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'TEXT', 'NUMBER', 'BOOLEAN', 'JSON', 'COLOR', 'MEDIA', 'HTML');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'STATUS_CHANGE', 'PUBLISH', 'UNPUBLISH', 'PASSWORD_SET', 'PASSWORD_REMOVED', 'UPLOAD');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "altText" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "sourceType" "MediaSourceType" NOT NULL DEFAULT 'UPLOAD',
    "filePath" TEXT,
    "externalUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoId" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "internalNotes" TEXT,
    "status" "SponsorStatus" NOT NULL DEFAULT 'DRAFT',
    "lastContactDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "format" TEXT,
    "participantCount" INTEGER,
    "expectedParticipantCount" INTEGER,
    "streamViewerCount" INTEGER,
    "status" "TournamentStatus" NOT NULL DEFAULT 'PLANNED',
    "twitchUrl" TEXT,
    "vodUrl" TEXT,
    "heroImageId" TEXT,
    "internalNotes" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_media" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tournament_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsoring_benefits" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Allgemein',
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultBenefit" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsoring_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "TemplateType" NOT NULL DEFAULT 'STANDARD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "structure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_template_benefits" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "page_template_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_pages" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "templateId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "PageVisibility" NOT NULL DEFAULT 'PUBLIC',
    "passwordHash" TEXT,
    "requestedSupportType" "SupportType" NOT NULL DEFAULT 'MONEY',
    "requestedAmount" DECIMAL(12,2),
    "requestedSupportText" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "heroImageId" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_page_sections" (
    "id" TEXT NOT NULL,
    "sponsorPageId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "data" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_page_benefits" (
    "id" TEXT NOT NULL,
    "sponsorPageId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "customTitle" TEXT,
    "customDescription" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sponsor_page_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views_daily" (
    "id" TEXT NOT NULL,
    "sponsorPageId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "page_views_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_references" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoId" TEXT,
    "website" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "data" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "label" TEXT,
    "group" TEXT NOT NULL DEFAULT 'general',
    "order" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "login_attempts_key_createdAt_idx" ON "login_attempts"("key", "createdAt");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sponsors_slug_key" ON "sponsors"("slug");

-- CreateIndex
CREATE INDEX "sponsors_status_idx" ON "sponsors"("status");

-- CreateIndex
CREATE INDEX "sponsors_updatedAt_idx" ON "sponsors"("updatedAt");

-- CreateIndex
CREATE INDEX "sponsors_companyName_idx" ON "sponsors"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_startDate_idx" ON "tournaments"("startDate");

-- CreateIndex
CREATE INDEX "tournament_media_tournamentId_order_idx" ON "tournament_media"("tournamentId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_media_tournamentId_mediaId_key" ON "tournament_media"("tournamentId", "mediaId");

-- CreateIndex
CREATE INDEX "sponsoring_benefits_category_order_idx" ON "sponsoring_benefits"("category", "order");

-- CreateIndex
CREATE UNIQUE INDEX "page_templates_slug_key" ON "page_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "page_template_benefits_templateId_benefitId_key" ON "page_template_benefits"("templateId", "benefitId");

-- CreateIndex
CREATE UNIQUE INDEX "sponsor_pages_slug_key" ON "sponsor_pages"("slug");

-- CreateIndex
CREATE INDEX "sponsor_pages_status_idx" ON "sponsor_pages"("status");

-- CreateIndex
CREATE INDEX "sponsor_pages_sponsorId_idx" ON "sponsor_pages"("sponsorId");

-- CreateIndex
CREATE INDEX "sponsor_pages_updatedAt_idx" ON "sponsor_pages"("updatedAt");

-- CreateIndex
CREATE INDEX "sponsor_page_sections_sponsorPageId_order_idx" ON "sponsor_page_sections"("sponsorPageId", "order");

-- CreateIndex
CREATE INDEX "sponsor_page_benefits_sponsorPageId_order_idx" ON "sponsor_page_benefits"("sponsorPageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "sponsor_page_benefits_sponsorPageId_benefitId_key" ON "sponsor_page_benefits"("sponsorPageId", "benefitId");

-- CreateIndex
CREATE UNIQUE INDEX "page_views_daily_sponsorPageId_day_key" ON "page_views_daily"("sponsorPageId", "day");

-- CreateIndex
CREATE INDEX "partner_references_order_idx" ON "partner_references"("order");

-- CreateIndex
CREATE UNIQUE INDEX "site_sections_key_key" ON "site_sections"("key");

-- CreateIndex
CREATE INDEX "site_sections_order_idx" ON "site_sections"("order");

-- CreateIndex
CREATE INDEX "site_settings_group_order_idx" ON "site_settings"("group", "order");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_heroImageId_fkey" FOREIGN KEY ("heroImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_media" ADD CONSTRAINT "tournament_media_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_media" ADD CONSTRAINT "tournament_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_template_benefits" ADD CONSTRAINT "page_template_benefits_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "page_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_template_benefits" ADD CONSTRAINT "page_template_benefits_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "sponsoring_benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_pages" ADD CONSTRAINT "sponsor_pages_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_pages" ADD CONSTRAINT "sponsor_pages_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_pages" ADD CONSTRAINT "sponsor_pages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "page_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_pages" ADD CONSTRAINT "sponsor_pages_heroImageId_fkey" FOREIGN KEY ("heroImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_page_sections" ADD CONSTRAINT "sponsor_page_sections_sponsorPageId_fkey" FOREIGN KEY ("sponsorPageId") REFERENCES "sponsor_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_page_benefits" ADD CONSTRAINT "sponsor_page_benefits_sponsorPageId_fkey" FOREIGN KEY ("sponsorPageId") REFERENCES "sponsor_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_page_benefits" ADD CONSTRAINT "sponsor_page_benefits_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "sponsoring_benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views_daily" ADD CONSTRAINT "page_views_daily_sponsorPageId_fkey" FOREIGN KEY ("sponsorPageId") REFERENCES "sponsor_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_references" ADD CONSTRAINT "partner_references_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
