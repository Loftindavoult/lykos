import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export const metadata = { title: "CRM — Lykos Intelligence" };

export default async function CrmLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <div className="crm-brand">
          LYKOS <em>Intelligence</em>
        </div>
        <nav className="crm-nav">
          <a href="/crm">Pipeline</a>
          <a href="/crm/gtm">GTM Strategy</a>
          <a href="/crm/marketing">Marketing</a>
          <a href="/crm/intelligence">Intelligence</a>
          <a href="/">← Marketing site</a>
        </nav>
        <div className="crm-user">
          Signed in as {session.name}
          <form action={logout}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="crm-main">{children}</div>
    </div>
  );
}
