-- Split the single `visible` flag into one flag per output channel and add an
-- optional PDF specific ordering.
--
-- The column is RENAMED rather than dropped and recreated, so every existing
-- sponsor page keeps exactly the web visibility it had before this migration.

ALTER TABLE "sponsor_page_sections" RENAME COLUMN "visible" TO "visibleOnWeb";

ALTER TABLE "sponsor_page_sections"
  ADD COLUMN "visibleInShortPdf" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "visibleInFullPdf"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pdfOrder"          INTEGER;

-- Sensible starting point for sections that already exist: the short pitch
-- keeps only the core narrative, everything else moves to the full dossier.
-- Admins can change all of this per section afterwards.
UPDATE "sponsor_page_sections"
SET "visibleInShortPdf" = false
WHERE "type" NOT IN (
  'HERO',
  'PERSONAL_INTRO',
  'WHY_PARTNERSHIP',
  'TOURNAMENT',
  'REACH',
  'SPONSORING_PROPOSAL',
  'BENEFITS',
  'ABOUT_SWISSHUB',
  'VISION',
  'CTA',
  'CONTACT'
);
