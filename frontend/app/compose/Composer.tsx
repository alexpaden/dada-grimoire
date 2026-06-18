"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import SectionNumber from "../../components/SectionNumber";

interface ComposerProps {
  renderSeed: string;
}

export default function Composer({ renderSeed }: ComposerProps) {
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handlePublish() {
    if (!draft.trim()) return;
    setPublishing(true);
    setError("");
    try {
      await api.post("/api/posts/", { body_raw: draft });
      router.push("/");
    } catch (e: any) {
      setError(e.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <span id="compose-cache-marker" hidden>{renderSeed}</span>
      <span id="draft-revision" hidden>pending</span>
      <span id="editor-origin" hidden>local</span>

      {/* Section header */}
      <div className="flex items-end justify-between pb-6" style={{ borderBottom: "1px solid var(--ink)" }}>
        <div className="flex items-baseline gap-3">
          <SectionNumber n="03" />
          <h1 className="page-title">Compose</h1>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing || !draft.trim()}
          className="btn btn-solid"
        >
          {publishing ? "Transmitting…" : "Transmit"}
        </button>
      </div>

      {error && (
        <p
          className="mono text-[13px] mt-4"
          style={{ color: "var(--accent)" }}
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-0 mt-8" style={{ minHeight: "480px" }}>
        {/* Editor pane */}
        <div className="flex flex-col pr-6" style={{ borderRight: "1px solid var(--line)" }}>
          <span className="label mb-3">input / html accepted</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your dispatch… HTML is supported."
            className="mono text-[13px] flex-1 resize-none outline-none"
            style={{
              backgroundColor: "var(--bg-2)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              padding: "14px",
              lineHeight: "1.65",
            }}
          />
        </div>

        {/* Preview pane — renders the local draft for the author only */}
        <div className="flex flex-col pl-6">
          <span className="label mb-3">live preview</span>
          <div
            className="flex-1 text-[14px] leading-7 overflow-y-auto"
            style={{
              backgroundColor: "var(--bg-2)",
              border: "1px solid var(--line)",
              padding: "14px",
              color: "var(--ink)",
            }}
            dangerouslySetInnerHTML={{ __html: draft }}
          />
        </div>
      </div>

      <p className="label mt-4">
        Preview renders in your browser only. Transmitted dispatches are stored on the server.
      </p>
    </div>
  );
}
