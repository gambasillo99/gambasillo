import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseRgbBody,
  roundScoreForGuess,
} from "@/lib/color-game/score";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ totalPoints: 0 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("color_game_scores")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();

  return NextResponse.json({
    totalPoints: Number(data?.total_points ?? 0),
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    target?: unknown;
    guess?: unknown;
  };
  const target = parseRgbBody(body.target);
  const guess = parseRgbBody(body.guess);
  if (!target || !guess) {
    return NextResponse.json(
      { error: "Envía target y guess como { r, g, b } entre 0 y 255" },
      { status: 400 }
    );
  }

  const roundScore = roundScoreForGuess(target, guess);
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("color_game_scores")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();

  const prev = Number(existing?.total_points ?? 0);
  const newTotal = prev + roundScore;

  const { error } = await supabase.from("color_game_scores").upsert(
    {
      user_id: userId,
      total_points: newTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    roundScore,
    totalPoints: newTotal,
  });
}
