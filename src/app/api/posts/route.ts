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
  const currentUserId = await getSessionUserId();

  const posts = userId
    ? await supabaseStore.supabaseGetUserPosts(
        userId,
        page,
        pageSize,
        currentUserId ?? undefined
      )
    : await supabaseStore.supabaseGetFeedPosts(
        page,
        pageSize,
        currentUserId ?? undefined
      );

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

  const { content, media } = (await request.json()) as {
    content: string;
    media?: MediaItem[];
  };

  const post = await supabaseStore.supabaseCreatePost(
    userId,
    content,
    media ?? []
  );

  return NextResponse.json({ post });
}
