import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves the existing marketing site (hero, roadmap, portfolio, sales demo,
// self-serve wizard) exactly as-is — it's a fully self-contained static
// file, already designed and tested. Reading it here instead of rewriting
// it as React components means none of that existing work is put at risk
// while the real backend (login, CRM, lead intake) is added alongside it.
let cachedHtml = null;

export async function GET() {
  if (!cachedHtml) {
    const filePath = path.join(process.cwd(), "public", "marketing-site.html");
    cachedHtml = await readFile(filePath, "utf8");
  }
  return new Response(cachedHtml, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
