"use client";

import Link from "next/link";
import { parseContentParts } from "@/lib/content";
import { cn } from "@/lib/utils";

interface RichContentProps {
  text: string;
  className?: string;
}

export function RichContent({ text, className }: RichContentProps) {
  const parts = parseContentParts(text);

  return (
    <span className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.value}</span>;
        }
        if (part.type === "mention") {
          return (
            <Link
              key={i}
              href={`/profile/${part.username}`}
              className="text-gambas-accent hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part.value}
            </Link>
          );
        }
        return (
          <Link
            key={i}
            href={`/feed?tag=${encodeURIComponent(part.tag)}`}
            className="text-gambas-accent2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part.value}
          </Link>
        );
      })}
    </span>
  );
}
