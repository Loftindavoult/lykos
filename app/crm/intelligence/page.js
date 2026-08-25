import { db } from "@/lib/db";
import StatCounter from "@/components/StatCounter";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// Real, rule-based scoring from signals already in the DB — no randomness.
// Starts at 100 and takes deductions for the things that actually predict a
// stalling deal: silence, no activity history at all, overdue work, and
// sitting too long in the same stage.
function scoreAccount(account, now) {
  let score = 100;
  const reasons = [];

  const lastActivity = account.activities[0];
  const daysSinceActivity = lastActivity ? Math.floor((now - new Date(lastActivity.createdAt)) / DAY_MS) : null;

  if (daysSinceActivity == null) {
    score -= 35;
    reasons.push("no activity logged yet");
  } else if (daysSinceActivity >= 30) {
    score -= 35;
    reasons.push(`no activity in ${daysSinceActivity} days`);
  } else if (daysSinceActivity >= 14) {
    score -= 20;
    reasons.push(`no activity in ${daysSinceActivity} days`);
  } else if (daysSinceActivity >= 7)
    score -= 8;

  if (account.activities.length === 0) score -= 10;

  const overdueTasks = account.tasks.filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < now).length;
  if (overdueTasks > 0) {
    score -= Math.min(25, overdueTasks * 10);
    reasons.push(`${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}`);
  }

  const daysInStage = Math.floor((now - new Date(account.updatedAt)) / DAY_MS);
  if (daysInStage >= 45) {
    score -= 20;
    reasons.push(`${daysInStage} days without a stage change`);
  } else if (daysInStage >= 21) {
    score -= 10;
    reasons.push(`${daysInStage} days without a stage change`);
  }

  score = Math.max(0, Math.min(100, score));

  let band;
  if (score >= 85) band = "Thriving";
  else if (score >= 65) band = "Healthy";
  else if (score >= 45) band = "Stable";
  else if (score >= 25) band = "At-risk";
  else band = "Critical";

  return { score, band, reasons, daysSinceActivity, overdueTasks, daysInStage };
}

export default async function IntelligencePage() {
  const now = new Date();
  const accounts = await db.account.findMany({
    where: { stage: { notIn: ["Won", "Lost"] } },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
      tasks: { where: { done: false } },
    },
    orderBy: { updatedAt: "asc" },
  });

  const scored = accounts.map((a) => ({ account: a, ...scoreAccount(a, now) })).sort((a, b) => a.score - b.score);

  const bandCounts = { Critical: 0, "At-risk": 0, Stable: 0, Healthy: 0, Thriving: 0 };
  for (const s of scored) bandCounts[s.band] += 1;

  const noActivity14d = scored.filter((s) => s.daysSinceActivity == null || s.daysSinceActivity >= 14).length;
  const totalOverdue = scored.reduce((sum, s) => sum + s.overdueTasks, 0);
  const stalledStage = scored.filter((s) => s.daysInStage >= 21).length;

  const insights = [];
  if (noActivity14d > 0) {
    insights.push(`${noActivity14d} open account${noActivity14d === 1 ? " has" : "s have"} had no activity in 14+ days.`);
  }
  if (totalOverdue > 0) {
    insights.push(`${totalOverdue} task${totalOverdue === 1 ? " is" : "s are"} overdue across the open pipeline.`);
  }
  if (stalledStage > 0) {
    insights.push(`${stalledStage} account${stalledStage === 1 ? " has" : "s have"} sat in the same stage for 3+ weeks.`);
  }
  if (bandCounts.Critical > 0) {
    insights.push(`${bandCounts.Critical} account${bandCounts.Critical === 1 ? " is" : "s are"} Critical and need attention now.`);
  }
  if (insights.length === 0) insights.push("No open accounts are showing risk signals right now.");

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>Intelligence</h1>
          <p>Account health computed from real activity, tasks, and stage age — not a guess.</p>
        </div>
      </div>

      <div className="stat-row">
        {Object.entries(bandCounts).map(([band, count]) => (
          <div className="stat-tile" key={band}>
            <div className="stat-label">{band}</div>
            <div className="stat-value">
              <StatCounter value={count} />
            </div>
            <div className="stat-sub">open accounts</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Insights</h3>
        </div>
        <div className="insight-list">
          {insights.map((text, i) => (
            <div className="insight-item" key={i}>
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Account health</h3>
        </div>
        {scored.length === 0 ? (
          <div className="empty-row">No open accounts.</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Stage</th>
                <th>Health</th>
                <th>Score</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {scored.map((s) => (
                <tr key={s.account.id}>
                  <td>{s.account.companyName}</td>
                  <td>{s.account.stage}</td>
                  <td>
                    <span className={`health-badge health-${s.band}`}>{s.band}</span>
                  </td>
                  <td>{s.score}</td>
                  <td>{s.reasons.length ? s.reasons.join(" · ") : "on track"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
