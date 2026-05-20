import type {
  User,
  Post,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
  Notification,
  NotificationType,
  ReactionEmoji,
  UpdateProfileInput,
  Poll,
} from "@/types";
import { EMPTY_REACTIONS } from "@/types";
import type { Database, UserRow } from "@/lib/supabase/types";

type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapUser,
  mapPost,
  mapComment,
  serializeMedia,
} from "@/lib/supabase/mappers";
import {
  buildPollForInsert,
  parsePoll,
  serializeLinks,
  sumReactions,
} from "@/lib/supabase/social-mappers";
import { extractMentions } from "@/lib/content";
import { hashPassword, normalizeUsername } from "@/lib/utils";

function db() {
  return createAdminClient();
}

export async function enrichPosts(
  posts: Post[],
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  if (!posts.length) return [];

  const supabase = db();
  const userIds = [...new Set(posts.map((p) => p.userId))];
  const postIds = posts.map((p) => p.id);

  const { data: usersData } = await supabase
    .from("users")
    .select("*")
    .in("id", userIds);

  const users: UserRow[] = usersData ?? [];
  const userMap = new Map(users.map((u) => [u.id, mapUser(u as Parameters<typeof mapUser>[0])]));

  const likedSet = new Set<string>();
  const repostedSet = new Set<string>();
  const reactionByPost = new Map<string, ReactionEmoji>();
  const reactionsByPost = new Map<string, typeof EMPTY_REACTIONS>();
  const pollVotesByPost = new Map<string, Record<string, number>>();
  const myPollVote = new Map<string, string>();

  if (postIds.length > 0) {
    const { data: allReactions } = await supabase
      .from("reactions")
      .select("post_id, emoji, user_id")
      .in("post_id", postIds);

    const grouped = new Map<string, { emoji: string }[]>();
    (allReactions ?? []).forEach((r) => {
      const list = grouped.get(r.post_id) ?? [];
      list.push({ emoji: r.emoji });
      grouped.set(r.post_id, list);
      if (currentUserId && r.user_id === currentUserId) {
        reactionByPost.set(r.post_id, r.emoji as ReactionEmoji);
      }
    });
    grouped.forEach((rows, postId) => {
      reactionsByPost.set(postId, sumReactions(rows));
    });

    const pollPostIds = posts.filter((p) => p.poll).map((p) => p.id);
    if (pollPostIds.length > 0) {
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("post_id, option_id, user_id")
        .in("post_id", pollPostIds);

      (votes ?? []).forEach((v) => {
        const counts = pollVotesByPost.get(v.post_id) ?? {};
        counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
        pollVotesByPost.set(v.post_id, counts);
        if (currentUserId && v.user_id === currentUserId) {
          myPollVote.set(v.post_id, v.option_id);
        }
      });
    }
  }

  if (currentUserId && postIds.length > 0) {
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);

    const { data: repostsData } = await supabase
      .from("reposts")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);

    (likesData ?? []).forEach((l) => likedSet.add(l.post_id));
    (repostsData ?? []).forEach((r) => repostedSet.add(r.post_id));
  }

  return posts.map((post) => {
    const voteCounts = pollVotesByPost.get(post.id) ?? {};
    const poll = post.poll
      ? parsePoll(
          { options: post.poll.options.map((o) => ({ id: o.id, text: o.text })) },
          voteCounts
        )
      : null;

    return {
      ...post,
      poll,
      reactions: reactionsByPost.get(post.id) ?? { ...EMPTY_REACTIONS },
      myReaction: reactionByPost.get(post.id) ?? null,
      myPollVoteOptionId: myPollVote.get(post.id) ?? null,
      author: userMap.get(post.userId)!,
      likedByMe: likedSet.has(post.id),
      repostedByMe: repostedSet.has(post.id),
    };
  });
}

async function mapRowsToPosts(
  rows: Parameters<typeof mapPost>[0][],
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  const posts = rows.map((row) => {
    const voteCounts: Record<string, number> = {};
    const poll = parsePoll(row.poll, voteCounts);
    return mapPost(row, { poll });
  });
  return enrichPosts(posts, currentUserId);
}

export async function createNotification(
  userId: string,
  actorId: string,
  type: NotificationType,
  opts?: { postId?: string; commentId?: string; emoji?: string }
): Promise<void> {
  if (userId === actorId) return;
  const supabase = db();
  await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: opts?.postId ?? null,
    comment_id: opts?.commentId ?? null,
    emoji: opts?.emoji ?? null,
  });
}

export async function notifyMentions(
  content: string,
  actorId: string,
  postId: string
): Promise<void> {
  const mentions = extractMentions(content);
  if (!mentions.length) return;
  const supabase = db();
  const { data: users } = await supabase
    .from("users")
    .select("id, username")
    .in("username", mentions);

  for (const u of users ?? []) {
    if (u.id !== actorId) {
      await createNotification(u.id, actorId, "mention", { postId });
    }
  }
}

export async function supabaseUpdateLastSeen(userId: string): Promise<void> {
  await db()
    .from("users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function supabaseGetOnlineMembers(): Promise<User[]> {
  const since = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data } = await db()
    .from("users")
    .select("*")
    .gte("last_seen_at", since)
    .order("last_seen_at", { ascending: false })
    .limit(12);
  return (data ?? []).map((u) => mapUser(u as Parameters<typeof mapUser>[0]));
}

export async function supabaseGetFollowingFeed(
  userId: string,
  page: number,
  pageSize: number
): Promise<PostWithAuthor[]> {
  const supabase = db();
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = (follows ?? []).map((f) => f.following_id);
  if (!followingIds.length) return [];

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data } = await supabase
    .from("posts")
    .select("*")
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!data?.length) return [];
  return mapRowsToPosts(data as Parameters<typeof mapPost>[0][], userId);
}

