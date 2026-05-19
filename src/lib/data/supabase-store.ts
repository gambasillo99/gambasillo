import type {
  User,
  Post,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
} from "@/types";
import type { UserRow } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapUser,
  mapPost,
  mapComment,
  serializeMedia,
} from "@/lib/supabase/mappers";
import { parsePoll } from "@/lib/supabase/social-mappers";
import {
  enrichPosts,
  createNotification,
  notifyMentions,
} from "@/lib/data/supabase-social";
import { hashPassword, normalizeUsername } from "@/lib/utils";

function db() {
  return createAdminClient();
}

type DbPostRow = Parameters<typeof mapPost>[0];

async function rowsToPosts(
  rows: DbPostRow[],
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  const posts: Post[] = rows.map((row) => mapPost(row, { poll: parsePoll(row.poll) }));
  return enrichPosts(posts, currentUserId);
}

export async function supabaseGetUserById(id: string): Promise<User | null> {
  const { data } = await db().from("users").select("*").eq("id", id).single();
  return data ? mapUser(data) : null;
}

export async function supabaseGetUserByUsername(
  username: string
): Promise<User | null> {
  const { data } = await db()
    .from("users")
    .select("*")
    .eq("username", normalizeUsername(username))
    .single();
  return data ? mapUser(data) : null;
}

export async function supabaseRegisterUser(
  username: string,
  password: string,
  displayName?: string
): Promise<{ user: User } | { error: string }> {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return { error: "Usuario: 3-20 caracteres, solo letras, números y _" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const { data: existing } = await db()
    .from("users")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  if (existing) return { error: "Ese @usuario ya existe" };

  const passwordHash = await hashPassword(password);
  const { data, error } = await db()
    .from("users")
    .insert({
      username: normalized,
      display_name: displayName || normalized,
      bio: "",
      avatar_url: "",
      banner_url: "",
      links: [],
      password_hash: passwordHash,
    })
    .select("*")
    .single();

  if (error || !data) return { error: error?.message ?? "Error al registrar" };
  return { user: mapUser(data) };
}

export async function supabaseLoginUser(
  username: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const normalized = normalizeUsername(username);
  const { data: user } = await db()
    .from("users")
    .select("*")
    .eq("username", normalized)
    .single();

  if (!user) return { error: "Usuario o contraseña incorrectos" };

  const passwordHash = await hashPassword(password);
  if (user.password_hash !== passwordHash) {
    return { error: "Usuario o contraseña incorrectos" };
  }

  return { user: mapUser(user) };
}

export async function supabaseGetFeedPosts(
  page: number,
  pageSize: number,
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data } = await db()
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!data?.length) return [];
  return rowsToPosts(data as DbPostRow[], currentUserId);
}

export async function supabaseGetUserPosts(
  userId: string,
  page: number,
  pageSize: number,
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data } = await db()
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!data?.length) return [];
  return rowsToPosts(data as DbPostRow[], currentUserId);
}

export async function supabaseGetPostById(
  id: string,
  currentUserId?: string
): Promise<PostWithAuthor | null> {
  const { data } = await db().from("posts").select("*").eq("id", id).single();
  if (!data) return null;
  const [post] = await rowsToPosts([data as DbPostRow], currentUserId);
  return post ?? null;
}

export async function supabaseCreatePost(
  userId: string,
  content: string,
  media: MediaItem[] = [],
  pollOptions?: string[]
): Promise<PostWithAuthor> {
  const { supabaseCreatePostWithPoll } = await import("@/lib/data/supabase-social");
  return supabaseCreatePostWithPoll(userId, content, media, pollOptions);
}

export async function supabaseToggleLike(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  const supabase = db();
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq("id", postId);
    }
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    const { data: post } = await supabase
      .from("posts")
      .select("likes_count, user_id")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: post.likes_count + 1 })
        .eq("id", postId);
      if (post.user_id !== userId) {
        await createNotification(post.user_id, userId, "like", { postId });
      }
    }
  }

  return supabaseGetPostById(postId, userId);
}

