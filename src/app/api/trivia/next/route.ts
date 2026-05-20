import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { buildTriviaQuestion } from "@/lib/trivia/open-trivia";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = new URL(request.url).searchParams.get("token") || undefined;
  try {
    const question = await buildTriviaQuestion(token);
    return NextResponse.json({ question });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cargar la pregunta" },
      { status: 502 }
    );
  }
}
