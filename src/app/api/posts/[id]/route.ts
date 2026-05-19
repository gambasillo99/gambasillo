import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const { id } = await params;
  const currentUserId = await getSessionUserId();
  const post = await supabaseStore.supabaseGetPostById(
    id,
    currentUserId ?? undefined
  );

  if (!post) {
    return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
