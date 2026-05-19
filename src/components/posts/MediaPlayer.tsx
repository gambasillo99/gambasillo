"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/types";
import { cn } from "@/lib/utils";
import { ImageIcon, Pause, Play, Volume2 } from "lucide-react";

interface MediaPlayerProps {
  media: MediaItem[];
  compact?: boolean;
}

export function MediaPlayer({ media, compact }: MediaPlayerProps) {
  if (!media.length) return null;

  return (
    <motionGrid count={media.length}>
      {media.map((item, i) => (
        <MediaItemPlayer
          key={item.id}
          item={item}
          compact={compact}
          priority={i === 0}
        />
      ))}
    </div>
  );
}

function motionGrid({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 grid gap-2 overflow-hidden rounded-2xl",
        count === 1 && "grid-cols-1",
        count >= 2 && "grid-cols-2"
      )}
    >
      {children}
    </div>
  );
}

function MediaItemPlayer({
  item,
  compact,
  priority,
}: {
  item: MediaItem;
  compact?: boolean;
  priority?: boolean;
}) {
  const maxH = compact ? "max-h-48" : "max-h-[28rem]";

  if (item.type === "image") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-gambas-border/30",
          maxH
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt=""
          className={cn("w-full object-cover", maxH)}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    );
  }

  if (item.type === "video") {
    return <VideoPlayer url={item.url} poster={item.thumbnailUrl} maxH={maxH} />;
  }

  if (item.type === "audio") {
    return <AudioPlayer url={item.url} />;
  }

  return (
    <div className="col-span-full rounded-2xl border border-gambas-border/30 bg-gambas-surface p-8 flex flex-col items-center gap-2 text-gambas-muted">
      <ImageIcon className="w-8 h-8" />
      <span className="text-sm">Multimedia</span>
    </div>
  );
}

function VideoPlayer({
  url,
  poster,
  maxH,
}: {
  url: string;
  poster?: string;
  maxH: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void el.play().catch(() => {});
          setPlaying(true);
        } else {
          el.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.45 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <motionVideoFrame maxH={maxH}>
      <video
        ref={ref}
        src={url}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        className={cn("w-full object-cover cursor-pointer", maxH)}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (el.paused) {
            void el.play();
            setPlaying(true);
          } else {
            el.pause();
            setPlaying(false);
          }
        }}
      />
      <motionVideoOverlay playing={playing} />
    </div>
  );
}

function motionVideoFrame({
  maxH,
  children,
}: {
  maxH: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gambas-border/30 bg-black group",
        maxH
      )}
    >
      {children}
    </div>
  );
}

function motionVideoOverlay({ playing }: { playing: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
      {playing ? (
        <Pause className="w-12 h-12 text-white/90" />
      ) : (
        <Play className="w-12 h-12 text-white/90" />
      )}
    </div>
  );
}

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="col-span-full rounded-2xl border border-gambas-border/30 bg-gradient-to-r from-gambas-surface to-gambas-card p-4 flex items-center gap-4">
      <button
        type="button"
        onClick={() => {
          const a = audioRef.current;
          if (!a) return;
          if (a.paused) {
            void a.play();
            setPlaying(true);
          } else {
            a.pause();
            setPlaying(false);
          }
        }}
        className="w-11 h-11 rounded-full bg-gradient-to-br from-gambas-accent to-gambas-accent2 flex items-center justify-center shrink-0"
      >
        {playing ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-1.5 rounded-full bg-gambas-border/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gambas-accent to-gambas-accent2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          className="hidden"
          onTimeUpdate={() => {
            const a = audioRef.current;
            if (a?.duration) setProgress((a.currentTime / a.duration) * 100);
          }}
          onEnded={() => setPlaying(false)}
        />
        <p className="text-xs text-gambas-muted flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          Audio del club
        </p>
      </div>
    </div>
  );
}
