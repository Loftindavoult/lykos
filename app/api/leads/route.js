import { db } from "@/lib/db";

// Public, unauthenticated endpoint — the marketing site's self-serve wizard
// calls this so a submission becomes a real pipeline Account instead of
// only firing a mailto:. Deliberately minimal: no email/contact-name
// capture happens here (the wizard is pure multiple-choice by design), so
// staff fill those in once the actual email reply comes in.
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

  const account = await db.account.create({
    data: {
      companyName,
      industry: body.industry ? String(body.industry) : null,
      source: body.source === "wizard" ? "wizard" : "website",
      stage: "Lead",
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
