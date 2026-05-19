import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary no configurado" },
      { status: 503 }
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "image";

  if (!file) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const resourceType =
    type === "video" ? "video" : type === "audio" ? "video" : "image";

  try {
    const result = await uploadToCloudinary(file, resourceType);
    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      type,
      id: generateId(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al subir" },
      { status: 500 }
    );
  }
}
