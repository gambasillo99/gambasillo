import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const users = await supabaseStore.supabaseGetActiveMembers();
  return NextResponse.json({ users });
}
