import type {
  User,
  Post,
  Comment,
  Like,
  Repost,
  Follow,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
  ReactionEmoji,
  UpdateProfileInput,
  Notification,
  FeedMode,
} from "@/types";
import { getItem, setItem, KEYS } from "@/lib/storage";
import { generateId, hashPassword, normalizeUsername } from "@/lib/utils";
import {
  attachSocialToPost,
  buildPollFromOptions,
  defaultPostFields,
  filterFeedPosts,
  getNotificationsStore,
  getPollVotes,
  getReactions,
  pushNotification,
  saveNotificationsStore,
  savePollVotes,
  saveReactions,
  updatePostLocal,
} from "./local-social-ext";
import { isUserOnline } from "@/lib/presence";
interface StoredUser extends User {
  passwordHash: string;
}

function getUsers(): StoredUser[] {
  return getItem<StoredUser[]>(KEYS.users) ?? [];
}

function getPosts(): Post[] {
  return getItem<Post[]>(KEYS.posts) ?? [];
}

function getComments(): Comment[] {
  return getItem<Comment[]>(KEYS.comments) ?? [];
}

function getLikes(): Like[] {
  return getItem<Like[]>(KEYS.likes) ?? [];
}

function getReposts(): Repost[] {
  return getItem<Repost[]>(KEYS.reposts) ?? [];
}

function getFollows(): Follow[] {
  return getItem<Follow[]>(KEYS.follows) ?? [];
}

function saveUsers(users: StoredUser[]) {
  setItem(KEYS.users, users);
}

function savePosts(posts: Post[]) {
  setItem(KEYS.posts, posts);
}

function saveComments(comments: Comment[]) {
  setItem(KEYS.comments, comments);
}

function saveLikes(likes: Like[]) {
  setItem(KEYS.likes, likes);
}

function saveReposts(reposts: Repost[]) {
  setItem(KEYS.reposts, reposts);
}

function saveFollows(follows: Follow[]) {
  setItem(KEYS.follows, follows);
}

