import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import {
  supabaseGetNotifications,
  supabaseMarkNotificationsRead,
  supabaseGetUnreadCount,
} from "@/lib/data/supabase-store";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    supabaseGetNotifications(userId),
    supabaseGetUnreadCount(userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await supabaseMarkNotificationsRead(userId);
  return NextResponse.json({ ok: true });
}
