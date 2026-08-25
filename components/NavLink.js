"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, exact = false, children }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} className={active ? "active" : undefined}>
      {children}
    </Link>
  );
}
