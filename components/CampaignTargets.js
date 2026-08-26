"use client";

import { useState, useTransition } from "react";
import { bulkAddLeadsToCampaign } from "@/lib/actions/marketing";
import { stageClass } from "@/lib/crmConstants";

export default function CampaignTargets({ campaign, targets }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="campaign-targets">
      <button type="button" className="campaign-targets-toggle" onClick={() => setOpen((v) => !v)}>
        {campaign.name} — {targets.length} target{targets.length === 1 ? "" : "s"} {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="campaign-targets-body">
          {targets.length > 0 && (
            <div className="campaign-targets-list">
              {targets.map((t) => (
                <div className="campaign-target-row" key={t.id}>
                  <span className={`badge badge-${stageClass(t.stage)}`}>{t.stage}</span>
                  <span className="campaign-target-name">{t.companyName}</span>
                  <span className="campaign-target-industry">{t.industry || "—"}</span>
                </div>
              ))}
            </div>
          )}

          <form
            action={(formData) => startTransition(() => bulkAddLeadsToCampaign(campaign.id, formData))}
            className="inline-form"
            style={{ flexDirection: "column", alignItems: "stretch" }}
          >
            <textarea
              name="leads"
              rows={4}
              placeholder={"One business per line: Company Name | City | Zip | Industry\ne.g. CR Wilson Surveying & Mapping | Wichita Falls | 76310 | Professional Services"}
              style={{ width: "100%", resize: "vertical", fontFamily: "var(--mono)", fontSize: 12 }}
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={pending} style={{ alignSelf: "flex-start", marginTop: 8 }}>
              {pending ? "Adding…" : "Add leads to this campaign"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
