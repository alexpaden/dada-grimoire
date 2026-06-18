"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { useIdentity } from "../../lib/identity";
import SectionNumber from "../../components/SectionNumber";

interface SubmitResult {
  ok: boolean;
  challenge?: string;
  title?: string;
  points?: number;
  first_blood?: boolean;
  error?: string;
}

const EXAMPLE_FLAG = "flag{welcome_operator}";

export default function SubmitPage() {
  const { identity } = useIdentity();
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flag.trim()) return;
    setSubmitting(true);
    setResult(null);
    setError("");
    try {
      const data = await api.post<SubmitResult>("/api/submit/", { flag });
      setResult(data);
      setFlag("");
    } catch (e: any) {
      // api lib surfaces err.error ("incorrect flag" / "already solved")
      setError(e.message || "submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Section header */}
      <div className="pb-6" style={{ borderBottom: "1px solid var(--ink)" }}>
        <div className="flex items-baseline gap-3">
          <SectionNumber n="04" />
          <h1 className="page-title">Submit</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pt-10" style={{ maxWidth: "540px" }}>
        <div className="mb-3 label">
          AS{" "}
          <span className="mono" style={{ color: "var(--ink)" }}>
            @{identity?.handle || "…"}
          </span>
        </div>

        <label htmlFor="flag" className="label block mb-2">flag</label>
        <input
          id="flag"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="flag{…}"
          autoComplete="off"
          spellCheck={false}
          className="mono text-[14px] w-full outline-none"
          style={{
            backgroundColor: "var(--bg-2)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
            padding: "12px 14px",
          }}
        />

        <div className="flex items-center gap-6 mt-6">
          <button type="submit" disabled={submitting} className="btn btn-solid">
            {submitting ? "Submitting…" : "Submit"}
          </button>

          {result?.ok && (
            <div className="flex items-center gap-3">
              <span className="mono text-[13px]" style={{ color: "var(--ink)" }}>
                Captured {result.title} · +{result.points}
              </span>
              {result.first_blood && (
                <span
                  className="label"
                  style={{ color: "var(--accent)", letterSpacing: "0.08em" }}
                >
                  FIRST BLOOD
                </span>
              )}
            </div>
          )}

          {error && (
            <span className="mono text-[13px]" style={{ color: "var(--accent)" }}>
              {error}
            </span>
          )}
        </div>
      </form>

      {/* Warm-up: shows the exact format + a one-click first point. */}
      <div className="mt-12 pt-6" style={{ borderTop: "1px solid var(--line)", maxWidth: "540px" }}>
        <div className="label mb-2">First capture</div>
        <p className="text-[13px] leading-6" style={{ color: "var(--ink-2)" }}>
          Every flag has the form <span className="mono" style={{ color: "var(--ink)" }}>{"flag{…}"}</span>.
          Submit this one to claim your first point.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <code
            className="mono text-[13px]"
            style={{ color: "var(--ink)", backgroundColor: "var(--bg-2)", border: "1px solid var(--line)", padding: "6px 10px" }}
          >
            {EXAMPLE_FLAG}
          </code>
          <button
            type="button"
            onClick={() => setFlag(EXAMPLE_FLAG)}
            className="label"
            style={{ color: "var(--ink-3)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            use example
          </button>
        </div>
      </div>
    </div>
  );
}
