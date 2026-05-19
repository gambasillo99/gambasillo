"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PostFeed } from "@/components/posts/PostFeed";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { copy } from "@/lib/gambas-copy";
import type { FeedMode } from "@/types";

function FeedContent() {
  const searchParams = useSearchParams();
  const compose = searchParams.get("compose");
  const composerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<FeedMode>("foryou");

  useEffect(() => {
    if (compose === "1" && composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: "smooth" });
      const textarea = composerRef.current.querySelector("textarea");
      textarea?.focus();
    }
  }, [compose]);

  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">{copy.feed}</h1>
        </div>
        <FeedTabs mode={mode} onChange={setMode} />
      </header>
      <div ref={composerRef}>
        <PostFeed showComposer feedMode={mode} />
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gambas-muted animate-pulse-soft">
          Cargando el visillo...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
