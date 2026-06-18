"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import SectionNumber from "../../components/SectionNumber";

interface Overview {
  attestation: string;
  admins: any[];
  stats: Record<string, any>;
}

interface DefaceResult {
  ok: boolean;
}

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Deface form
  const [banner, setBanner] = useState("");
  const [defaceResult, setDefaceResult] = useState<DefaceResult | null>(null);
  const [defaceError, setDefaceError] = useState<string | null>(null);
  const [defaceLoading, setDefaceLoading] = useState(false);

  useEffect(() => {
    api
      .get<Overview>("/api/admin/overview/")
      .then(setOverview)
      .catch((err: any) => setAccessError(err.message));
  }, []);

  async function handleDeface(e: React.FormEvent) {
    e.preventDefault();
    setDefaceError(null);
    setDefaceResult(null);
    setDefaceLoading(true);
    try {
      const data = await api.post<DefaceResult>("/api/admin/deface/", { banner });
      setDefaceResult(data);
    } catch (err: any) {
      setDefaceError(err.message);
    } finally {
      setDefaceLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="pb-6" style={{ borderBottom: "1px solid var(--ink)" }}>
        <div className="flex items-baseline gap-3">
          <SectionNumber n="05" />
          <h1 className="page-title">Admin</h1>
        </div>
        <p className="text-[14px] mt-3" style={{ color: "var(--ink-2)" }}>
          Privileged operations.
        </p>
      </div>

      {/* Overview — overseer-only */}
      <div className="mt-10">
        <div className="flex items-baseline gap-3 pb-3" style={{ borderBottom: "1px solid var(--ink)" }}>
          <SectionNumber n="05.1" />
          <h2 className="section-title">Overview</h2>
        </div>

        {overview ? (
          <>
            <div className="mt-5 rule pt-4">
              <span className="label">flag</span>
              <p className="mono text-[13px] mt-1" style={{ color: "var(--ink)" }}>{overview.attestation}</p>
            </div>

            <div className="mt-5 rule pt-4">
              <span className="label">admins</span>
              <pre className="mono text-[12px] mt-1 leading-5" style={{ color: "var(--ink-2)" }}>
                {JSON.stringify(overview.admins, null, 2)}
              </pre>
            </div>

            <div className="mt-5 rule pt-4">
              <span className="label">stats</span>
              <pre className="mono text-[12px] mt-1 leading-5" style={{ color: "var(--ink-2)" }}>
                {JSON.stringify(overview.stats, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="mt-5 rule pt-4">
            <span className="label" style={{ color: "var(--accent)" }}>locked</span>
            <p className="mono text-[13px] mt-1" style={{ color: "var(--ink-2)" }}>
              {accessError ? accessError : "loading…"}
            </p>
            <p className="text-[13px] mt-2" style={{ color: "var(--ink-3)" }}>
              Overseer credentials required — admin role alone is not enough.
            </p>
          </div>
        )}
      </div>

      {/* Deface */}
      <div className="mt-12">
        <div className="flex items-baseline gap-3 pb-3" style={{ borderBottom: "1px solid var(--ink)" }}>
          <SectionNumber n="05.2" />
          <h2 className="section-title">Deface</h2>
        </div>

        <form onSubmit={handleDeface} className="flex gap-3 mt-6">
          <input
            type="text"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="banner text"
            className="mono text-[13px] flex-1 bg-transparent px-3 py-2"
            style={{ border: "1px solid var(--line)", color: "var(--ink)", outline: "none" }}
          />
          <button type="submit" className="btn" disabled={defaceLoading}>
            {defaceLoading ? "Defacing…" : "Deface"}
          </button>
        </form>

        {defaceError && (
          <div className="mt-4 rule pt-3">
            <span className="label" style={{ color: "var(--accent)" }}>Error</span>
            <p className="mono text-[13px] mt-1" style={{ color: "var(--ink-2)" }}>{defaceError}</p>
          </div>
        )}
        {defaceResult && (
          <div className="mt-4 rule pt-3">
            <span className="label">status</span>
            <p className="mono text-[13px] mt-1" style={{ color: "var(--ink)" }}>banner set (cosmetic — no flag)</p>
          </div>
        )}
      </div>
    </div>
  );
}
