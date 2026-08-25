// Lykos Intelligence's own package pricing — the same modules shown on the
// marketing site's roadmap. Cumulative: a client on "Intelligence Layer" is
// paying for every level up through it, plus whichever add-ons apply.
export const PACKAGE_LEVELS = [
  { key: "website_leads", label: "Website & Leads", base: 39, perUser: 0 },
  { key: "crm_pipeline", label: "CRM & Pipeline", base: 49, perUser: 12 },
  { key: "gtm_strategy", label: "GTM Strategy", base: 59, perUser: 12 },
  { key: "marketing", label: "Marketing", base: 79, perUser: 12 },
  { key: "intelligence", label: "Intelligence Layer", base: 149, perUser: 12 },
];

// Not part of the cumulative ladder — the roadmap treats these as optional,
// independent of which core level a client is on.
export const INVENTORY_ADDON = { label: "Inventory & Cash Flow add-on", base: 69, perUser: 12 };
export const CONSULTING_RETAINER = { label: "Operational Consulting retainer", base: 1500, perUser: 0 };

export function calculateMrr({ packageLevel, users, inventoryAddon, consultingRetainer }) {
  const idx = PACKAGE_LEVELS.findIndex((l) => l.key === packageLevel);
  const seats = Math.max(0, Number(users) || 0);
  let total = 0;

  if (idx !== -1) {
    for (const level of PACKAGE_LEVELS.slice(0, idx + 1)) {
      total += level.base + level.perUser * seats;
    }
  }
  if (inventoryAddon) total += INVENTORY_ADDON.base + INVENTORY_ADDON.perUser * seats;
  if (consultingRetainer) total += CONSULTING_RETAINER.base;

  return total;
}

export function money(n) {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}
