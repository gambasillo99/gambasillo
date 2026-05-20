import { extractMentions } from "@/lib/content";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/utils";
import {
  supabaseAddComment,
  supabaseGetUserById,
  supabaseGetUserByUsername,
} from "@/lib/data/supabase-store";

const AITANA_USERNAME = "aitana";

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, 320);
}

async function generateWithOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Eres @aitana, personaje virtual de Gambasillo. Responde SIEMPRE en espanol con tono picaro y coqueto moderado, sin contenido sexual explicito. Frases cortas (1-2 lineas), cercanas y divertidas.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 90,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const msg = data.choices?.[0]?.message?.content?.trim();
  return msg ? normalize(msg) : null;
}

function localAitanaFallback(authorName: string): string {
  const options = [
    `Ay ${authorName}, asi me gusta... invocandome con estilo 😌✨`,
    `${authorName}, te he leido y vengo con energia de travesura fina 😏`,
    `Si me etiquetas asi, yo aparezco... y encima te contesto 😌💫`,
    `${authorName}, que forma mas elegante de llamarme. Me quedo por aqui 😉`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}

export async function ensureAitanaUserId(): Promise<string> {
  const existing = await supabaseGetUserByUsername(AITANA_USERNAME);
  if (existing) return existing.id;

  const supabase = createAdminClient();
  const passwordHash = await hashPassword(
    process.env.AITANA_BOT_PASSWORD_SEED ?? "aitana-bot-no-login"
  );

  const { data, error } = await supabase
    .from("users")
    .insert({
      username: AITANA_USERNAME,
      display_name: "Aitana",
      bio: "Bot oficial del club. Picarita, rapida y con chispa.",
      avatar_url: "",
      banner_url: "",
      links: [],
      password_hash: passwordHash,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el usuario bot @aitana");
  }
  return data.id;
}

export async function maybeReplyAsAitana(input: {
  postId: string;
  content: string;
  parentCommentId?: string | null;
  authorUserId: string;
}): Promise<void> {
  const mentions = extractMentions(input.content);
  if (!mentions.includes(AITANA_USERNAME)) return;

  const aitanaId = await ensureAitanaUserId();
  if (input.authorUserId === aitanaId) return;

  const author = await supabaseGetUserById(input.authorUserId);
  const authorName = author?.displayName || `@${author?.username ?? "gambero"}`;
  const prompt = `Te han mencionado en una publicacion. Usuario: ${authorName}. Texto: "${normalize(
    input.content
  )}"`;
  const reply =
    (await generateWithOpenAI(prompt)) ?? localAitanaFallback(authorName);

  await supabaseAddComment(
    input.postId,
    aitanaId,
    reply,
    input.parentCommentId ?? null
  );
}
