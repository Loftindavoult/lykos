import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { advanceStage, addActivity, addTask } from "@/lib/actions/crm";
import { STAGES, ACTIVITY_TYPES } from "@/lib/crmConstants";
import TaskToggle from "@/components/TaskToggle";

export const dynamic = "force-dynamic";

function money(n) {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US");
}

export default async function AccountDetailPage({ params }) {
  const { id } = await params;
  const account = await db.account.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!account) notFound();

  const advanceStageForAccount = async (formData) => {
    "use server";
    await advanceStage(account.id, String(formData.get("stage")));
  };
  const addActivityForAccount = addActivity.bind(null, account.id);
  const addTaskForAccount = addTask.bind(null, account.id);

  return (
    <>
      <div className="crm-head">
        <h1>{account.companyName}</h1>
        <p>
          {account.contactName || "No contact name on file"} · {account.email || "no email"} · {account.industry || "industry unknown"}
        </p>
        <form action={advanceStageForAccount} className="stage-form">
          <span className={`badge badge-${account.stage}`}>{account.stage}</span>
          <select name="stage" defaultValue={account.stage}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" type="submit">
            Update stage
          </button>
          <span style={{ marginLeft: "auto", color: "var(--ink-dim)", fontSize: 13 }}>
            Deal value: {money(account.value)} · Source: {account.source}
          </span>
        </form>
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
          <form action={addActivityForAccount} className="inline-form">
            <select name="type" defaultValue="Note">
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input type="text" name="text" placeholder="What happened?" required />
            <button className="btn btn-primary" type="submit">
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
          <form action={addTaskForAccount} className="inline-form">
            <input type="text" name="text" placeholder="New task" required />
            <input type="date" name="dueDate" />
            <button className="btn btn-primary" type="submit">
              Add
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
