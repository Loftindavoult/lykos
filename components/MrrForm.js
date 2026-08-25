"use client";

import { useState, useTransition } from "react";
import { updateMrr } from "@/lib/actions/crm";
import { PACKAGE_LEVELS, INVENTORY_ADDON, CONSULTING_RETAINER, calculateMrr, money } from "@/lib/pricing";

export default function MrrForm({ account }) {
  const [custom, setCustom] = useState(account.mrrCustom);
  const [packageLevel, setPackageLevel] = useState(account.packageLevel || "");
  const [users, setUsers] = useState(account.userCount ?? 0);
  const [inventory, setInventory] = useState(account.addonInventory);
  const [consulting, setConsulting] = useState(account.addonConsulting);
  const [customValue, setCustomValue] = useState(account.mrr ?? 0);
  const [pending, startTransition] = useTransition();

  const preview = custom
    ? customValue
    : calculateMrr({ packageLevel, users, inventoryAddon: inventory, consultingRetainer: consulting });

  return (
    <form
      action={(formData) => startTransition(() => updateMrr(account.id, formData))}
      style={{ padding: "16px 20px" }}
    >
      <label className="mrr-custom-toggle">
        <input
          type="checkbox"
          name="mrrCustom"
          checked={custom}
          onChange={(e) => setCustom(e.target.checked)}
        />
        Custom MRR override
      </label>

      {custom ? (
        <div className="field" style={{ marginTop: 10 }}>
          <label htmlFor="mrrValue">Custom MRR ($/mo)</label>
          <input
            id="mrrValue"
            type="number"
            name="mrrValue"
            min="0"
            value={customValue}
            onChange={(e) => setCustomValue(Number(e.target.value))}
          />
        </div>
      ) : (
        <>
          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor="packageLevel">Package level</label>
            <select
              id="packageLevel"
              name="packageLevel"
              value={packageLevel}
              onChange={(e) => setPackageLevel(e.target.value)}
            >
              <option value="">— choose a level —</option>
              {PACKAGE_LEVELS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label} — ${l.base}/mo{l.perUser ? ` + $${l.perUser}/user` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="userCount">Users</label>
            <input
              id="userCount"
              type="number"
              name="userCount"
              min="0"
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
            />
          </div>
          <label className="mrr-addon-row">
            <input type="checkbox" name="addonInventory" checked={inventory} onChange={(e) => setInventory(e.target.checked)} />
            + {INVENTORY_ADDON.label} (${INVENTORY_ADDON.base}/mo + ${INVENTORY_ADDON.perUser}/user)
          </label>
          <label className="mrr-addon-row">
            <input type="checkbox" name="addonConsulting" checked={consulting} onChange={(e) => setConsulting(e.target.checked)} />
            + {CONSULTING_RETAINER.label} (${CONSULTING_RETAINER.base}/mo flat)
          </label>
        </>
      )}

      <div className="mrr-preview">Calculated MRR: {money(preview)}/mo</div>

      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save MRR"}
      </button>
    </form>
  );
}
