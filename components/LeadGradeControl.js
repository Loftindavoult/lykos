"use client";

import { useTransition } from "react";
import { updateLeadScore } from "@/lib/actions/crm";
import { GRADE_LABELS } from "@/lib/leadScore";

export default function LeadGradeControl({ account }) {
  const [pending, startTransition] = useTransition();

  return (
    <span className="lead-grade-control">
      {account.leadScore ? (
        <span className={`lead-grade-inline grade-${account.leadScore}`}>{account.leadScore}</span>
      ) : (
        <span className="lead-grade-inline grade-none">—</span>
      )}
      <select
        value={account.leadScore || ""}
        disabled={pending}
        title={account.leadScore ? GRADE_LABELS[account.leadScore] : "Ungraded"}
        onChange={(e) => {
          const formData = new FormData();
          formData.set("leadScore", e.target.value);
          startTransition(() => updateLeadScore(account.id, formData));
        }}
      >
        <option value="">Ungraded</option>
        <option value="A">A — best fit</option>
        <option value="B">B — good fit</option>
        <option value="C">C — situational</option>
        <option value="D">D — poor fit</option>
      </select>
      {account.leadScoreAuto && account.leadScore && <span className="lead-grade-auto-tag">auto</span>}
    </span>
  );
}
