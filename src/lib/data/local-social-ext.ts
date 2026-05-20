/** Extensiones localStorage para funciones sociales (modo sin Supabase) */
import type {
  User,
  Post,
  PostWithAuthor,
  MediaItem,
  ReactionEmoji,
  ReactionCounts,
  Notification,
  NotificationType,
  UpdateProfileInput,
  Poll,
  FeedMode,
} from "@/types";
import { EMPTY_REACTIONS } from "@/types";
import { getItem, setItem, KEYS } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { isUserOnline } from "@/lib/presence";

interface ReactionRow {
  id: string;
  postId: string;
  userId: string;
  emoji: ReactionEmoji;
}

interface NotificationRow {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  emoji?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface PollVoteRow {
  postId: string;
  userId: string;
  optionId: string;
}

export function defaultPostFields(
  partial: Partial<Post> & Pick<Post, "id" | "userId" | "content" | "createdAt">
): Post {
  return {
    media: [],
    likesCount: 0,
    repostsCount: 0,
    commentsCount: 0,
    isPinned: false,
    reactions: { ...EMPTY_REACTIONS },
    ...partial,
  } as Post;
}

export function getReactions(): ReactionRow[] {
  return getItem<ReactionRow[]>(KEYS.reactions) ?? [];
}

export function saveReactions(rows: ReactionRow[]) {
  setItem(KEYS.reactions, rows);
}

export function getNotificationsStore(): NotificationRow[] {
  return getItem<NotificationRow[]>(KEYS.notifications) ?? [];
}

export function saveNotificationsStore(rows: NotificationRow[]) {
  setItem(KEYS.notifications, rows);
}

export function getPollVotes(): PollVoteRow[] {
  return getItem<PollVoteRow[]>(KEYS.pollVotes) ?? [];
}

export function savePollVotes(rows: PollVoteRow[]) {
  setItem(KEYS.pollVotes, rows);
}

export function attachSocialToPost(
  post: Post,
  getUserById: (id: string) => User | null,
  currentUserId?: string
): PostWithAuthor {
  const reactions = getReactions().filter((r) => r.postId === post.id);
  const counts: ReactionCounts = { ...EMPTY_REACTIONS };
  reactions.forEach((r) => {
    counts[r.emoji] += 1;
  });
  const myReaction =
    reactions.find((r) => r.userId === currentUserId)?.emoji ?? null;

  let poll: Poll | null = post.poll ?? null;
  if (poll) {
    const votes = getPollVotes().filter((v) => v.postId === post.id);
    poll = {
      options: poll.options.map((o) => ({
        ...o,
        votes: votes.filter((v) => v.optionId === o.id).length,
      })),
    };
  }

  const author = getUserById(post.userId)!;
  return {
    ...post,
    poll,
    reactions: counts,
    myReaction,
    myPollVoteOptionId:
      getPollVotes().find(
        (v) => v.postId === post.id && v.userId === currentUserId
      )?.optionId ?? null,
    author: {
      ...author,
      isOnline: isUserOnline(author.lastSeenAt),
    },
  };
}

export function pushNotification(
  userId: string,
  actorId: string,
  type: NotificationType,
  opts?: { postId?: string; commentId?: string; emoji?: string }
) {
  if (userId === actorId) return;
  const rows = getNotificationsStore();
  rows.unshift({
    id: generateId(),
    userId,
    actorId,
    type,
    postId: opts?.postId ?? null,
    commentId: opts?.commentId ?? null,
    emoji: opts?.emoji ?? null,
    readAt: null,
    createdAt: new Date().toISOString(),
  });
  saveNotificationsStore(rows.slice(0, 100));
}

export function buildPollFromOptions(texts: string[]): Poll {
  return {
    options: texts
      .filter((t) => t.trim())
      .slice(0, 4)
      .map((text, i) => ({
        id: `opt-${i + 1}`,
        text: text.trim(),
        votes: 0,
      })),
  };
}

export function filterFeedPosts(
  posts: Post[],
  mode: FeedMode,
  getFollows: () => { followerId: string; followingId: string }[],
  currentUserId?: string
): Post[] {
  const sorted = [...posts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (mode === "following" && currentUserId) {
    const following = new Set(
      getFollows()
        .filter((f) => f.followerId === currentUserId)
        .map((f) => f.followingId)
    );
    return sorted.filter((p) => following.has(p.userId));
  }

  if (mode === "foryou") {
    // Mismo orden cronológico que el resto: fijadas arriba, luego más nuevas primero
    return sorted;
  }

  return sorted;
}

export function updatePostLocal(
  posts: Post[],
  postId: string,
  userId: string,
  content: string,
  media?: MediaItem[]
): Post | null {
  const post = posts.find((p) => p.id === postId);
  if (!post || post.userId !== userId) return null;
  post.content = content;
  if (media !== undefined) post.media = media;
  post.updatedAt = new Date().toISOString();
  return post;
}