export async function supabaseGetForYouFeed(
  userId: string,
  page: number,
  pageSize: number
): Promise<PostWithAuthor[]> {
  const supabase = db();

  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (!data?.length) return [];
  return mapRowsToPosts(data as Parameters<typeof mapPost>[0][], userId);
}

export async function supabaseGetUserPostsSorted(
  profileUserId: string,
  page: number,
  pageSize: number,
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data } = await db()
    .from("posts")
    .select("*")
    .eq("user_id", profileUserId)
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!data?.length) return [];
  return mapRowsToPosts(data as Parameters<typeof mapPost>[0][], currentUserId);
}

export async function supabaseUpdatePost(
  postId: string,
  userId: string,
  content: string,
  media?: MediaItem[]
): Promise<PostWithAuthor | null> {
  const supabase = db();
  const { data: existing } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (!existing || existing.user_id !== userId) return null;

  const update: PostUpdate = {
    content,
    updated_at: new Date().toISOString(),
    ...(media !== undefined ? { media: serializeMedia(media) } : {}),
  };

  const { data } = await supabase
    .from("posts")
    .update(update)
    .eq("id", postId)
    .select("*")
    .single();

  if (!data) return null;
  await notifyMentions(content, userId, postId);
  const [post] = await mapRowsToPosts([data as Parameters<typeof mapPost>[0]], userId);
  return post ?? null;
}

export async function supabaseCreatePostWithPoll(
  userId: string,
  content: string,
  media: MediaItem[] = [],
  pollOptions?: string[]
): Promise<PostWithAuthor> {
  const insert: PostInsert = {
    user_id: userId,
    content,
    media: serializeMedia(media),
    ...(pollOptions?.length ? { poll: buildPollForInsert(pollOptions) } : {}),
  };

  const { data, error } = await db()
    .from("posts")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Error al crear gamba");
  await notifyMentions(content, userId, data.id);
  const [post] = await mapRowsToPosts([data as Parameters<typeof mapPost>[0]], userId);
  return post;
}

export async function supabaseVotePoll(
  postId: string,
  userId: string,
  optionId: string
): Promise<PostWithAuthor | null> {
  const supabase = db();
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("poll_votes").delete().eq("id", existing.id);
  }
  await supabase.from("poll_votes").insert({
    post_id: postId,
    user_id: userId,
    option_id: optionId,
  });

  const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
  if (!data) return null;
  const [post] = await mapRowsToPosts([data as Parameters<typeof mapPost>[0]], userId);
  return post ?? null;
}

export async function supabaseToggleReaction(
  postId: string,
  userId: string,
  emoji: ReactionEmoji
): Promise<PostWithAuthor | null> {
  const supabase = db();
  const { data: postRow } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, emoji")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").update({ emoji }).eq("id", existing.id);
    }
  } else {
    await supabase.from("reactions").insert({
      post_id: postId,
      user_id: userId,
      emoji,
    });
    if (postRow && postRow.user_id !== userId) {
      await createNotification(postRow.user_id, userId, "reaction", {
        postId,
        emoji,
      });
    }
  }

  const { data } = await supabase.from("posts").select("*").eq("id", postId).single();
  if (!data) return null;
  const [post] = await mapRowsToPosts([data as Parameters<typeof mapPost>[0]], userId);
  return post ?? null;
}

export async function supabaseTogglePin(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  const supabase = db();
  const { data: post } = await supabase
    .from("posts")
    .select("user_id, is_pinned")
    .eq("id", postId)
    .single();

  if (!post || post.user_id !== userId) return null;

  const pin = !post.is_pinned;
  if (pin) {
    await supabase
      .from("posts")
      .update({ is_pinned: false, pinned_at: null })
      .eq("user_id", userId)
      .eq("is_pinned", true);
  }

  const { data } = await supabase
    .from("posts")
    .update({
      is_pinned: pin,
      pinned_at: pin ? new Date().toISOString() : null,
    })
    .eq("id", postId)
    .select("*")
    .single();

  if (!data) return null;
  const [result] = await mapRowsToPosts([data as Parameters<typeof mapPost>[0]], userId);
  return result ?? null;
}

export async function supabaseUpdateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<User | null> {
  const update: UserUpdate = {};
  if (input.displayName !== undefined) update.display_name = input.displayName;
  if (input.bio !== undefined) update.bio = input.bio;
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl;
  if (input.bannerUrl !== undefined) update.banner_url = input.bannerUrl;
  if (input.links !== undefined) update.links = serializeLinks(input.links);

  const { data } = await db()
    .from("users")
    .update(update)
    .eq("id", userId)
    .select("*")
    .single();

  return data ? mapUser(data as Parameters<typeof mapUser>[0]) : null;
}

export async function supabaseGetNotifications(
  userId: string,
  limit = 50
): Promise<Notification[]> {
  const { data } = await db()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data?.length) return [];

  const actorIds = [...new Set(data.map((n) => n.actor_id))];
  const { data: actors } = await db().from("users").select("*").in("id", actorIds);
  const actorMap = new Map(
    (actors ?? []).map((a) => [a.id, mapUser(a as Parameters<typeof mapUser>[0])])
  );

  return data.map((n) => ({
    id: n.id,
    userId: n.user_id,
    actorId: n.actor_id,
    type: n.type as NotificationType,
    postId: n.post_id,
    commentId: n.comment_id,
    emoji: n.emoji,
    readAt: n.read_at,
    createdAt: n.created_at,
    actor: actorMap.get(n.actor_id),
  }));
}

export async function supabaseMarkNotificationsRead(userId: string): Promise<void> {
  await db()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function supabaseGetUnreadCount(userId: string): Promise<number> {
  const { count } = await db()
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
