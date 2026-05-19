"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { PostWithAuthor } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { MediaPreview } from "./MediaPreview";
import { cn, formatUsername } from "@/lib/utils";

interface PostCardProps {
  post: PostWithAuthor;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  showFull?: boolean;
}

export function PostCard({ post, onLike, onRepost, showFull }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <article
      className={cn(
        "p-4 border-b border-gambas-border/40 animate-slide-up",
        "card-hover cursor-default"
      )}
    >
      <div className="flex gap-3">
        <Avatar
          username={post.author.username}
          displayName={post.author.displayName}
          avatarUrl={post.author.avatarUrl}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold text-gambas-text hover:underline truncate"
            >
              {post.author.displayName}
            </Link>
            <Link
              href={`/profile/${post.author.username}`}
              className="text-gambas-muted text-sm hover:underline"
            >
              {formatUsername(post.author.username)}
            </Link>
            <span className="text-gambas-muted text-sm">·</span>
            <Link
              href={`/post/${post.id}`}
              className="text-gambas-muted text-sm hover:underline"
            >
              {timeAgo}
            </Link>
          </div>

          <Link href={showFull ? "#" : `/post/${post.id}`} className="block mt-1">
            <p
              className={cn(
                "text-gambas-text whitespace-pre-wrap break-words",
                !showFull && "line-clamp-6"
              )}
            >
              {post.content}
            </p>
            <MediaPreview media={post.media} compact={!showFull} />
          </Link>

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <ActionButton
              icon={Heart}
              count={post.likesCount}
              active={post.likedByMe}
              activeColor="text-pink-500"
              onClick={() => onLike?.(post.id)}
              label="Like"
            />
            <Link href={`/post/${post.id}`}>
              <ActionButton
                icon={MessageCircle}
                count={post.commentsCount}
                label="Comentarios"
                asSpan
              />
            </Link>
            <ActionButton
              icon={Repeat2}
              count={post.repostsCount}
              active={post.repostedByMe}
              activeColor="text-emerald-500"
              onClick={() => onRepost?.(post.id)}
              label="Repost"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  icon: Icon,
  count,
  active,
  activeColor,
  onClick,
  label,
  asSpan,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
  label: string;
  asSpan?: boolean;
}) {
  const className = cn(
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
    "text-gambas-muted hover:text-gambas-accent hover:bg-gambas-accent/10",
    "transition-all duration-200 btn-press group",
    active && activeColor
  );

  const content = (
    <>
      <Icon
        className={cn(
          "w-4 h-4 transition-transform group-hover:scale-110",
          active && "fill-current"
        )}
      />
      {count > 0 && <span>{count}</span>}
    </>
  );

  if (asSpan) {
    return (
      <span className={className} aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      className={className}
      aria-label={label}
    >
      {content}
    </button>
  );
}
