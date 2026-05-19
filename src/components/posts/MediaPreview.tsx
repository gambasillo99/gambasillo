"use client";

import type { MediaItem } from "@/types";
import { cn } from "@/lib/utils";
import { ImageIcon, Play, Volume2 } from "lucide-react";

interface MediaPreviewProps {
  media: MediaItem[];
  compact?: boolean;
}

export function MediaPreview({ media, compact }: MediaPreviewProps) {
  if (!media.length) return null;

  return (
    <div
      className={cn(
        "mt-3 grid gap-2 overflow-hidden rounded-2xl",
        media.length === 1 && "grid-cols-1",
        media.length === 2 && "grid-cols-2",
        media.length >= 3 && "grid-cols-2"
      )}
    >
      {media.map((item, i) => (
        <MediaItemView key={item.id} item={item} compact={compact} priority={i === 0} />
      ))}
    </div>
  );
}

function MediaItemView({
  item,
  compact,
  priority,
}: {
  item: MediaItem;
  compact?: boolean;
  priority?: boolean;
}) {
  const maxH = compact ? "max-h-48" : "max-h-96";

  if (item.type === "image") {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border border-gambas-border/30", maxH)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt=""
          className={cn("w-full object-cover", maxH)}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border border-gambas-border/30 bg-black", maxH)}>
        <video
          src={item.url}
          controls
          className={cn("w-full", maxH)}
          poster={item.thumbnailUrl}
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0">
          <Play className="w-12 h-12 text-white/80" />
        </div>
      </div>
    );
  }

  if (item.type === "audio") {
    return (
      <div className="rounded-2xl border border-gambas-border/30 bg-gambas-surface p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gambas-accent to-gambas-accent2 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-white" />
        </div>
        <audio src={item.url} controls className="flex-1 h-8" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gambas-border/30 bg-gambas-surface p-8 flex flex-col items-center gap-2 text-gambas-muted">
      <ImageIcon className="w-8 h-8" />
      <span className="text-sm">Multimedia</span>
    </div>
  );
}
