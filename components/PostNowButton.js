"use client";

import { useTransition } from "react";
import { postNow } from "@/lib/actions/marketing";

export default function PostNowButton({ postId, disabled, disabledReason }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      disabled={disabled || pending}
      title={disabled ? disabledReason : undefined}
      onClick={() => startTransition(() => postNow(postId))}
    >
      {pending ? "Posting…" : "Post now"}
    </button>
  );
}
