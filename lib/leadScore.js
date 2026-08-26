// Grades how good a fit a business is for what Lykos actually sells (a
// CRM/GTM/marketing/intelligence stack for small-to-growing businesses),
// based on industry — not size or revenue, which the CRM doesn't have.
//
// A = runs on a real client pipeline (contractors, real estate, healthcare,
//     professional/financial services) — the CRM & Pipeline + GTM sweet spot.
// B = local storefront/service business (retail, restaurants, personal
//     services) — good fit for Website & Leads, self-serve territory.
// C = situational fit (manufacturing/wholesale — Inventory & Cash Flow
//     specifically) OR already runs on their own tools (marketing/creative/
//     web agencies — they build websites for a living, low priority).
// D = poor fit (agriculture, mining, utilities, transport, education,
//     government, nonprofit) or a national chain that runs corporate
//     software already.
// null = not enough signal to grade (no industry text to go on).

const ALREADY_HAS_TOOLS = /marketing|advertis|\bcreative\b|web design|graphic design|design studio|branding|\bmedia\b|social media/i;
const CHAIN_OR_CORPORATE = /\b(franchise|corporate)\b/i;
// A trailing "#1234" / "Store #12" style suffix is a common signature of a
// chain/franchise location number, not an independent business — grading
// can't identify every national chain by name, but this catches the pattern.
const LOCATION_NUMBER_SUFFIX = /#\s*\d{3,}\s*$/;

const GRADE_A = /construction|electric|plumb|contractor|surveying|hvac|roofing|real estate|realty|leasing|rental properties|physical therapy|health ?care|medical|clinic|dental|veterinar|law firm|attorney|legal services|accounting|bookkeeping|financial services|insurance|consulting|professional service/i;
const GRADE_B = /retail|storefront|restaurant|food service|caf[eé]|bakery|salon|spa|barber|gym|fitness|recreation|repair|personal care|admin(istrative)? support|staffing/i;
const GRADE_C = /manufactur|wholesale|distribut|logistics/i;
const GRADE_D = /agricultur|farm(ing)?|mining|oil (and|&) gas extraction|utilit|transportation|freight|trucking|warehousing|school|education|nonprofit|non-profit|church|ministry|government|public administration/i;

export function gradeForBusiness({ industry, companyName } = {}) {
  const text = `${industry || ""} ${companyName || ""}`.toLowerCase();
  if (!text.trim()) return null;

  if (LOCATION_NUMBER_SUFFIX.test((companyName || "").trim())) return "D";
  if (ALREADY_HAS_TOOLS.test(text)) return "C";
  if (CHAIN_OR_CORPORATE.test(text)) return "D";
  if (GRADE_D.test(text)) return "D";
  if (GRADE_A.test(text)) return "A";
  if (GRADE_B.test(text)) return "B";
  if (GRADE_C.test(text)) return "C";
  return null;
}

export const GRADE_LABELS = {
  A: "Best fit — runs on a real client pipeline",
  B: "Good fit — local storefront/service business",
  C: "Situational — different need or already tooled up",
  D: "Poor fit for this product",
};
