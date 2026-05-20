import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreTriviaRound, verifyAnswerToken } from "@/lib/trivia/open-trivia";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    answerToken?: string;
    selectedIndex?: number;
    elapsedMs?: number;
  };

  if (!body.answerToken || typeof body.selectedIndex !== "number") {
    return NextResponse.json({ error: "Respuesta inválida" }, { status: 400 });
  }

  const payload = verifyAnswerToken(body.answerToken);
  if (!payload) {
    return NextResponse.json({ error: "Pregunta expirada o inválida" }, { status: 400 });
  }

  const correct = payload.correctIndex === body.selectedIndex;
  const roundScore = scoreTriviaRound(correct, body.elapsedMs);

  if (!isSupabaseConfigured() || roundScore <= 0) {
    return NextResponse.json({
      correct,
      roundScore,
      totalPoints: null,
    });
  }

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
    correct,
    roundScore,
    totalPoints: newTotal,
  });
}
