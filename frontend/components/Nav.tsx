"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdentity } from "../lib/identity";

export default function Nav() {
  const pathname = usePathname();
  // The /tv kiosk is a full-screen command surface with its own header — and we
  // must NOT mint an identity there (it would overwrite the kiosk's admin token).
  if (pathname === "/tv") return null;
  return <NavInner />;
}

function NavInner() {
  const { identity } = useIdentity();

  return (
    <nav style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2.5 group">
          <span className="wordmark">GRIMOIRE</span>
          <span className="label" style={{ color: "var(--ink-3)" }}>by ns.com</span>
        </Link>

        <div className="flex items-center gap-7">
          <Link href="/" className="label hover:text-[var(--ink)]" style={{ transition: "color .12s" }}>
            Feed
          </Link>
          <Link href="/search" className="label hover:text-[var(--ink)]" style={{ transition: "color .12s" }}>
            Search
          </Link>
          <Link href="/compose" className="label hover:text-[var(--ink)]" style={{ transition: "color .12s" }}>
            Compose
          </Link>
          <Link href="/submit" className="label hover:text-[var(--ink)]" style={{ transition: "color .12s" }}>
            Submit
          </Link>
          <Link href="/admin" className="label hover:text-[var(--ink)]" style={{ transition: "color .12s" }}>
            Admin
          </Link>
          <Link href="/settings" className="label hover:text-[var(--ink)]" style={{ transition: "color .12s" }}>
            Settings
          </Link>
          {identity && (
            <Link
              href={`/u/${identity.id}`}
              className="mono text-[13px] pl-1"
              style={{ color: "var(--ink)" }}
            >
              @{identity.handle}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
