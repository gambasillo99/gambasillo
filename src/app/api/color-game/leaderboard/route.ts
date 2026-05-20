import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ROWS = 50;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ entries: [] });
  }

  const supabase = createAdminClient();
  const { data: scores, error } = await supabase
    .from("color_game_scores")
    .select("user_id, total_points")
    .order("total_points", { ascending: false })
    .limit(MAX_ROWS);

  if (error || !scores?.length) {
    return NextResponse.json({ entries: [] });
  }

  const ids = scores.map((s) => s.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);

  const map = new Map((users ?? []).map((u) => [u.id, u]));

  const entries = scores.map((s, index) => {
    const u = map.get(s.user_id);
    return {
      rank: index + 1,
      userId: s.user_id,
      totalPoints: Number(s.total_points),
      username: u?.username ?? "—",
      displayName: u?.display_name ?? "—",
      avatarUrl: u?.avatar_url ?? "",
    };
  });

  return NextResponse.json({ entries });
}
