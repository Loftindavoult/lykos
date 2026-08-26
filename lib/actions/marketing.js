"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import * as facebook from "@/lib/social/facebook";
import * as linkedin from "@/lib/social/linkedin";
import { gradeForBusiness } from "@/lib/leadScore";

export async function createCampaign(formData) {
  await requireStaff();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Campaign name is required.");

  await db.campaign.create({
    data: {
      name,
      channel: String(formData.get("channel") || "website"),
      spend: formData.get("spend") ? parseInt(formData.get("spend"), 10) : null,
    },
  });
  revalidatePath("/crm/marketing");
}

// Seeds a campaign's real target list — one business per line, pipe-delimited:
// "Company Name | City | Zip | Industry" (city/zip/industry are optional).
// Each becomes a real pipeline Account at "Lead", tagged to this campaign, so
// outreach lists (e.g. a scored prospect list from research) turn directly
// into working leads instead of living in a spreadsheet next to the CRM.
export async function bulkAddLeadsToCampaign(campaignId, formData) {
  await requireStaff();
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found.");

  const raw = String(formData.get("leads") || "");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  const toCreate = lines.map((line) => {
    const [companyName, city, zip, industry] = line.split("|").map((p) => (p || "").trim());
    const name = companyName || line;
    return {
      companyName: name,
      contactName: null,
      industry: industry || null,
      phone: null,
      email: null,
      // City/zip don't have dedicated columns on Account today — folded into
      // a note on the account instead so nothing is silently dropped.
      source: "campaign",
      stage: "Lead",
      campaignId,
      leadScore: gradeForBusiness({ industry, companyName: name }),
      __city: city || null,
      __zip: zip || null,
    };
  });

  for (const lead of toCreate) {
    const { __city, __zip, ...data } = lead;
    const account = await db.account.create({ data });
    const locationNote = [__city, __zip].filter(Boolean).join(" ");
    if (locationNote) {
      await db.activity.create({
        data: { accountId: account.id, type: "Note", text: `Location: ${locationNote}` },
      });
    }
  }

  revalidatePath("/crm/marketing");
  revalidatePath("/crm");
}

export async function assignCampaign(accountId, formData) {
  await requireStaff();
  const campaignId = String(formData.get("campaignId") || "") || null;
  await db.account.update({ where: { id: accountId }, data: { campaignId } });
  revalidatePath("/crm");
  revalidatePath("/crm/marketing");
}

export async function createPost(formData) {
  const session = await requireStaff();
  const caption = String(formData.get("caption") || "").trim();
  const platform = String(formData.get("platform") || "");
  const scheduledAtRaw = String(formData.get("scheduledAt") || "");
  if (!caption || !["facebook", "linkedin"].includes(platform) || !scheduledAtRaw) {
    throw new Error("Platform, caption, and a scheduled date are all required.");
  }

  const socialAccount = await db.socialAccount.findUnique({ where: { platform } });

  await db.socialPost.create({
    data: {
      platform,
      caption,
      scheduledAt: new Date(scheduledAtRaw),
      status: socialAccount ? "scheduled" : "draft",
      socialAccountId: socialAccount?.id || null,
      createdByStaffId: session.id,
    },
  });
  revalidatePath("/crm/marketing");
}

// "Post Now" — immediate, manual publish. True time-based auto-publishing
// (a post firing itself when scheduledAt arrives) needs a real scheduler
// (e.g. a Railway Cron Job hitting a /api/social/publish-due route) and is
// a deliberate follow-up, not built here.
export async function postNow(postId) {
  await requireStaff();
  const post = await db.socialPost.findUnique({ where: { id: postId }, include: { socialAccount: true } });
  if (!post) throw new Error("Post not found.");
  if (!post.socialAccount) {
    throw new Error(`Connect a ${post.platform} account before posting.`);
  }

  try {
    let externalPostId;
    if (post.platform === "facebook") {
      externalPostId = await facebook.publishPost(
        post.socialAccount.accessToken,
        post.socialAccount.externalAccountId,
        post.caption
      );
    } else {
      externalPostId = await linkedin.publishPost(
        post.socialAccount.accessToken,
        post.socialAccount.externalAccountId,
        post.caption
      );
    }
    await db.socialPost.update({
      where: { id: postId },
      data: { status: "posted", externalPostId, failureReason: null },
    });
  } catch (err) {
    await db.socialPost.update({
      where: { id: postId },
      data: { status: "failed", failureReason: err.message },
    });
  }
  revalidatePath("/crm/marketing");
}
