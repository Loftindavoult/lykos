"use client";

import { useMemo, useState, useTransition } from "react";
import { advanceStage } from "@/lib/actions/crm";
import { STAGES, nextStage } from "@/lib/crmConstants";
import { calculateStripeFee, money, money2 } from "@/lib/pricing";
import AccountDetailModal from "./AccountDetailModal";

function LeadCard({ account, onOpen, onDragStart, onDragEnd, dragging }) {
  const [pending, startTransition] = useTransition();
  const next = nextStage(account.stage);
  const lastActivity = account.activities[0];

  return (
    <div
      className={`lead-card${dragging ? " dragging" : ""}`}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", account.id);
        onDragStart(account.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(account.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(account.id);
      }}
    >
      <div className="lead-card-company">{account.companyName}</div>
      <div className="lead-card-meta">
        {[account.contactName, account.industry].filter(Boolean).join(" · ") || "No details yet"}
        {lastActivity ? ` · last touch ${new Date(lastActivity.createdAt).toLocaleDateString()}` : ""}
      </div>
      <div className="lead-card-value">{account.mrr ? `${money(account.mrr)}/mo MRR` : "No MRR set"}</div>
      {account.mrr > 0 && (
        <div className="lead-card-net">
          ≈ {money2(account.mrr - calculateStripeFee(account.mrr, account.billingMethod))} net after {account.billingMethod === "ach" ? "ACH" : "card"} fee
        </div>
      )}
      {next && (
        <button
          type="button"
          className="lead-card-advance"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => {
              advanceStage(account.id, next);
            });
          }}
        >
          Move to {next} →
        </button>
      )}
    </div>
  );
}

export default function PipelineBoard({ accounts }) {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      [a.companyName, a.contactName, a.industry].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [accounts, search]);

  const active = accounts.find((a) => a.id === activeId) || null;

  function handleDrop(e, stage) {
    e.preventDefault();
    setDragOverStage(null);
    const accountId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!accountId) return;
    const dragged = accounts.find((a) => a.id === accountId);
    if (!dragged || dragged.stage === stage) return;
    startTransition(() => {
      advanceStage(accountId, stage);
    });
  }

  return (
    <>
      <div className="board-toolbar">
        <input
          className="board-search"
          type="text"
          placeholder="Search company, contact, industry…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="board">
        {STAGES.map((stage) => {
          const col = filtered.filter((a) => a.stage === stage);
          return (
            <div
              className={`board-col${dragOverStage === stage ? " drag-over" : ""}`}
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverStage !== stage) setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="board-col-head">
                <span className="board-col-title">{stage}</span>
                <span className="board-col-count">{col.length}</span>
              </div>
              <div className="board-col-body">
                {col.length === 0 && <div className="board-col-empty">No accounts</div>}
                {col.map((a) => (
                  <LeadCard
                    key={a.id}
                    account={a}
                    onOpen={setActiveId}
                    onDragStart={setDraggingId}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStage(null);
                    }}
                    dragging={draggingId === a.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {active && <AccountDetailModal account={active} onClose={() => setActiveId(null)} />}
    </>
  );
}
