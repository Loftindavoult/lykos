import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Staff Login — Lykos Intelligence" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/crm");

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          LYKOS <em>Intelligence</em>
        </div>
        <LoginForm />
        <a className="back-link" href="/">
          ← Back to site
        </a>
      </div>
    </div>
  );
}
