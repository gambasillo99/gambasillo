import type { User, Post, Comment, Like, Repost, Follow } from "@/types";

export const SEED_USERS: Omit<User, "id">[] = [
  {
    username: "marina",
    displayName: "Marina 🦐",
    bio: "Reina del gambasillo. Underground vibes only.",
    avatarUrl: "",
    followersCount: 12,
    followingCount: 8,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    username: "pixel",
    displayName: "Pixel",
    bio: "Hago memes y código a las 3am.",
    avatarUrl: "",
    followersCount: 24,
    followingCount: 15,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    username: "nexus",
    displayName: "NEXUS",
    bio: "el club privado existe",
    avatarUrl: "",
    followersCount: 42,
    followingCount: 42,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
];

export function buildSeedData(userIds: Record<string, string>) {
  const marina = userIds.marina;
  const pixel = userIds.pixel;
  const nexus = userIds.nexus;

  const posts: Post[] = [
    {
      id: "seed-post-1",
      userId: marina,
      content:
        "bienvenidos al gambasillo 🦐\n\nesto es nuestro rinconcito de internet. sin algoritmos, sin anuncios, solo amigos.",
      media: [],
      likesCount: 8,
      repostsCount: 2,
      commentsCount: 3,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "seed-post-2",
      userId: pixel,
      content: "alguien más despierto a esta hora o soy el único shrimp online? 🌙",
      media: [],
      likesCount: 5,
      repostsCount: 0,
      commentsCount: 1,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "seed-post-3",
      userId: nexus,
      content: "drop your best underground playlist links 👇",
      media: [],
      likesCount: 15,
      repostsCount: 4,
      commentsCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "seed-post-4",
      userId: marina,
      content: "nuevo drop visual incoming... stay tuned",
      media: [
        {
          id: "media-1",
          type: "image",
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        },
      ],
      likesCount: 22,
      repostsCount: 6,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const comments: Comment[] = [
    {
      id: "seed-comment-1",
      postId: "seed-post-1",
      userId: pixel,
      parentId: null,
      content: "esto va a ser legendario",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "seed-comment-2",
      postId: "seed-post-1",
      userId: nexus,
      parentId: "seed-comment-1",
      content: "facts",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "seed-comment-3",
      postId: "seed-post-1",
      userId: marina,
      parentId: null,
      content: "🦐🦐🦐",
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: "seed-comment-4",
      postId: "seed-post-2",
      userId: marina,
      parentId: null,
      content: "yo también, shrimp gang",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];

  const likes: Like[] = [
    { id: "like-1", userId: pixel, postId: "seed-post-1", createdAt: new Date().toISOString() },
    { id: "like-2", userId: nexus, postId: "seed-post-1", createdAt: new Date().toISOString() },
  ];

  const reposts: Repost[] = [
    { id: "repost-1", userId: nexus, postId: "seed-post-1", createdAt: new Date().toISOString() },
  ];

  const follows: Follow[] = [
    { id: "f1", followerId: pixel, followingId: marina, createdAt: new Date().toISOString() },
    { id: "f2", followerId: nexus, followingId: marina, createdAt: new Date().toISOString() },
    { id: "f3", followerId: marina, followingId: pixel, createdAt: new Date().toISOString() },
  ];

  return { posts, comments, likes, reposts, follows };
}

export const SEED_PASSWORD = "gambas123";
