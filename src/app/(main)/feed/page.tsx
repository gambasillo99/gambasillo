"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PostFeed } from "@/components/posts/PostFeed";

function FeedContent() {
  const searchParams = useSearchParams();
  const compose = searchParams.get("compose");
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (compose === "1" && composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: "smooth" });
      const textarea = composerRef.current.querySelector("textarea");
      textarea?.focus();
    }
  }, [compose]);

  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3">
        <h1 className="text-lg font-bold">Inicio</h1>
      </header>
      <div ref={composerRef}>
        <PostFeed showComposer />
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gambas-muted animate-pulse-soft">
          Cargando feed...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
