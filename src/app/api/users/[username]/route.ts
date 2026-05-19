import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const { username } = await params;
  const user = await supabaseStore.supabaseGetUserByUsername(username);

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
