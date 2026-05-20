import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";
import type { MediaItem } from "@/types";

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
    return NextResponse.json({ error: "Gamba no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(
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
  const { content, media } = (await request.json()) as {
    content: string;
    media?: MediaItem[];
  };

  const post = await supabaseStore.supabaseUpdatePost(
    id,
    userId,
    content,
    media
  );

  if (!post) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json({ post });
}

export async function DELETE(
  _request: Request,
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
  const ok = await supabaseStore.supabaseDeletePost(id, userId);
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
