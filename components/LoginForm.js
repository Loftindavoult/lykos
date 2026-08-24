"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

const initialState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action}>
      {state?.error && <div className="form-banner error">{state.error}</div>}
      <div className="field">
        <label htmlFor="loginEmail">Email</label>
        <input id="loginEmail" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="loginPassword">Password</label>
        <input id="loginPassword" name="password" type="password" required />
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
