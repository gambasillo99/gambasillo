import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import * as supabaseStore from "@/lib/data/supabase-store";
import { createSessionToken, COOKIE_NAME } from "@/lib/session";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

  const { username, password, displayName } = await request.json();
  const result = await supabaseStore.supabaseRegisterUser(
    username,
    password,
    displayName
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const token = await createSessionToken(result.user.id);
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
