import { db } from "@/lib/db";
import { createAccount } from "@/lib/actions/crm";
import PipelineBoard from "@/components/PipelineBoard";
import StatCounter from "@/components/StatCounter";

export const dynamic = "force-dynamic";

export default async function CrmDashboard() {
  const accounts = await db.account.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });

  const open = accounts.filter((a) => a.stage !== "Won" && a.stage !== "Lost");
  const won = accounts.filter((a) => a.stage === "Won");
  const lost = accounts.filter((a) => a.stage === "Lost");
  const openValue = open.reduce((s, a) => s + (a.value || 0), 0);
  const decided = won.length + lost.length;
  const winRate = decided ? Math.round((won.length / decided) * 100) : 0;

  const overdueTasks = await db.task.count({
    where: { done: false, dueDate: { lt: new Date() } },
  });

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>Pipeline</h1>
          <p>Lykos Intelligence's own sales pipeline — real accounts, real activity.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-label">Open pipeline value</div>
          <div className="stat-value">
            <StatCounter value={openValue} prefix="$" />
          </div>
          <div className="stat-sub">{open.length} open accounts</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Win rate</div>
          <div className="stat-value">
            <StatCounter value={winRate} suffix="%" />
          </div>
          <div className="stat-sub">
            {won.length} won · {lost.length} lost
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Total accounts</div>
          <div className="stat-value">
            <StatCounter value={accounts.length} />
          </div>
          <div className="stat-sub">all time</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Overdue tasks</div>
          <div className="stat-value">
            <StatCounter value={overdueTasks} />
          </div>
          <div className="stat-sub">across all accounts</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Add an account</h3>
        </div>
        <form action={createAccount} className="inline-form">
          <input type="text" name="companyName" placeholder="Company name" required />
          <input type="text" name="contactName" placeholder="Contact name" />
          <input type="email" name="email" placeholder="Email" />
          <input type="text" name="industry" placeholder="Industry" />
          <input type="number" name="value" placeholder="Deal value ($)" />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </div>

      {accounts.length === 0 ? (
        <div className="panel">
          <div className="empty-row">
            No accounts yet — add one above, or wait for the website/wizard to send the first lead.
          </div>
        </div>
      ) : (
        <PipelineBoard accounts={accounts} />
      )}
    </>
  );
}
