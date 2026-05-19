"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/posts/PostCard";
import { CommentThread } from "@/components/comments/CommentThread";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth/context";
import {
  getPostById,
  getPostComments,
  addComment,
  toggleLike,
  toggleRepost,
} from "@/lib/data/store";
import type { PostWithAuthor, CommentWithAuthor } from "@/types";
import { copy } from "@/lib/gambas-copy";

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPost = useCallback(async () => {
    if (!user) return;
    const p = await getPostById(id, user.id);
    setPost(p);
    if (p) {
      const c = await getPostComments(id, user.id);
      setComments(c);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const handleLike = async () => {
    if (!user || !post) return;
    const updated = await toggleLike(post.id, user.id);
    if (updated) setPost(updated);
  };

  const handleRepost = async () => {
    if (!user || !post) return;
    const updated = await toggleRepost(post.id, user.id);
    if (updated) setPost(updated);
  };

  const handleComment = async (
    content: string,
    parentId: string | null
  ) => {
    if (!user) return;
    await addComment(id, user.id, content, parentId);
    const c = await getPostComments(id, user.id);
    setComments(c);
    if (post) {
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    void handleComment(commentText.trim(), null);
    setCommentText("");
  };

  if (loading) {
    return (
      <div>
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3">
          <PostSkeleton />
        </header>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center">
        <p className="text-gambas-muted">Gamba no encontrada</p>
        <Link
          href="/feed"
          className="text-gambas-accent text-sm mt-2 inline-block hover:underline"
        >
          Volver al gambasillín
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3 flex items-center gap-4">
        <Link
          href="/feed"
          className="p-1.5 rounded-full hover:bg-gambas-card transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">{copy.gambaDetail}</h1>
      </header>

      <PostCard
        post={post}
        onLike={() => void handleLike()}
        onRepost={() => void handleRepost()}
        showFull
      />

      <div className="border-t border-gambas-border/40 p-4">
        <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={copy.commentPlaceholder}
            className="flex-1 bg-gambas-surface border border-gambas-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gambas-accent/40"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-4 py-2 rounded-xl bg-gambas-accent text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {copy.enviarChirla}
          </button>
        </form>

        <CommentThread
          comments={comments}
          onReply={handleComment}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
}
