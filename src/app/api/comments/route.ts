import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";
import { maybeReplyAsAitana } from "@/lib/bots/aitana";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId requerido" }, { status: 400 });
  }

  const comments = await supabaseStore.supabaseGetPostComments(postId);
  return NextResponse.json({ comments });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { postId, content, parentId } = await request.json();
  const comment = await supabaseStore.supabaseAddComment(
    postId,
    userId,
    content,
    parentId ?? null
  );

  if (!comment) {
    return NextResponse.json({ error: "No se pudo comentar" }, { status: 400 });
  }

  await maybeReplyAsAitana({
    postId,
    content,
    parentCommentId: comment.id,
    authorUserId: userId,
  }).catch(() => {});

  return NextResponse.json({ comment });
}
