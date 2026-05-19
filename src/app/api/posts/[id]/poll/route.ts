import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import { supabaseVotePoll } from "@/lib/data/supabase-store";

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
  const { optionId } = (await request.json()) as { optionId: string };

  const post = await supabaseVotePoll(id, userId, optionId);
  if (!post) {
    return NextResponse.json({ error: "Error al votar" }, { status: 400 });
  }

  return NextResponse.json({ post });
}