export async function supabaseToggleRepost(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  const supabase = db();
  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("reposts").delete().eq("id", existing.id);
    const { data: post } = await supabase
      .from("posts")
      .select("reposts_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ reposts_count: Math.max(0, post.reposts_count - 1) })
        .eq("id", postId);
    }
  } else {
    await supabase.from("reposts").insert({ post_id: postId, user_id: userId });
    const { data: post } = await supabase
      .from("posts")
      .select("reposts_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ reposts_count: post.reposts_count + 1 })
        .eq("id", postId);
    }
  }

  return supabaseGetPostById(postId, userId);
}

function buildCommentTree(
  rows: CommentWithAuthor[]
): CommentWithAuthor[] {
  const map = new Map<string, CommentWithAuthor>();
  rows.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  const roots: CommentWithAuthor[] = [];
  map.forEach((c) => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(c);
    } else if (!c.parentId) {
      roots.push(c);
    }
  });

  roots.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return roots;
}

export async function supabaseGetPostComments(
  postId: string
): Promise<CommentWithAuthor[]> {
  const { data: comments } = await db()
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (!comments?.length) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: usersData } = await db()
    .from("users")
    .select("*")
    .in("id", userIds);
  const users: UserRow[] = usersData ?? [];
  const userMap = new Map(users.map((u) => [u.id, mapUser(u)]));

  const withAuthors: CommentWithAuthor[] = comments.map((c) => ({
    ...mapComment(c),
    author: userMap.get(c.user_id)!,
    replies: [],
  }));

  return buildCommentTree(withAuthors);
}

export async function supabaseAddComment(
  postId: string,
  userId: string,
  content: string,
  parentId: string | null = null
): Promise<CommentWithAuthor | null> {
  const supabase = db();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      parent_id: parentId,
      content,
    })
    .select("*")
    .single();

  if (error || !data) return null;

  const { data: post } = await supabase
    .from("posts")
    .select("comments_count")
    .eq("id", postId)
    .single();

  if (post) {
    await supabase
      .from("posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", postId);

    const { data: postOwner } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();
    if (postOwner && postOwner.user_id !== userId) {
      await createNotification(postOwner.user_id, userId, "comment", {
        postId,
        commentId: data.id,
      });
    }
    await notifyMentions(content, userId, postId);
  }

  const author = await supabaseGetUserById(userId);
  if (!author) return null;

  return { ...mapComment(data), author, replies: [] };
}

export async function supabaseToggleFollow(
  followerId: string,
  followingId: string
): Promise<{ following: boolean; followersCount: number } | null> {
  if (followerId === followingId) return null;

  const supabase = db();
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  const { data: target } = await supabase
    .from("users")
    .select("followers_count")
    .eq("id", followingId)
    .single();

  const { data: follower } = await supabase
    .from("users")
    .select("following_count")
    .eq("id", followerId)
    .single();

  if (!target || !follower) return null;

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    const newFollowers = Math.max(0, target.followers_count - 1);
    const newFollowing = Math.max(0, follower.following_count - 1);
    await supabase
      .from("users")
      .update({ followers_count: newFollowers })
      .eq("id", followingId);
    await supabase
      .from("users")
      .update({ following_count: newFollowing })
      .eq("id", followerId);
    return { following: false, followersCount: newFollowers };
  }

  await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  await createNotification(followingId, followerId, "follow");
  const newFollowers = target.followers_count + 1;
  const newFollowing = follower.following_count + 1;
  await supabase
    .from("users")
    .update({ followers_count: newFollowers })
    .eq("id", followingId);
  await supabase
    .from("users")
    .update({ following_count: newFollowing })
    .eq("id", followerId);
  return { following: true, followersCount: newFollowers };
}

export async function supabaseIsFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data } = await db()
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function supabaseGetActiveMembers(): Promise<User[]> {
  const { supabaseGetOnlineMembers } = await import("@/lib/data/supabase-social");
  return supabaseGetOnlineMembers();
}

export { supabaseUpdatePost, supabaseToggleReaction, supabaseVotePoll, supabaseTogglePin, supabaseUpdateProfile, supabaseGetNotifications, supabaseMarkNotificationsRead, supabaseGetUnreadCount, supabaseUpdateLastSeen, supabaseGetFollowingFeed, supabaseGetForYouFeed } from "@/lib/data/supabase-social";
