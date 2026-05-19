import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const followerId = await getSessionUserId();
  if (!followerId) {
    return NextResponse.json({ following: false });
  }

  const { userId } = await params;
  const following = await supabaseStore.supabaseIsFollowing(followerId, userId);
  return NextResponse.json({ following });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const followerId = await getSessionUserId();
  if (!followerId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { userId } = await params;
  const result = await supabaseStore.supabaseToggleFollow(followerId, userId);

  if (!result) {
    return NextResponse.json({ error: "No se pudo seguir" }, { status: 400 });
  }

  return NextResponse.json(result);
}
