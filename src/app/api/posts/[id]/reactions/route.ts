import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import { supabaseToggleReaction } from "@/lib/data/supabase-store";
import type { ReactionEmoji } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { emoji } = (await request.json()) as { emoji: ReactionEmoji };

  const post = await supabaseToggleReaction(id, userId, emoji);
  if (!post) {
    return NextResponse.json({ error: "Error" }, { status: 400 });
  }

  return NextResponse.json({ post });
}
