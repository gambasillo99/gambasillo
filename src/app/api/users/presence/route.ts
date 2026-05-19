import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import { supabaseUpdateLastSeen } from "@/lib/data/supabase-store";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await supabaseUpdateLastSeen(userId);
  return NextResponse.json({ ok: true });
}
