import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/config";
import {
  supabaseGetUserById,
  supabaseUpdateProfile,
} from "@/lib/data/supabase-store";
import type { UpdateProfileInput } from "@/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await supabaseGetUserById(userId);
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateProfileInput;
  const user = await supabaseUpdateProfile(userId, body);

  if (!user) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 400 });
  }

  return NextResponse.json({ user });
}
