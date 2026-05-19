export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinaryUrl(
  publicId: string,
  options?: { width?: number; height?: number; resourceType?: string }
): string {
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    "demo";
  const type = options?.resourceType ?? "image";
  const w = options?.width ? `,w_${options.width}` : "";
  const h = options?.height ? `,h_${options.height}` : "";
  return `https://res.cloudinary.com/${cloud}/${type}/upload/f_auto,q_auto${w}${h}/${publicId}`;
}

export async function uploadToCloudinary(
  file: File | Blob,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<{ url: string; publicId: string; resourceType: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary no configurado");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "gambasillo";

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const endpoint =
    resourceType === "raw"
      ? `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
      : `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const res = await fetch(endpoint, { method: "POST", body: formData });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message ?? "Error al subir a Cloudinary");
  }

  return {
    url: json.secure_url as string,
    publicId: json.public_id as string,
    resourceType: json.resource_type as string,
  };
}
