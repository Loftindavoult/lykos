-- Add first-class contact-link fields to Account
ALTER TABLE "Account" ADD COLUMN "website" TEXT;
ALTER TABLE "Account" ADD COLUMN "socialUrl" TEXT;

-- Backfill from the structured import notes the WF-100mi Aug 2026 lead batch
-- arrived with (pushed through /api/leads before these columns existed; the
-- contact details live in each account's first Note as "Email: x | Facebook: y
-- | ..."). Only fills fields that are still NULL so nothing staff already
-- entered by hand gets clobbered. Safe to re-run: the WHERE clauses make it
-- a no-op once the fields are populated.
WITH parsed AS (
  SELECT DISTINCT ON (a."accountId")
    a."accountId",
    substring(a."text" from 'Email: ([^ |]+)')                                   AS email,
    substring(a."text" from 'Phone: (\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4})')        AS phone,
    substring(a."text" from 'Site: ([^ |]+)')                                    AS website,
    COALESCE(
      substring(a."text" from 'Facebook: ([^ |]+)'),
      substring(a."text" from 'Instagram: ([^ |]+)')
    )                                                                            AS social
  FROM "Activity" a
  WHERE a."text" LIKE '%campaign: WF-100mi Aug 2026%'
  ORDER BY a."accountId", a."createdAt" ASC
)
UPDATE "Account" acc
SET
  "email"     = COALESCE(acc."email", parsed.email),
  "phone"     = COALESCE(acc."phone", parsed.phone),
  "website"   = COALESCE(acc."website", parsed.website),
  "socialUrl" = COALESCE(acc."socialUrl", parsed.social)
FROM parsed
WHERE acc."id" = parsed."accountId";
