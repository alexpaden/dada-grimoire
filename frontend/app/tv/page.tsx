"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { normalizeMarkup } from "../../lib/render-normalize";

interface Post {
  id: number;
  author: { id: number; handle: string };
  body_html: string;
  created_at: string;
  report_count?: number;
}

interface UserEntry {
  id: number;
  handle: string;
  points: number;
  role: string;
}

interface Reports {
  posts: Post[];
}

interface Challenge {
  id: string;
  title: string;
  tier: string;
  points: number;
}

interface ScoreRow {
  id: number;
  handle: string;
  points: number;
  solved: string[];
  first_bloods: string[];
  is_overseer: boolean;
}

interface Scoreboard {
  challenges: Challenge[];
  rows: ScoreRow[];
}

function Clock() {
  // Start null so SSR and the first client render match ("--:--:--"); the real
  // clock is set on mount (client only) to avoid a hydration mismatch.
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="mono text-[13px]" style={{ color: "var(--ink-2)" }}>
      {time
        ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "--:--:--"}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

const TIER_ORDER = ["easy", "medium", "hard"];
const TIER_LABEL: Record<string, string> = { easy: "EASY", medium: "MEDIUM", hard: "HARD" };

// ── Hero leaderboard ───────────────────────────────────────────────────────
// The centerpiece of the wall. Big tabular figures, one accent for the leader
// and for first bloods. Rows arrive pre-sorted by the API (points desc,
// overseer last); the page hands us only scored competitors (points > 0).
function Leaderboard({
  challenges,
  competitors,
}: {
  challenges: Challenge[];
  competitors: ScoreRow[];
}) {
  // Challenge codes grouped by tier, in TIER_ORDER, preserving API order within.
  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    items: challenges.filter((c) => c.tier === tier),
  })).filter((g) => g.items.length > 0);
  const flatCodes = byTier.flatMap((g) => g.items);

  // Layout: rank · operator (sized to content) · points · badge grid.
  // The badge grid is the flexible track — it spreads across the whole hero.
  const GAP = 12;
  const TIER_GUTTER = 28;
  // rank · operator (flexes to fill the half-width column) · points · fixed badge block
  const cols = `44px minmax(0, 1fr) 88px max-content`;

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 0,
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-baseline gap-4"
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: "14px",
          marginBottom: "6px",
          flexShrink: 0,
        }}
      >
        <span className="label" style={{ fontSize: "0.8rem" }}>/01</span>
        <h1
          className="statement"
          style={{ fontSize: "1.9rem", color: "var(--ink)", margin: 0 }}
        >
          Leaderboard
        </h1>
        <span
          className="label"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--accent)",
            fontSize: "0.8rem",
          }}
        >
          <span className="dot" style={{ flexShrink: 0 }} />
          LIVE
        </span>
      </div>

      {/* Column rail: rank · operator · pts · per-tier capture grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          alignItems: "end",
          columnGap: "28px",
          padding: "10px 20px 8px",
          flexShrink: 0,
        }}
      >
        <span className="label">#</span>
        <span className="label">Operator</span>
        <span className="label" style={{ textAlign: "right" }}>Points</span>
        {/* Tier rail header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: byTier.map(() => "max-content").join(" "),
            columnGap: `${TIER_GUTTER}px`,
            width: "100%",
          }}
        >
          {byTier.map((g) => (
            <div key={g.tier}>
              <div className="lb-tier" style={{ fontSize: "0.72rem", marginBottom: "7px" }}>
                {TIER_LABEL[g.tier] || g.tier.toUpperCase()}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${g.items.length}, 34px)`,
                  columnGap: `${GAP}px`,
                }}
              >
                {g.items.map((c) => (
                  <div
                    key={c.id}
                    className="mono"
                    style={{ fontSize: "0.74rem", textAlign: "center", color: "var(--ink-3)" }}
                  >
                    {c.id}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rows — flex-grows to fill the war-room canvas */}
      <div
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          overflowY: "auto",
          borderTop: "1px solid var(--line)",
        }}
      >
        {competitors.length === 0 ? (
          <div
            style={{
              height: "100%",
              minHeight: "240px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <div className="lb-tier" style={{ fontSize: "1.3rem", letterSpacing: "0.22em" }}>
              NO CAPTURES YET
            </div>
            <div className="label">the board is open — first flag takes the lead</div>
          </div>
        ) : (
          competitors.map((row, idx) => {
            const leader = idx === 0;
            return (
              <div
                key={row.id}
                className={`lb-row${leader ? " lb-leader" : ""}`}
                style={{
                  gridTemplateColumns: cols,
                  columnGap: "28px",
                  width: "100%",
                  padding: "0 20px",
                  // each row sizes to fill ~the remaining height; comfy on a TV
                  minHeight: "clamp(54px, 11vh, 96px)",
                }}
              >
                {/* rank */}
                <span className="lb-rank" style={{ fontSize: "1.5rem" }}>
                  {idx + 1}
                </span>

                {/* handle */}
                <span
                  className="mono"
                  style={{
                    fontSize: leader ? "1.7rem" : "1.4rem",
                    fontWeight: leader ? 700 : 500,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.handle}
                </span>

                {/* points */}
                <span
                  className="mono"
                  style={{
                    fontSize: leader ? "1.85rem" : "1.55rem",
                    fontWeight: 700,
                    color: leader ? "var(--accent)" : "var(--ink)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: "5ch",
                  }}
                >
                  {row.points}
                </span>

                {/* per-challenge badge grid, grouped by tier */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: byTier.map(() => "max-content").join(" "),
                    columnGap: `${TIER_GUTTER}px`,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {byTier.map((g) => (
                    <div
                      key={g.tier}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${g.items.length}, 34px)`,
                        columnGap: `${GAP}px`,
                      }}
                    >
                      {g.items.map((c) => {
                        const solved = row.solved.includes(c.id);
                        const blood = row.first_bloods.includes(c.id);
                        const cls = blood ? "is-blood" : solved ? "is-solved" : "";
                        return (
                          <div
                            key={c.id}
                            className={`lb-badge ${cls}`}
                            style={{ width: "34px", height: "34px", fontSize: "0.95rem" }}
                            title={`${c.id} · ${c.title}${blood ? " · first blood" : solved ? " · solved" : ""}`}
                          >
                            {solved ? "✓" : ""}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend — quiet, anchored to the bottom of the hero */}
      <div
        className="label"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          borderTop: "1px solid var(--line)",
          padding: "12px 20px 2px",
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="lb-badge is-blood" style={{ width: "16px", height: "16px" }} />
          first blood
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="lb-badge is-solved" style={{ width: "16px", height: "16px" }} />
          solved
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="lb-badge" style={{ width: "16px", height: "16px" }} />
          open
        </span>
      </div>
    </section>
  );
}

export default function TVPage() {
  const bootstrapped = useRef(false);
  const [banner, setBanner] = useState("");
  const [breach, setBreach] = useState("");
  const [reportedIdx, setReportedIdx] = useState(0);
  const [ready, setReady] = useState(false); // admin token armed -> reports query may run
  const [secretInput, setSecretInput] = useState("");
  const [armError, setArmError] = useState("");

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const tok = localStorage.getItem("grimoire_token") || "";
    let role = "";
    try {
      role = JSON.parse(atob(tok.split(".")[1] || "")).role;
    } catch {}
    if (role === "admin") {
      setReady(true);
    }
    // Viewer mode: the kiosk's reads (posts/users/scoreboard/banner) are all public,
    // so we do NOT bootstrap an identity here — that would mint a throwaway account
    // onto the leaderboard every time the TV loads.
  }, []);

  async function arm() {
    try {
      const data: any = await api.post("/api/kiosk/bootstrap/", { secret: secretInput });
      if (data?.token) {
        localStorage.setItem("grimoire_token", data.token);
        localStorage.setItem("grimoire_kiosk_flag", data.kiosk_flag || "");
        setReady(true);
        setSecretInput("");
        setArmError("");
      }
    } catch {
      setArmError("incorrect");
    }
  }

  // Fetch feed
  const { data: posts } = useQuery<Post[]>({
    queryKey: ["tv-posts"],
    queryFn: () => api.get("/api/posts/"),
    refetchInterval: 8000,
    initialData: [],
  });

  // Fetch users — drives the ADMINS panel; 5s so privilege escalations surface quickly
  const { data: users } = useQuery<UserEntry[]>({
    queryKey: ["tv-users"],
    queryFn: () => api.get("/api/users/"),
    refetchInterval: 5000,
    initialData: [],
  });

  // Fetch reports (admin-only; populated only when kiosk token is admin)
  const { data: reports } = useQuery<Reports>({
    queryKey: ["tv-reports"],
    queryFn: () => api.get("/api/reports/"),
    refetchInterval: 12000,
    initialData: { posts: [] },
    retry: false,
    enabled: ready, // only after the kiosk admin token is stored
  });

  // Fetch deface banner
  const { data: bannerData } = useQuery<{ banner: string; breach: string }>({
    queryKey: ["tv-banner"],
    queryFn: () => api.get("/api/admin/banner/"),
    refetchInterval: 5000,
  });
  useEffect(() => {
    setBanner(bannerData?.banner || "");
    setBreach(bannerData?.breach || "");
  }, [bannerData]);

  // Leaderboard — polls the backend's account-tied scoreboard every ~4s. Same API
  // base as /api/posts etc. (the api lib's NEXT_PUBLIC_API_BASE).
  const { data: scoreboard } = useQuery<Scoreboard>({
    queryKey: ["tv-scoreboard"],
    queryFn: () => api.get("/api/scoreboard/"),
    refetchInterval: 4000,
    initialData: { challenges: [], rows: [] },
  });
  const challenges = scoreboard?.challenges || [];
  const scoreRows = scoreboard?.rows || [];
  // Only ranked competitors who have actually scored — hide the overseer and
  // anyone sitting on 0. Rows arrive pre-sorted (points desc), so order holds.
  const competitors = scoreRows.filter((r) => !r.is_overseer && r.points > 0);

  // Cycle through reported items
  const allReported = [
    ...(reports?.posts || []).map((p) => ({ type: "post" as const, data: p })),
  ];

  useEffect(() => {
    if (allReported.length === 0) return;
    const t = setInterval(() => {
      setReportedIdx((i) => (i + 1) % allReported.length);
    }, 6000);
    return () => clearInterval(t);
  }, [allReported.length]);

  const currentReported = allReported[reportedIdx % Math.max(1, allReported.length)];

  const admins = (users || []).filter((u) => u.role === "admin");

  return (
    <div
      className="kiosk"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--ink)",
        height: "100vh",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <header
        style={{
          backgroundColor: "var(--bg-2)",
          borderBottom: "1px solid var(--line)",
          padding: "0 28px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexShrink: 0,
        }}
      >
        <span className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
          GRIMOIRE
        </span>
        <span className="label">ns.com · defence against the dark arts</span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          {/* Always available so the instructor can (re)arm anytime — a stale token
              from a prior build no longer locks you out, and re-arming rewrites
              localStorage['grimoire_kiosk_flag']. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              arm();
            }}
            title="Instructor only — enter the kiosk passphrase to (re)arm the shared display."
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {ready && (
              <span
                className="label"
                style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ink-2)" }}
              >
                <span className="dot" style={{ background: "var(--ink-2)", flexShrink: 0 }} />
                armed
              </span>
            )}
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder={ready ? "re-arm secret" : "instructor secret"}
              title="Instructor only — enter the kiosk passphrase to (re)arm the shared display."
              className="mono"
              style={{
                background: "var(--bg)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                padding: "5px 9px",
                fontSize: "12px",
                width: "128px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="label"
              style={{ border: "1px solid var(--ink-3)", padding: "5px 11px", color: "var(--ink-2)" }}
            >
              {ready ? "re-arm" : "arm"}
            </button>
            {armError && (
              <span className="label" style={{ color: "var(--accent)" }}>{armError}</span>
            )}
          </form>
          <span
            className="label"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--accent)",
            }}
          >
            <span className="dot" style={{ flexShrink: 0 }} />
            {breach ? "BREACHED" : "LIVE"}
          </span>
          <Clock />
        </div>
      </header>

      {/* System-level signal — sits above everything so the room sees it instantly. */}
      {breach && (
        <div
          className="mono"
          style={{
            backgroundColor: "var(--accent)",
            color: "#000",
            textAlign: "center",
            padding: "16px 24px",
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            borderBottom: "2px solid #000",
            flexShrink: 0,
          }}
        >
          ▌▌ SYSTEM COMPROMISED · CODE EXECUTION · @{breach} ▐▐
        </div>
      )}

      {/* Deface banner — full-width accent bar when active */}
      {banner && (
        <div
          style={{
            backgroundColor: breach ? "var(--bg-2)" : "var(--accent)",
            color: breach ? "var(--accent)" : "#ffffff",
            textAlign: "center",
            padding: "10px 24px",
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            borderBottom: breach ? "1px solid var(--line)" : "none",
            flexShrink: 0,
          }}
        >
          {banner}
        </div>
      )}

      {/* Body: LEADERBOARD hero (left) + signals rail (right) */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* HERO — the leaderboard owns the room */}
        <div
          style={{
            flex: "0 0 47%",
            minWidth: 0,
            padding: "22px 28px 16px",
            borderRight: "1px solid var(--line)",
            display: "flex",
          }}
        >
          <Leaderboard challenges={challenges} competitors={competitors} />
        </div>

        {/* Right rail — ADMINS + Signal Feed (moderation queue fires here) */}
        <aside
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* ADMINS — live privilege panel; new admins surface within ~5s */}
          <div style={{ padding: "22px 22px 18px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
            <div className="flex items-baseline gap-3" style={{ marginBottom: "6px" }}>
              <span className="label">/02</span>
              <span className="section-title" style={{ fontSize: "1.05rem" }}>
                Admins
              </span>
              <span className="label" style={{ marginLeft: "auto" }}>{admins.length}</span>
            </div>
            <div className="flex flex-col">
              {admins.length === 0 && (
                <span className="label" style={{ color: "var(--ink-3)", paddingTop: "8px" }}>
                  privilege escalations show here
                </span>
              )}
              {admins.map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-3 rule">
                  <span className="dot" style={{ flexShrink: 0 }} />
                  <span className="mono text-[15px] flex-1" style={{ color: "var(--ink)" }}>
                    @{u.handle}
                  </span>
                  <span className="mono text-[12px]" style={{ color: "var(--accent)", fontWeight: 700 }}>
                    [ROOT]
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Feed — calm secondary panel. Moderation queue lives at top. */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "22px 22px 18px",
            }}
          >
            <div className="flex items-baseline gap-3" style={{ marginBottom: "12px" }}>
              <span className="label">/03</span>
              <span className="section-title" style={{ fontSize: "1.05rem" }}>
                Signal Feed
              </span>
            </div>

            {/* Moderation queue preview — reported content awaiting review. */}
            {currentReported && (
              <div
                className="kiosk-card"
                style={{
                  borderLeft: "2px solid var(--accent)",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <div className="label mb-2" style={{ color: "var(--accent)" }}>
                  moderation queue · {reportedIdx + 1}/{allReported.length}
                </div>
                <div>
                  <span className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>
                    @{currentReported.data.author?.handle}
                  </span>
                  <div
                    className="text-[14px] leading-6 mt-2"
                    style={{ color: "var(--ink)" }}
                    dangerouslySetInnerHTML={{
                      __html: normalizeMarkup((currentReported.data as Post).body_html),
                    }}
                  />
                </div>
              </div>
            )}

            {/* Live feed posts */}
            {posts &&
              posts.slice(0, 10).map((post) => (
                <article key={post.id} className="rule py-3">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="mono text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                      @{post.author.handle}
                    </span>
                    <span className="mono text-[11px]" style={{ color: "var(--ink-3)", marginLeft: "auto" }}>
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <div
                    className="text-[13px] leading-5"
                    style={{ color: "var(--ink-2)" }}
                    dangerouslySetInnerHTML={{ __html: normalizeMarkup(post.body_html) }}
                  />
                </article>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
