import { db } from "@/lib/db";
import { createCampaign, createPost } from "@/lib/actions/marketing";
import PostNowButton from "@/components/PostNowButton";

export const dynamic = "force-dynamic";

function money(n) {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US");
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarCells(year, month, posts) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayPosts = posts.filter((p) => {
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    cells.push({ day, posts: dayPosts });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function MarketingPage({ searchParams }) {
  const params = await searchParams;
  const [campaigns, accounts, facebookAccount, linkedinAccount, posts] = await Promise.all([
    db.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    db.account.findMany({ select: { source: true, stage: true, value: true } }),
    db.socialAccount.findUnique({ where: { platform: "facebook" } }),
    db.socialAccount.findUnique({ where: { platform: "linkedin" } }),
    db.socialPost.findMany({ orderBy: { scheduledAt: "asc" } }),
  ]);

  const now = new Date();
  const cells = buildCalendarCells(now.getFullYear(), now.getMonth(), posts);

  const campaignRows = campaigns.map((c) => {
    const matching = accounts.filter((a) => a.source === c.channel);
    const won = matching.filter((a) => a.stage === "Won");
    return {
      ...c,
      matchingCount: matching.length,
      wonCount: won.length,
      wonValue: won.reduce((s, a) => s + (a.value || 0), 0),
    };
  });

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>Marketing</h1>
          <p>Campaigns, a real content calendar, and real Facebook/LinkedIn posting.</p>
        </div>
      </div>

      {params?.facebook_connected && (
        <div className="form-banner" style={{ background: "rgba(76,175,110,0.12)", border: "1px solid rgba(76,175,110,0.35)", color: "#4caf6e" }}>
          Facebook connected.
        </div>
      )}
      {params?.facebook_error && <div className="form-banner error">Facebook: {params.facebook_error}</div>}
      {params?.linkedin_connected && (
        <div className="form-banner" style={{ background: "rgba(76,175,110,0.12)", border: "1px solid rgba(76,175,110,0.35)", color: "#4caf6e" }}>
          LinkedIn connected.
        </div>
      )}
      {params?.linkedin_error && <div className="form-banner error">LinkedIn: {params.linkedin_error}</div>}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Connected accounts</h3>
        </div>
        <div className="connect-row">
          <div className="connect-tile">
            <h4>Facebook</h4>
            <p>{facebookAccount ? `Connected — posting as Page ${facebookAccount.externalAccountId}.` : "Not connected. Requires a Meta developer app with pages_manage_posts approved."}</p>
            <a className="btn btn-ghost btn-sm" href="/api/auth/facebook/start">
              {facebookAccount ? "Reconnect Facebook" : "Connect Facebook"}
            </a>
          </div>
          <div className="connect-tile">
            <h4>LinkedIn</h4>
            <p>{linkedinAccount ? "Connected — posting as the connected member." : "Not connected. Requires a LinkedIn developer app with Share on LinkedIn approved."}</p>
            <a className="btn btn-ghost btn-sm" href="/api/auth/linkedin/start">
              {linkedinAccount ? "Reconnect LinkedIn" : "Connect LinkedIn"}
            </a>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Campaigns</h3>
        </div>
        {campaignRows.length === 0 ? (
          <div className="empty-row">No campaigns yet — add one below.</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Spend</th>
                <th>Pipeline</th>
                <th>Won</th>
              </tr>
            </thead>
            <tbody>
              {campaignRows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.channel}</td>
                  <td>{money(c.spend)}</td>
                  <td>{c.matchingCount} accounts</td>
                  <td>{c.wonCount} won · {money(c.wonValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form action={createCampaign} className="inline-form">
          <input type="text" name="name" placeholder="Campaign name" required />
          <select name="channel" defaultValue="website">
            <option value="website">Website</option>
            <option value="wizard">Wizard</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="manual">Manual / referral</option>
          </select>
          <input type="number" name="spend" placeholder="Spend ($)" />
          <button className="btn btn-primary" type="submit">
            Add campaign
          </button>
        </form>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h3>Content calendar — {now.toLocaleString("en-US", { month: "long", year: "numeric" })}</h3>
        </div>
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="calendar-cell-num" style={{ textAlign: "center" }}>
              {w}
            </div>
          ))}
          {cells.map((cell, i) =>
            cell ? (
              <div className="calendar-cell" key={i}>
                <div className="calendar-cell-num">{cell.day}</div>
                {cell.posts.map((p) => (
                  <div key={p.id} className={`calendar-post ${p.platform === "facebook" ? "fb" : "linkedin"}`}>
                    {p.caption.slice(0, 40)}
                    {p.caption.length > 40 ? "…" : ""}
                  </div>
                ))}
              </div>
            ) : (
              <div key={i} />
            )
          )}
        </div>
        <form action={createPost} className="inline-form">
          <select name="platform" defaultValue="facebook">
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          <input type="text" name="caption" placeholder="What's the post?" required />
          <input type="date" name="scheduledAt" required />
          <button className="btn btn-primary" type="submit">
            Schedule
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>All posts</h3>
        </div>
        {posts.length === 0 ? (
          <div className="empty-row">No posts yet — schedule one above.</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Platform</th>
                <th>Caption</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const connected = p.platform === "facebook" ? facebookAccount : linkedinAccount;
                return (
                  <tr key={p.id}>
                    <td>{new Date(p.scheduledAt).toLocaleDateString()}</td>
                    <td>{p.platform}</td>
                    <td>
                      {p.caption}
                      {p.status === "failed" && p.failureReason && (
                        <div style={{ color: "#ff9a76", fontSize: 11.5, marginTop: 4 }}>{p.failureReason}</div>
                      )}
                    </td>
                    <td>{p.status}</td>
                    <td>
                      {p.status !== "posted" && (
                        <PostNowButton
                          postId={p.id}
                          disabled={!connected}
                          disabledReason={`Connect ${p.platform} first.`}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
