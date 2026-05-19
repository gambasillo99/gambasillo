import type {
  User,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
} from "@/types";
import type { Database, UserRow } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapUser, mapPost, mapComment } from "@/lib/supabase/mappers";
import { hashPassword, normalizeUsername } from "@/lib/utils";
import { SEED_USERS, SEED_PASSWORD } from "./seed";

function db() {
  return createAdminClient();
}

async function enrichPosts(
  posts: ReturnType<typeof mapPost>[],
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
  const userMap = new Map(users.map((u) => [u.id, mapUser(u)]));

  const likedSet = new Set<string>();
  const repostedSet = new Set<string>();

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

  return posts.map((post) => ({
    ...post,
    author: userMap.get(post.userId)!,
    likedByMe: likedSet.has(post.id),
    repostedByMe: repostedSet.has(post.id),
  }));
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
  return enrichPosts(data.map(mapPost), currentUserId);
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
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!data?.length) return [];
  return enrichPosts(data.map(mapPost), currentUserId);
}

export async function supabaseGetPostById(
  id: string,
  currentUserId?: string
): Promise<PostWithAuthor | null> {
  const { data } = await db().from("posts").select("*").eq("id", id).single();
  if (!data) return null;
  const [post] = await enrichPosts([mapPost(data)], currentUserId);
  return post ?? null;
}

export async function supabaseCreatePost(
  userId: string,
  content: string,
  media: MediaItem[] = []
): Promise<PostWithAuthor> {
  const { data, error } = await db()
    .from("posts")
    .insert({
      user_id: userId,
      content,
      media: media as Database["public"]["Tables"]["posts"]["Insert"]["media"],
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Error al crear post");
  const [post] = await enrichPosts([mapPost(data)], userId);
  return post;
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
      .select("likes_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: post.likes_count + 1 })
        .eq("id", postId);
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
  const { data } = await db()
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).map(mapUser);
}

export async function supabaseSeedIfEmpty(): Promise<void> {
  const supabase = db();
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return;

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const userIds: Record<string, string> = {};

  for (const u of SEED_USERS) {
    const { data } = await supabase
      .from("users")
      .insert({
        username: u.username,
        display_name: u.displayName,
        bio: u.bio,
        avatar_url: u.avatarUrl,
        password_hash: passwordHash,
        followers_count: u.followersCount,
        following_count: u.followingCount,
      })
      .select("id, username")
      .single();
    if (data) userIds[u.username] = data.id;
  }

  const marina = userIds.marina;
  const pixel = userIds.pixel;
  const nexus = userIds.nexus;

  const { data: post1 } = await supabase
    .from("posts")
    .insert({
      user_id: marina,
      content:
        "bienvenidos al gambasillo 🦐\n\nesto es nuestro rinconcito de internet. sin algoritmos, sin anuncios, solo amigos.",
      likes_count: 8,
      reposts_count: 2,
      comments_count: 3,
    })
    .select("id")
    .single();

  await supabase.from("posts").insert([
    {
      user_id: pixel,
      content:
        "alguien más despierto a esta hora o soy el único shrimp online? 🌙",
      likes_count: 5,
      comments_count: 1,
    },
    {
      user_id: nexus,
      content: "drop your best underground playlist links 👇",
      likes_count: 15,
      reposts_count: 4,
    },
    {
      user_id: marina,
      content: "nuevo drop visual incoming... stay tuned",
      media: [
        {
          id: "media-1",
          type: "image",
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        },
      ] as Database["public"]["Tables"]["posts"]["Insert"]["media"],
      likes_count: 22,
      reposts_count: 6,
      comments_count: 2,
    },
  ]);

  if (post1) {
    const { data: c1 } = await supabase
      .from("comments")
      .insert({
        post_id: post1.id,
        user_id: pixel,
        content: "esto va a ser legendario",
      })
      .select("id")
      .single();

    if (c1) {
      await supabase.from("comments").insert({
        post_id: post1.id,
        user_id: nexus,
        parent_id: c1.id,
        content: "facts",
      });
    }

    await supabase.from("comments").insert({
      post_id: post1.id,
      user_id: marina,
      content: "🦐🦐🦐",
    });

    await supabase.from("likes").insert([
      { user_id: pixel, post_id: post1.id },
      { user_id: nexus, post_id: post1.id },
    ]);
    await supabase
      .from("reposts")
      .insert({ user_id: nexus, post_id: post1.id });
  }

  await supabase.from("follows").insert([
    { follower_id: pixel, following_id: marina },
    { follower_id: nexus, following_id: marina },
    { follower_id: marina, following_id: pixel },
  ]);
}
