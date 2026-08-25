"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { STAGES } from "@/lib/crmConstants";
import { calculateMrr } from "@/lib/pricing";

export async function createAccount(formData) {
  const session = await requireStaff();

  const companyName = String(formData.get("companyName") || "").trim();
  if (!companyName) throw new Error("Company name is required.");

  const account = await db.account.create({
    data: {
      companyName,
      contactName: String(formData.get("contactName") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      industry: String(formData.get("industry") || "").trim() || null,
      value: formData.get("value") ? parseInt(formData.get("value"), 10) : null,
      source: "manual",
      stage: "Lead",
    },
  });

  await db.activity.create({
    data: {
      accountId: account.id,
      type: "Note",
      text: "Account created manually.",
      staffUserId: session.id,
    },
  });

  revalidatePath("/crm");
  return account.id;
}

export async function advanceStage(accountId, stage) {
  await requireStaff();
  if (!STAGES.includes(stage)) throw new Error("Invalid stage.");

  await db.account.update({
    where: { id: accountId },
    data: { stage, ...(stage === "Active" ? { everActive: true } : {}) },
  });
  revalidatePath("/crm");
}

// Either recomputes MRR from a package level + user count (+ optional
// add-ons), or stores a flat custom override — never both at once.
export async function updateMrr(accountId, formData) {
  await requireStaff();

  const isCustom = formData.get("mrrCustom") === "on";
  const billingMethod = formData.get("billingMethod") === "ach" ? "ach" : "card";

  if (isCustom) {
    const mrr = Math.max(0, parseInt(formData.get("mrrValue"), 10) || 0);
    await db.account.update({
      where: { id: accountId },
      data: { mrr, mrrCustom: true, packageLevel: null, userCount: null, addonInventory: false, addonConsulting: false, billingMethod },
    });
  } else {
    const packageLevel = String(formData.get("packageLevel") || "") || null;
    const userCount = Math.max(0, parseInt(formData.get("userCount"), 10) || 0);
    const addonInventory = formData.get("addonInventory") === "on";
    const addonConsulting = formData.get("addonConsulting") === "on";
    const mrr = calculateMrr({ packageLevel, users: userCount, inventoryAddon: addonInventory, consultingRetainer: addonConsulting });

    await db.account.update({
      where: { id: accountId },
      data: { mrr, mrrCustom: false, packageLevel, userCount, addonInventory, addonConsulting, billingMethod },
    });
  }
  revalidatePath("/crm");
}

export async function addActivity(accountId, formData) {
  const session = await requireStaff();
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  await db.activity.create({
    data: {
      accountId,
      type: String(formData.get("type") || "Note"),
      text,
      staffUserId: session.id,
    },
  });
  revalidatePath("/crm");
}

export async function addTask(accountId, formData) {
  const session = await requireStaff();
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  const dueRaw = String(formData.get("dueDate") || "");
  await db.task.create({
    data: {
      accountId,
      text,
      dueDate: dueRaw ? new Date(dueRaw) : null,
      staffUserId: session.id,
    },
  });
  revalidatePath("/crm");
}

export async function toggleTask(accountId, taskId, done) {
  await requireStaff();
  await db.task.update({ where: { id: taskId }, data: { done } });
  revalidatePath("/crm");
}
