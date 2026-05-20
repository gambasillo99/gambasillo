"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, MessageCircle, Repeat2, Pin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { PostWithAuthor, ReactionEmoji } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { MediaPlayer } from "./MediaPlayer";
import { RichContent } from "@/components/content/RichContent";
import { QuickReactions } from "./QuickReactions";
import { PollBlockFromPost } from "./PollBlock";
import { Button } from "@/components/ui/Button";
import { cn, formatUsername } from "@/lib/utils";
import { copy } from "@/lib/gambas-copy";

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onReact?: (postId: string, emoji: ReactionEmoji) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onEdit?: (postId: string, content: string) => void;
  onPin?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showFull?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onRepost,
  onReact,
  onVotePoll,
  onEdit,
  onPin,
  onDelete,
  showFull,
}: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = currentUserId === post.userId;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const saveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(post.id, editText.trim());
    }
    setEditing(false);
    setMenuOpen(false);
  };

  return (
    <article
      className={cn(
        "p-4 border-b border-gambas-border/40 animate-slide-up card-hover",
        post.isPinned && "bg-gambas-accent/5"
      )}
    >
      {post.isPinned && (
        <p className="text-xs text-gambas-accent flex items-center gap-1 mb-2 font-medium">
          <Pin className="w-3 h-3" /> Fijada en el visillo
        </p>
      )}
      <div className="flex gap-3">
        <Avatar
          username={post.author.username}
          displayName={post.author.displayName}
          avatarUrl={post.author.avatarUrl}
          lastSeenAt={post.author.lastSeenAt}
          showOnline
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
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
              {post.updatedAt && (
                <span className="text-gambas-muted text-xs">(editada)</span>
              )}
            </div>
            {isOwner && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-full hover:bg-gambas-card text-gambas-muted"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 rounded-xl border border-gambas-border bg-gambas-card shadow-card py-1 min-w-[140px]">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gambas-surface flex items-center gap-2"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                    >
                      <Pencil className="w-4 h-4" /> {copy.editGamba}
                    </button>
                    {onPin && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gambas-surface flex items-center gap-2"
                        onClick={() => {
                          onPin(post.id);
                          setMenuOpen(false);
                        }}
                      >
                        <Pin className="w-4 h-4" />
                        {post.isPinned ? copy.unpinGamba : copy.pinGamba}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-left hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                        onClick={() => {
                          setMenuOpen(false);
                          if (typeof window !== "undefined" && window.confirm(copy.confirmDeleteGamba)) {
                            onDelete(post.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        {copy.deleteGamba}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="w-full bg-gambas-surface border border-gambas-border rounded-xl px-3 py-2 text-sm"
              />
              <EditActions onCancel={() => setEditing(false)} onSave={saveEdit} />
            </div>
          ) : (
            <Link
              href={showFull ? "#" : `/post/${post.id}`}
              className="block mt-1"
            >
              <RichContent
                text={post.content}
                className={cn(
                  "text-gambas-text",
                  !showFull && "line-clamp-6"
                )}
              />
              <MediaPlayer media={post.media} compact={!showFull} />
              {post.poll && onVotePoll && (
                <PollBlockFromPost
                  post={post}
                  onVote={onVotePoll}
                />
              )}
            </Link>
          )}

          {onReact && (
            <QuickReactions
              post={post}
              onReact={(id, emoji) => onReact(id, emoji)}
            />
          )}

          <div className="flex items-center gap-1 mt-2 -ml-2">
            <ActionButton
              icon={Heart}
              count={post.likesCount}
              active={post.likedByMe}
              activeColor="text-pink-500"
              onClick={() => onLike?.(post.id)}
              label={copy.gambita}
            />
            <Link href={`/post/${post.id}`}>
              <ActionButton
                icon={MessageCircle}
                count={post.commentsCount}
                label={copy.chirlas}
                asSpan
              />
            </Link>
            <ActionButton
              icon={Repeat2}
              count={post.repostsCount}
              active={post.repostedByMe}
              activeColor="text-emerald-500"
              onClick={() => onRepost?.(post.id)}
              label={copy.regamba}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function EditActions({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={onCancel}>
        Cancelar
      </Button>
      <Button size="sm" onClick={onSave}>
        Guardar
      </Button>
    </div>
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
