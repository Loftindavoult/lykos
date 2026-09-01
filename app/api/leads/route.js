import { db } from "@/lib/db";
import { STAGES } from "@/lib/crmConstants";
import { gradeForBusiness } from "@/lib/leadScore";

// Public, unauthenticated endpoint — every "Request access" touchpoint on the
// marketing site (nav, hero, footer, cta-band, and the self-serve wizard)
// calls this so a submission becomes a real pipeline Account instead of only
// firing a mailto:. Deliberately minimal: no email/contact-name capture
// happens here (these are all one-click actions by design), so staff fill
// those in once the actual email reply comes in.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const companyName = String(body.companyName || "").trim();
  if (!companyName) {
    return Response.json({ error: "companyName is required." }, { status: 400 });
  }

  // The wizard represents someone who picked/generated an actual website —
  // real intent, not a passive click — so it starts warmer than a plain
  // "Request access" button. Any stage hint is still validated against the
  // real taxonomy so a bad client payload can't inject an arbitrary stage.
  const defaultStage = body.source === "wizard" ? "Opportunity" : "Lead";
  const stage = STAGES.includes(body.stage) ? body.stage : defaultStage;

  const industry = body.industry ? String(body.industry) : null;

  // Optional contact fields — used by bulk/programmatic imports; the one-click
  // marketing-site buttons never send these. Length-capped so an abusive
  // payload can't stuff megabytes into a column.
  const opt = (v, max = 300) => {
    const s = String(v || "").trim();
    return s ? s.slice(0, max) : null;
  };

  const account = await db.account.create({
    data: {
      companyName,
      industry,
      email: opt(body.email),
      phone: opt(body.phone, 40),
      website: opt(body.website),
      socialUrl: opt(body.socialUrl),
      source: body.source === "wizard" ? "wizard" : "website",
      stage,
      leadScore: gradeForBusiness({ industry, companyName }),
    },
  });

  if (body.notes) {
    await db.activity.create({
      data: {
        accountId: account.id,
        type: "Note",
        text: String(body.notes),
      },
    });
  }

  return Response.json({ id: account.id }, { status: 201 });
}
