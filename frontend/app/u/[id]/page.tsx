"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { api } from "../../../lib/api";
import { safeHref, sanitizeFeed } from "../../../lib/sanitize";
import SectionNumber from "../../../components/SectionNumber";

function bioLink(bio: string): string | null {
  const token = (bio || "").split(/\s+/).find((t) => /^(https?:\/\/|\/)\S/.test(t));
  return token ? safeHref(token) : null;
}

interface ProfilePost {
  id: number;
  body_html: string;
  created_at: string;
}

interface Profile {
  id: number;
  handle: string;
  bio: string;
  points: number;
  solved: string[];
  posts: ProfilePost[];
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const profileId = parseInt(id, 10);

  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", id],
    queryFn: () => api.get(`/api/u/${id}/`),
  });

  function navigate(delta: number) {
    router.push(`/u/${profileId + delta}`);
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="label">loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="label hover:text-[var(--ink)] mb-10 inline-block" style={{ transition: "color .12s" }}>
        ← feed
      </Link>

      {/* Operator header */}
      <div className="mt-6 pb-6" style={{ borderBottom: "1px solid var(--ink)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <SectionNumber n="07" />
              <h1 className="page-title">@{profile.handle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="mono text-[12px]" style={{ color: "var(--ink-2)" }}>
                {profile.points} pts
              </span>
            </div>
            {/* Captured challenge codes */}
            {profile.solved && profile.solved.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile.solved.map((code) => (
                  <span
                    key={code}
                    className="mono text-[11px]"
                    style={{
                      color: "var(--ink)",
                      border: "1px solid var(--line)",
                      padding: "1px 7px",
                    }}
                  >
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bio — rendered as plain text */}
        {profile.bio && (
          <p
            className="mt-5 text-[14px] leading-6"
            style={{ color: "var(--ink-2)" }}
          >
            {profile.bio}
          </p>
        )}
        {profile.bio && bioLink(profile.bio) && (
          <a
            href={bioLink(profile.bio) as string}
            rel="noopener noreferrer"
            className="label mt-3 inline-block"
            style={{ color: "var(--ink-3)" }}
          >
            homepage
          </a>
        )}
      </div>

      {/* Profile navigation */}
      <div className="flex items-center gap-5 py-4 rule">
        <button
          onClick={() => navigate(-1)}
          className="label hover:text-[var(--ink)]"
          style={{ transition: "color .12s" }}
        >
          ← prev operator
        </button>
        <span className="mono text-[11px]" style={{ color: "var(--ink-3)" }}>
          id:{profile.id}
        </span>
        <button
          onClick={() => navigate(1)}
          className="label hover:text-[var(--ink)]"
          style={{ transition: "color .12s" }}
        >
          next operator →
        </button>
      </div>

      {/* Dispatch history */}
      <section className="pt-8">
        <div className="flex items-baseline gap-3 pb-5">
          <SectionNumber n="07.1" />
          <h2 className="section-title">Dispatches</h2>
        </div>

        {profile.posts.length === 0 && (
          <p className="label py-4">no dispatches yet</p>
        )}

        {profile.posts.map((p) => (
          <Link
            key={p.id}
            href={`/post/${p.id}`}
            className="rule block py-4 hover:opacity-80"
            style={{ color: "var(--ink)", transition: "opacity .12s" }}
          >
            <div
              className="text-[14px] leading-6"
              style={{ color: "var(--ink-2)" }}
              dangerouslySetInnerHTML={{ __html: sanitizeFeed(p.body_html) }}
            />
          </Link>
        ))}
      </section>
    </div>
  );
}
