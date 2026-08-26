"use client";

import { addActivity, addTask } from "@/lib/actions/crm";
import { ACTIVITY_TYPES, stageClass } from "@/lib/crmConstants";
import TaskToggle from "./TaskToggle";
import MrrForm from "./MrrForm";
import StagePath from "./StagePath";

function money(n) {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US");
}

export default function AccountDetailModal({ account, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card hud-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{account.companyName}</h2>
            <p>
              {account.contactName || "No contact name on file"} · {account.email || "no email"} ·{" "}
              {account.industry || "industry unknown"}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="stage-form">
            <span className={`badge badge-${stageClass(account.stage)}`}>{account.stage}</span>
            <span style={{ marginLeft: "auto", color: "var(--dark-dim)", fontSize: 13 }}>
              Deal value: {money(account.value)} · Source: {account.source}
            </span>
          </div>
          <StagePath account={account} />

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head">
              <h3>Subscription (MRR)</h3>
            </div>
            <MrrForm account={account} />
          </div>

          <div className="detail-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>Activity</h3>
              </div>
              <div className="log-list">
                {account.activities.length === 0 && <div className="empty-row">No activity logged yet.</div>}
                {account.activities.map((a) => (
                  <div className="log-item" key={a.id}>
                    <div className="log-type">{a.type}</div>
                    {a.text}
                    <div className="log-date">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <form action={addActivity.bind(null, account.id)} className="inline-form">
                <select name="type" defaultValue="Note">
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input type="text" name="text" placeholder="What happened?" required />
                <button className="btn btn-primary btn-sm" type="submit">
                  Log
                </button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Tasks</h3>
              </div>
              <div>
                {account.tasks.length === 0 && <div className="empty-row">No tasks yet.</div>}
                {account.tasks.map((t) => (
                  <div className={`task-item${t.done ? " done" : ""}`} key={t.id}>
                    <TaskToggle accountId={account.id} taskId={t.id} done={t.done} />
                    <span className="task-text">{t.text}</span>
                    {t.dueDate && <span className="task-due">{new Date(t.dueDate).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
              <form action={addTask.bind(null, account.id)} className="inline-form">
                <input type="text" name="text" placeholder="New task" required />
                <input type="date" name="dueDate" />
                <button className="btn btn-primary btn-sm" type="submit">
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
