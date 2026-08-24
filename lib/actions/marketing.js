"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import * as facebook from "@/lib/social/facebook";
import * as linkedin from "@/lib/social/linkedin";

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
