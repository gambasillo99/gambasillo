import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";
import type { MediaItem } from "@/types";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 0);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);
  const userId = searchParams.get("userId");
  const mode = searchParams.get("mode") ?? "foryou";
  const currentUserId = await getSessionUserId();

  let posts;
  if (userId) {
    posts = await supabaseStore.supabaseGetUserPosts(
      userId,
      page,
      pageSize,
      currentUserId ?? undefined
    );
  } else if (mode === "following" && currentUserId) {
    posts = await supabaseStore.supabaseGetFollowingFeed(
      currentUserId,
      page,
      pageSize
    );
  } else if (mode === "foryou") {
    posts = currentUserId
      ? await supabaseStore.supabaseGetForYouFeed(currentUserId, page, pageSize)
      : await supabaseStore.supabaseGetFeedPosts(
          page,
          pageSize,
          undefined
        );
  } else {
    posts = await supabaseStore.supabaseGetFeedPosts(
      page,
      pageSize,
      currentUserId ?? undefined
    );
  }

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { content, media, pollOptions } = (await request.json()) as {
    content: string;
    media?: MediaItem[];
    pollOptions?: string[];
  };

  const post = await supabaseStore.supabaseCreatePost(
    userId,
    content,
    media ?? [],
    pollOptions
  );

  return NextResponse.json({ post });
}
