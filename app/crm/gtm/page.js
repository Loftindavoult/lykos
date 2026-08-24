import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function money(n) {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function byIndustry(accounts) {
  const map = new Map();
  for (const a of accounts) {
    const key = a.industry || "Unclassified";
    if (!map.has(key)) map.set(key, { industry: key, total: 0, won: 0, lost: 0, open: 0, openValue: 0 });
    const row = map.get(key);
    row.total += 1;
    if (a.stage === "Won") row.won += 1;
    else if (a.stage === "Lost") row.lost += 1;
    else {
      row.open += 1;
      row.openValue += a.value || 0;
    }
  }
  return Array.from(map.values()).map((row) => ({
    ...row,
    winRate: row.won + row.lost ? Math.round((row.won / (row.won + row.lost)) * 100) : null,
    // Room-to-convert score: lots of accounts in a segment but few wins means
    // real, computed opportunity there — not a stalled or already-saturated
    // segment. Ties (e.g. 0 total) never occur since the map only holds
    // industries that appear in the data.
    penetrationGap: row.total / (row.won + 1),
  }));
}

export default async function GtmPage() {
  const accounts = await db.account.findMany({
    include: { activities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const industries = byIndustry(accounts).sort((a, b) => b.total - a.total);
  const underpenetrated = [...industries].sort((a, b) => b.penetrationGap - a.penetrationGap).slice(0, 5);

  const open = accounts.filter((a) => a.stage !== "Won" && a.stage !== "Lost");
  const avgOpenValue = open.length ? open.reduce((s, a) => s + (a.value || 0), 0) / open.length : 0;
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const expansionCandidates = open
    .filter((a) => (a.value || 0) >= avgOpenValue && a.activities[0] && new Date(a.activities[0].createdAt) >= fourteenDaysAgo)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 10);

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>GTM Strategy</h1>
          <p>Where the pipeline actually is, where it's converting, and where the real room to grow sits.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Pipeline by industry</h3>
        </div>
        {industries.length === 0 ? (
          <div className="empty-row">No accounts yet.</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Industry</th>
                <th>Total</th>
                <th>Open</th>
                <th>Open value</th>
                <th>Win rate</th>
              </tr>
            </thead>
            <tbody>
              {industries.map((row) => (
                <tr key={row.industry}>
                  <td>{row.industry}</td>
                  <td>{row.total}</td>
                  <td>{row.open}</td>
                  <td>{money(row.openValue)}</td>
                  <td>{row.winRate == null ? "—" : `${row.winRate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Underpenetrated segments</h3>
        </div>
        <div className="insight-list">
          {underpenetrated.length === 0 && <div className="empty-row">Not enough data yet.</div>}
          {underpenetrated.map((row) => (
            <div className="insight-item" key={row.industry}>
              <strong>{row.industry}</strong> — {row.total} account{row.total === 1 ? "" : "s"} in the pipeline but
              only {row.won} won so far. Real volume here, real room to convert.
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Expansion candidates</h3>
        </div>
        {expansionCandidates.length === 0 ? (
          <div className="empty-row">
            No open accounts currently clear both bars: above-average deal value and activity in the last 14 days.
          </div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Last touch</th>
              </tr>
            </thead>
            <tbody>
              {expansionCandidates.map((a) => (
                <tr key={a.id}>
                  <td>{a.companyName}</td>
                  <td>{a.industry || "—"}</td>
                  <td>{a.stage}</td>
                  <td>{money(a.value)}</td>
                  <td>{new Date(a.activities[0].createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
