const KEYS = {
  users: "gambasillo_users",
  posts: "gambasillo_posts",
  comments: "gambasillo_comments",
  likes: "gambasillo_likes",
  reposts: "gambasillo_reposts",
  follows: "gambasillo_follows",
  session: "gambasillo_session",
  reactions: "gambasillo_reactions",
  notifications: "gambasillo_notifications",
  pollVotes: "gambasillo_poll_votes",
  colorGameTotals: "gambasillo_color_game_totals",
} as const;

export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export { KEYS };
