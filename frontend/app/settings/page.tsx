"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { bootstrap, type Identity } from "../../lib/identity";
import { mergePrefs } from "../../lib/sanitize";
import SectionNumber from "../../components/SectionNumber";

// Defaults for the local UI preferences (theme/density). These never leave the
// browser; a companion window may push an update via postMessage.
const DEFAULT_PREFS = { theme: "light", density: "comfortable" };

export default function SettingsPage() {
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [points, setPoints] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const [role, setRole] = useState("user");

  const [savingBio, setSavingBio] = useState(false);
  const [bioStatus, setBioStatus] = useState<"idle" | "saved" | "error">("idle");
  const [bioError, setBioError] = useState("");

  const [savingHandle, setSavingHandle] = useState(false);
  const [handleStatus, setHandleStatus] = useState<"idle" | "saved" | "error">("idle");
  const [handleError, setHandleError] = useState("");

  function applyIdentity(identity: Identity) {
    setHandle(identity.handle);
    setBio(identity.bio || "");
    setPoints(identity.points || 0);
    setSolved(identity.solved || []);
    setRole(identity.role || "user");
  }

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    bootstrap().then(applyIdentity).catch(console.error);
  }, []);

  // Accept a UI-preferences patch from a companion window (e.g. a popped-out
  // theme picker). Messages from any other origin are ignored, and the patch is
  // applied through mergePrefs, which drops prototype-walking keys.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "prefs") return;
      setPrefs((current) => mergePrefs(current, data.patch ?? {}));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function saveHandle(e: React.FormEvent) {
    e.preventDefault();
    setSavingHandle(true);
    setHandleStatus("idle");
    setHandleError("");
    try {
      const data = await api.patch<Identity>("/api/me/", { handle });
      applyIdentity(data);
      setHandleStatus("saved");
    } catch (e: any) {
      // backend returns 400 {"error":"handle taken"} on a unique clash
      setHandleError(/taken/i.test(e.message) ? "that name is taken" : e.message || "save failed");
      setHandleStatus("error");
    } finally {
      setSavingHandle(false);
    }
  }

  async function saveBio(e: React.FormEvent) {
    e.preventDefault();
    setSavingBio(true);
    setBioStatus("idle");
    setBioError("");
    try {
      await api.patch("/api/me/", { bio });
      setBioStatus("saved");
    } catch (e: any) {
      setBioError(e.message || "Save failed");
      setBioStatus("error");
    } finally {
      setSavingBio(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Section header */}
      <div className="pb-6" style={{ borderBottom: "1px solid var(--ink)" }}>
        <div className="flex items-baseline gap-3">
          <SectionNumber n="06" />
          <h1 className="page-title">Settings</h1>
        </div>
      </div>

      <div className="pt-10" style={{ maxWidth: "540px" }}>

        {/* Score summary */}
        <div className="mb-10 pb-6" style={{ borderBottom: "1px solid var(--line)" }}>
          <label className="label block mb-2">score</label>
          <div className="flex items-baseline gap-4">
            <span className="mono text-[1.4rem]" style={{ color: "var(--ink)" }}>{points}</span>
            <span className="label">pts</span>
            <span
              className="label"
              style={{ color: role === "user" ? "var(--ink-3)" : "var(--accent)" }}
            >
              role: {role}
            </span>
            <span className="label" style={{ color: "var(--ink-3)" }}>
              view: {prefs.density}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {solved.length === 0 ? (
              <span className="label" style={{ color: "var(--ink-3)" }}>
                {points > 0 ? "warm-up done — capture the next board item" : "no captures yet"}
              </span>
            ) : (
              solved.map((code) => (
                <span
                  key={code}
                  className="mono text-[12px]"
                  style={{
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                    padding: "2px 8px",
                  }}
                >
                  {code}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Username editor */}
        <form onSubmit={saveHandle} className="mb-10">
          <label htmlFor="handle" className="label block mb-2">username</label>
          <div className="flex items-center gap-3">
            <input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="operator handle"
              autoComplete="off"
              spellCheck={false}
              className="mono text-[14px] flex-1 outline-none"
              style={{
                backgroundColor: "var(--bg-2)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                padding: "10px 12px",
              }}
            />
            <button type="submit" disabled={savingHandle} className="btn">
              {savingHandle ? "Saving…" : "Save"}
            </button>
          </div>
          {handleStatus === "saved" && (
            <span className="mono text-[12px] block mt-2" style={{ color: "var(--ink-3)" }}>saved.</span>
          )}
          {handleStatus === "error" && (
            <span className="mono text-[12px] block mt-2" style={{ color: "var(--accent)" }}>{handleError}</span>
          )}
        </form>

        {/* Bio editor */}
        <form onSubmit={saveBio}>
          <label htmlFor="bio" className="label block mb-2">bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short operator bio…"
            rows={5}
            className="mono text-[13px] w-full resize-none outline-none"
            style={{
              backgroundColor: "var(--bg-2)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              padding: "12px 14px",
              lineHeight: "1.65",
            }}
          />
          <div className="flex items-center gap-6 mt-6">
            <button type="submit" disabled={savingBio} className="btn btn-solid">
              {savingBio ? "Saving…" : "Save"}
            </button>
            {bioStatus === "saved" && (
              <span className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>saved.</span>
            )}
            {bioStatus === "error" && (
              <span className="mono text-[12px]" style={{ color: "var(--accent)" }}>{bioError}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
