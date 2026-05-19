import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

  await supabaseStore.supabaseSeedIfEmpty();
  return NextResponse.json({ ok: true });
}
