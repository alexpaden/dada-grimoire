"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../lib/api";
import { sanitizeFeed } from "../lib/sanitize";

export interface Post {
  id: number;
  author: { id: number; handle: string };
  body_html: string;
  created_at: string;
  report_count?: number;
}

interface PostCardProps {
  post: Post;
  onReport?: (id: number) => void;
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

export default function PostCard({ post, onReport }: PostCardProps) {
  const [reported, setReported] = useState(false);

  async function handleReport() {
    if (reported) return;
    try {
      await api.post(`/api/posts/${post.id}/report/`);
      setReported(true);
      onReport?.(post.id);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <article className="rule py-6">
      <div className="flex items-center gap-3 mb-3">
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
        <div className="ml-auto flex items-center gap-4">
          <Link href={`/post/${post.id}`} className="label hover:text-[var(--ink)]">
            open
          </Link>
          <button
            onClick={handleReport}
            disabled={reported}
            className="label hover:text-[var(--accent)]"
            style={reported ? { color: "var(--accent)" } : undefined}
            title="Report to the overseer"
          >
            {reported ? "reported" : "report"}
          </button>
        </div>
      </div>

      <div
        className="text-[15px] leading-7"
        style={{ color: "var(--ink)" }}
        dangerouslySetInnerHTML={{ __html: sanitizeFeed(post.body_html) }}
      />
    </article>
  );
}
