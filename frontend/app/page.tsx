"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { api, apiBase } from "../lib/api";
import { bootstrap } from "../lib/identity";
import PostCard, { Post } from "../components/PostCard";
import SectionNumber from "../components/SectionNumber";
import SystemNotice from "../components/SystemNotice";

export default function FeedPage() {
  useEffect(() => {
    bootstrap().catch(console.error);
    // Warm the theme shell for the feed view from the preview service.
    const theme = (typeof localStorage !== "undefined" && localStorage.getItem("grimoire_theme")) || "light";
    fetch(`${apiBase()}/api/preview/?theme=${encodeURIComponent(theme)}`).catch(() => {});
  }, []);

  const { data: posts, refetch } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: () => api.get("/api/posts/"),
    refetchInterval: 10000,
    initialData: [],
  });

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Feed */}
      <section className="pt-16 pb-32">
        <div className="flex items-end justify-between pb-6">
          <div className="flex items-baseline gap-3">
            <SectionNumber n="01" />
            <h1 className="page-title">Feed</h1>
          </div>
          <Link href="/compose" className="btn">
            Compose
          </Link>
        </div>

        {/* Build-time system notice; `kind` only selects a fixed string. */}
        <SystemNotice kind="feed" className="label pb-6" />

        <div style={{ borderTop: "1px solid var(--ink)" }}>
          {posts && posts.length === 0 && (
            <p className="label py-10 text-center">no dispatches yet</p>
          )}
          {posts &&
            posts.map((post) => (
              <PostCard key={post.id} post={post} onReport={() => refetch()} />
            ))}
        </div>
      </section>
    </div>
  );
}
