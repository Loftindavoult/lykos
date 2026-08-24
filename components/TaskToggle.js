"use client";

import { useTransition } from "react";
import { toggleTask } from "@/lib/actions/crm";

export default function TaskToggle({ accountId, taskId, done }) {
  const [pending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={done}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(() => {
          toggleTask(accountId, taskId, next);
        });
      }}
    />
  );
}