export function getUserById(id: string): User | null {
  const user = getUsers().find((u) => u.id === id);
  if (!user) return null;
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

export function getUserByUsername(username: string): User | null {
  const normalized = normalizeUsername(username);
  const user = getUsers().find((u) => u.username === normalized);
  if (!user) return null;
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

export async function registerUser(
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
  const users = getUsers();
  if (users.some((u) => u.username === normalized)) {
    return { error: "Ese @usuario ya existe" };
  }

  const passwordHash = await hashPassword(password);
  const newUser: StoredUser = {
    id: generateId(),
    username: normalized,
    displayName: displayName || normalized,
    bio: "",
    avatarUrl: "",
    bannerUrl: "",
    links: [],
    followersCount: 0,
    followingCount: 0,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    passwordHash,
  };
  users.push(newUser);
  saveUsers(users);
  const { passwordHash: _, ...publicUser } = newUser;
  return { user: publicUser };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const normalized = normalizeUsername(username);
  const users = getUsers();
  const user = users.find((u) => u.username === normalized);
  if (!user) return { error: "Usuario o contraseña incorrectos" };

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return { error: "Usuario o contraseña incorrectos" };
  }

  const { passwordHash: _, ...publicUser } = user;
  return { user: publicUser };
}

function enrichPost(post: Post, currentUserId?: string): PostWithAuthor {
  const likes = getLikes();
  const reposts = getReposts();
  const base = attachSocialToPost(post, currentUserId, getUserById);
  return {
    ...base,
    likedByMe: currentUserId
      ? likes.some((l) => l.userId === currentUserId && l.postId === post.id)
      : false,
    repostedByMe: currentUserId
      ? reposts.some((r) => r.userId === currentUserId && r.postId === post.id)
      : false,
  };
}

export function getFeedPosts(
  page: number,
  pageSize: number,
  currentUserId?: string,
  mode: FeedMode = "foryou"
): PostWithAuthor[] {
  const filtered = filterFeedPosts(getPosts(), mode, currentUserId, getFollows);
  const posts = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return posts.map((p) => enrichPost(p, currentUserId));
}

export function getUserPosts(
  userId: string,
  page: number,
  pageSize: number,
  currentUserId?: string
): PostWithAuthor[] {
  const posts = filterFeedPosts(
    getPosts().filter((p) => p.userId === userId),
    "all",
    currentUserId,
    getFollows
  ).slice(page * pageSize, (page + 1) * pageSize);
  return posts.map((p) => enrichPost(p, currentUserId));
}

export function getPostById(
  id: string,
  currentUserId?: string
): PostWithAuthor | null {
  const post = getPosts().find((p) => p.id === id);
  if (!post) return null;
  return enrichPost(post, currentUserId);
}

export function createPost(
  userId: string,
  content: string,
  media: MediaItem[] = [],
  pollOptions?: string[]
): PostWithAuthor {
  const posts = getPosts();
  const newPost = defaultPostFields({
    id: generateId(),
    userId,
    content,
    media,
    createdAt: new Date().toISOString(),
    poll: pollOptions?.length ? buildPollFromOptions(pollOptions) : null,
  });
  posts.unshift(newPost);
  savePosts(posts);
  return enrichPost(newPost, userId);
}

export function toggleLike(
  postId: string,
  userId: string
): PostWithAuthor | null {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  let likes = getLikes();
  const existing = likes.find(
    (l) => l.postId === postId && l.userId === userId
  );

  if (existing) {
    likes = likes.filter((l) => l.id !== existing.id);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    likes.push({
      id: generateId(),
      userId,
      postId,
      createdAt: new Date().toISOString(),
    });
    post.likesCount += 1;
    if (post.userId !== userId) {
      pushNotification(post.userId, userId, "like", { postId });
    }
  }

  saveLikes(likes);
  savePosts(posts);
  return enrichPost(post, userId);
}

export function toggleRepost(
  postId: string,
  userId: string
): PostWithAuthor | null {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  let reposts = getReposts();
  const existing = reposts.find(
    (r) => r.postId === postId && r.userId === userId
  );

  if (existing) {
    reposts = reposts.filter((r) => r.id !== existing.id);
    post.repostsCount = Math.max(0, post.repostsCount - 1);
  } else {
    reposts.push({
      id: generateId(),
      userId,
      postId,
      createdAt: new Date().toISOString(),
    });
    post.repostsCount += 1;
  }

  saveReposts(reposts);
  savePosts(posts);
  return enrichPost(post, userId);
}

function buildCommentTree(
  comments: Comment[],
  postId: string
): CommentWithAuthor[] {
  const postComments = comments.filter((c) => c.postId === postId);
  const withAuthors = postComments.map((c) => ({
    ...c,
    author: getUserById(c.userId)!,
    replies: [] as CommentWithAuthor[],
  }));

  const map = new Map<string, CommentWithAuthor>();
  withAuthors.forEach((c) => map.set(c.id, c));

  const roots: CommentWithAuthor[] = [];
  withAuthors.forEach((c) => {
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

export function getPostComments(
  postId: string,
  _currentUserId?: string
): CommentWithAuthor[] {
  return buildCommentTree(getComments(), postId);
}

export function addComment(
  postId: string,
  userId: string,
  content: string,
  parentId: string | null = null
): CommentWithAuthor | null {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  const comments = getComments();
  const newComment: Comment = {
    id: generateId(),
    postId,
    userId,
    parentId,
    content,
    createdAt: new Date().toISOString(),
  };
  comments.push(newComment);
  post.commentsCount += 1;
  saveComments(comments);
  savePosts(posts);
  if (post.userId !== userId) {
    pushNotification(post.userId, userId, "comment", {
      postId,
      commentId: newComment.id,
    });
  }

  return {
    ...newComment,
    author: getUserById(userId)!,
    replies: [],
  };
}

export function toggleFollow(
  followerId: string,
  followingId: string
): { following: boolean; followersCount: number } | null {
  if (followerId === followingId) return null;

  const users = getUsers();
  const follower = users.find((u) => u.id === followerId);
  const following = users.find((u) => u.id === followingId);
  if (!follower || !following) return null;

  let follows = getFollows();
  const existing = follows.find(
    (f) => f.followerId === followerId && f.followingId === followingId
  );

  if (existing) {
    follows = follows.filter((f) => f.id !== existing.id);
    follower.followingCount = Math.max(0, follower.followingCount - 1);
    following.followersCount = Math.max(0, following.followersCount - 1);
  } else {
    follows.push({
      id: generateId(),
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    });
    follower.followingCount += 1;
    following.followersCount += 1;
    pushNotification(followingId, followerId, "follow");
  }

  saveFollows(follows);
  saveUsers(users);
  return {
    following: !existing,
    followersCount: following.followersCount,
  };
}

export function isFollowing(followerId: string, followingId: string): boolean {
  return getFollows().some(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
}

export function getActiveMembers(): User[] {
  return getUsers()
    .map(({ passwordHash: _, ...u }) => ({
      ...u,
      isOnline: isUserOnline(u.lastSeenAt),
    }))
    .filter((u) => u.isOnline)
    .slice(0, 12);
}

export function updateLastSeen(userId: string): void {
  const users = getUsers();
  const u = users.find((x) => x.id === userId);
  if (u) {
    u.lastSeenAt = new Date().toISOString();
    saveUsers(users);
  }
}

export function updatePost(
  postId: string,
  userId: string,
  content: string,
  media?: MediaItem[]
): PostWithAuthor | null {
  const posts = getPosts();
  const updated = updatePostLocal(posts, postId, userId, content, media);
  if (!updated) return null;
  savePosts(posts);
  return enrichPost(updated, userId);
}

export function toggleReaction(
  postId: string,
  userId: string,
  emoji: ReactionEmoji
): PostWithAuthor | null {
  const post = getPosts().find((p) => p.id === postId);
  if (!post) return null;
  let rows = getReactions();
  const existing = rows.find(
    (r) => r.postId === postId && r.userId === userId
  );
  if (existing) {
    if (existing.emoji === emoji) {
      rows = rows.filter((r) => r.id !== existing.id);
    } else {
      existing.emoji = emoji;
    }
  } else {
    rows.push({
      id: generateId(),
      postId,
      userId,
      emoji,
    });
    if (post.userId !== userId) {
      pushNotification(post.userId, userId, "reaction", { postId, emoji });
    }
  }
  saveReactions(rows);
  return enrichPost(post, userId);
}

export function votePoll(
  postId: string,
  userId: string,
  optionId: string
): PostWithAuthor | null {
  const post = getPosts().find((p) => p.id === postId);
  if (!post?.poll) return null;
  let votes = getPollVotes().filter(
    (v) => !(v.postId === postId && v.userId === userId)
  );
  votes.push({ postId, userId, optionId });
  savePollVotes(votes);
  return enrichPost(post, userId);
}

export function togglePin(
  postId: string,
  userId: string
): PostWithAuthor | null {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post || post.userId !== userId) return null;
  if (!post.isPinned) {
    posts.forEach((p) => {
      if (p.userId === userId && p.isPinned) {
        p.isPinned = false;
        p.pinnedAt = null;
      }
    });
  }
  post.isPinned = !post.isPinned;
  post.pinnedAt = post.isPinned ? new Date().toISOString() : null;
  savePosts(posts);
  return enrichPost(post, userId);
}

export function updateProfile(
  userId: string,
  input: UpdateProfileInput
): User | null {
  const users = getUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return null;
  if (input.displayName !== undefined) u.displayName = input.displayName;
  if (input.bio !== undefined) u.bio = input.bio;
  if (input.avatarUrl !== undefined) u.avatarUrl = input.avatarUrl;
  if (input.bannerUrl !== undefined) u.bannerUrl = input.bannerUrl;
  if (input.links !== undefined) u.links = input.links;
  saveUsers(users);
  const { passwordHash: _, ...publicUser } = u;
  return publicUser;
}

export function getNotifications(userId: string): {
  notifications: Notification[];
  unreadCount: number;
} {
  const rows = getNotificationsStore().filter((n) => n.userId === userId);
  const notifications: Notification[] = rows.map((n) => ({
    ...n,
    actor: getUserById(n.actorId) ?? undefined,
  }));
  const unreadCount = rows.filter((n) => !n.readAt).length;
  return { notifications, unreadCount };
}

export function markNotificationsRead(userId: string): void {
  const rows = getNotificationsStore();
  const now = new Date().toISOString();
  rows.forEach((n) => {
    if (n.userId === userId && !n.readAt) n.readAt = now;
  });
  saveNotificationsStore(rows);
}
