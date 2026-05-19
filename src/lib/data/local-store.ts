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
} from "@/types";
import { getItem, setItem, KEYS } from "@/lib/storage";
import { generateId, hashPassword, normalizeUsername } from "@/lib/utils";
import { SEED_USERS, buildSeedData, SEED_PASSWORD } from "./seed";

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

export async function seedDatabaseIfNeeded(): Promise<void> {
  if (getItem<boolean>(KEYS.seeded)) return;

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const userIds: Record<string, string> = {};
  const users: StoredUser[] = SEED_USERS.map((u) => {
    const id = generateId();
    userIds[u.username] = id;
    return {
      ...u,
      id,
      passwordHash,
    };
  });

  const { posts, comments, likes, reposts, follows } = buildSeedData(userIds);

  saveUsers(users);
  savePosts(posts);
  saveComments(comments);
  saveLikes(likes);
  saveReposts(reposts);
  saveFollows(follows);
  setItem(KEYS.seeded, true);
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
    followersCount: 0,
    followingCount: 0,
    createdAt: new Date().toISOString(),
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
  const author = getUserById(post.userId)!;
  const likes = getLikes();
  const reposts = getReposts();
  return {
    ...post,
    author,
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
  currentUserId?: string
): PostWithAuthor[] {
  const posts = getPosts()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(page * pageSize, (page + 1) * pageSize);
  return posts.map((p) => enrichPost(p, currentUserId));
}

export function getUserPosts(
  userId: string,
  page: number,
  pageSize: number,
  currentUserId?: string
): PostWithAuthor[] {
  const posts = getPosts()
    .filter((p) => p.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(page * pageSize, (page + 1) * pageSize);
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
  media: MediaItem[] = []
): PostWithAuthor {
  const posts = getPosts();
  const newPost: Post = {
    id: generateId(),
    userId,
    content,
    media,
    likesCount: 0,
    repostsCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };
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
    .map(({ passwordHash: _, ...u }) => u)
    .slice(0, 5);
}
