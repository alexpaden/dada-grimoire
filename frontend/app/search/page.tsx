"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../../lib/api";
import { sanitizeRich } from "../../lib/sanitize";
import SectionNumber from "../../components/SectionNumber";

interface UserResult {
  id: number;
  handle: string;
  bio: string;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  // The term that produced the current results — echoed back below as a JSX text
  // child (React escapes it), never as raw HTML.
  const [echoed, setEchoed] = useState("");
  const [results, setResults] = useState<UserResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const data = await api.get<UserResult[]>("/api/search/?q=" + encodeURIComponent(q));
      setResults(data);
      setEchoed(q);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="pb-6" style={{ borderBottom: "1px solid var(--ink)" }}>
        <div className="flex items-baseline gap-3">
          <SectionNumber n="02" />
          <h1 className="page-title">Search</h1>
        </div>
        <p className="text-[14px] mt-3" style={{ color: "var(--ink-2)" }}>
          Find operators by handle or bio.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mt-8">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="handle or bio fragment"
          className="mono text-[13px] flex-1 bg-transparent px-3 py-2"
          style={{ border: "1px solid var(--line)", color: "var(--ink)", outline: "none" }}
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rule pt-4">
          <span className="label" style={{ color: "var(--accent)" }}>Error</span>
          <p className="mono text-[13px] mt-1" style={{ color: "var(--ink-2)" }}>{error}</p>
        </div>
      )}

      {results !== null && (
        <div className="mt-8">
          <div className="flex items-baseline gap-4 pb-3" style={{ borderBottom: "1px solid var(--ink)" }}>
            <span className="label">{results.length} result{results.length !== 1 ? "s" : ""}</span>
            {/* Reflected term — rendered as a JSX text child, so React escapes it. */}
            {echoed && (
              <span className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>
                for “{echoed}”
              </span>
            )}
          </div>

          {results.length === 0 && (
            <p className="label py-10 text-center">no operators matched</p>
          )}

          {results.map((u) => (
            <div key={u.id} className="rule py-4 flex items-start gap-4">
              <Link
                href={`/u/${u.id}`}
                className="mono text-[13px] shrink-0"
                style={{ color: "var(--ink)" }}
              >
                @{u.handle}
              </Link>
              {u.bio && (
                <span
                  className="text-[13px]"
                  style={{ color: "var(--ink-2)" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeRich(u.bio) }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
