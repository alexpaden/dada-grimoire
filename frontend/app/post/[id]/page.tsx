"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";
import { api } from "../../../lib/api";
import { sanitizeFeed } from "../../../lib/sanitize";
import SectionNumber from "../../../components/SectionNumber";

interface Comment {
  id: number;
  author: { id: number; handle: string };
  body: string;
  created_at: string;
}

interface PostDetail {
  id: number;
  author: { id: number; handle: string };
  body_html: string;
  created_at: string;
  comments: Comment[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  const { data: post, refetch } = useQuery<PostDetail>({
    queryKey: ["post", id],
    queryFn: () => api.get(`/api/posts/${id}/`),
  });

  async function handleReport() {
    if (reported) return;
    try {
      await api.post(`/api/posts/${id}/report/`);
      setReported(true);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/posts/${id}/comments/`, { body: comment });
      setComment("");
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (!post) {
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

      {/* Dispatch article */}
      <article className="mt-6">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--ink)" }}>
          <Link
            href={`/u/${post.author.id}`}
            className="mono text-[13px]"
            style={{ color: "var(--ink)" }}
          >
            @{post.author.handle}
          </Link>
          <span className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>
            {timeAgo(post.created_at)}
          </span>
          <span className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>
            /{String(post.id).padStart(3, "0")}
          </span>
          <button
            onClick={handleReport}
            disabled={reported}
            className="label ml-auto hover:text-[var(--accent)]"
            style={{ transition: "color .12s", color: reported ? "var(--accent)" : undefined }}
            title="Report to the overseer"
          >
            {reported ? "reported" : "report"}
          </button>
        </div>

        <div
          className="text-[15px] leading-7 py-8"
          style={{ color: "var(--ink)" }}
          dangerouslySetInnerHTML={{ __html: sanitizeFeed(post.body_html) }}
        />
      </article>

      {/* Comments section */}
      <section style={{ borderTop: "1px solid var(--line)" }} className="pt-8">
        <div className="flex items-baseline gap-3 mb-6">
          <SectionNumber n="08" />
          <h2 className="section-title">Responses</h2>
        </div>

        {post.comments.length === 0 && (
          <p className="label py-4">no responses yet</p>
        )}

        {post.comments.map((c) => (
          <div
            key={c.id}
            className="rule py-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/u/${c.author.id}`}
                className="mono text-[13px]"
                style={{ color: "var(--ink)" }}
              >
                @{c.author.handle}
              </Link>
              <span className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>
                {timeAgo(c.created_at)}
              </span>
            </div>
            <p className="text-[14px] leading-6" style={{ color: "var(--ink-2)" }}>
              {c.body}
            </p>
          </div>
        ))}

        <form onSubmit={handleComment} className="mt-6 flex gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a response…"
            className="mono text-[13px] flex-1 outline-none"
            style={{
              backgroundColor: "var(--bg-2)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              padding: "10px 14px",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="btn btn-solid"
          >
            {submitting ? "Sending…" : "Reply"}
          </button>
        </form>
      </section>
    </div>
  );
}
