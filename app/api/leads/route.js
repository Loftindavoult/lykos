import { db } from "@/lib/db";
import { STAGES } from "@/lib/crmConstants";

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

  const account = await db.account.create({
    data: {
      companyName,
      industry: body.industry ? String(body.industry) : null,
      source: body.source === "wizard" ? "wizard" : "website",
      stage,
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
