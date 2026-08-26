"use client";

import { useTransition } from "react";
import { advanceStage } from "@/lib/actions/crm";
import { STAGES } from "@/lib/crmConstants";

export default function StagePath({ account }) {
  const [pending, startTransition] = useTransition();
  const currentIdx = STAGES.indexOf(account.stage);

  return (
    <div className="stage-path">
      {STAGES.map((stage, i) => {
        const isInactive = stage === "Inactive";
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
        return (
          <div className={`stage-path-step${isInactive ? " terminal" : ""}`} key={stage}>
            {i > 0 && <div className={`stage-path-line ${i <= currentIdx ? "done" : ""}`} />}
            <button
              type="button"
              className={`stage-path-node ${state}${isInactive ? " terminal" : ""}`}
              disabled={pending}
              onClick={() => startTransition(() => advanceStage(account.id, stage))}
              title={`Move to ${stage}`}
            >
              <span className="stage-path-dot" />
              <span className="stage-path-label">{stage}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
