import { createHash, createHmac, timingSafeEqual } from "crypto";

export interface TriviaQuestionPublic {
  prompt: string;
  options: string[];
  category: string;
  difficulty: string;
  token: string;
  answerToken: string;
}

interface OpenTriviaResponse {
  response_code: number;
  results: Array<{
    category: string;
    type: "multiple" | "boolean";
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
}

const OPEN_TRIVIA_BASE = "https://opentdb.com/api.php";
const OPEN_TRIVIA_TOKEN = "https://opentdb.com/api_token.php";
const TRANSLATE_BASE = "https://translate.googleapis.com/translate_a/single";

function secretKey(): string {
  return process.env.SESSION_SECRET || "gambasillo-dev-secret-change-in-production";
}

function decode3986(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

async function getSessionToken(): Promise<string> {
  const res = await fetch(`${OPEN_TRIVIA_TOKEN}?command=request`, { cache: "no-store" });
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("No se pudo obtener token de trivia");
  return data.token;
}

async function resetSessionToken(token: string): Promise<void> {
  await fetch(`${OPEN_TRIVIA_TOKEN}?command=reset&token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  }).catch(() => {});
}

export async function fetchTriviaRaw(token?: string): Promise<{
  token: string;
  category: string;
  difficulty: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}> {
  let activeToken = token || (await getSessionToken());

  const call = async (t: string) => {
    const url = `${OPEN_TRIVIA_BASE}?amount=1&category=9&type=multiple&encode=url3986&token=${encodeURIComponent(
      t
    )}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as OpenTriviaResponse;
    return data;
  };

  let data = await call(activeToken);
  if (data.response_code === 4) {
    await resetSessionToken(activeToken);
    data = await call(activeToken);
  }
  if (!data.results?.length) {
    activeToken = await getSessionToken();
    data = await call(activeToken);
  }
  if (!data.results?.length) {
    throw new Error("Sin preguntas disponibles ahora mismo");
  }

  const q = data.results[0];
  return {
    token: activeToken,
    category: decode3986(q.category),
    difficulty: decode3986(q.difficulty),
    question: decode3986(q.question),
    correctAnswer: decode3986(q.correct_answer),
    incorrectAnswers: q.incorrect_answers.map((x) => decode3986(x)),
  };
}

async function translateToSpanish(text: string): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: "es",
    dt: "t",
    q: text,
  });
  const res = await fetch(`${TRANSLATE_BASE}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return text;
  const raw = (await res.json()) as unknown[];
  const chunks = Array.isArray(raw?.[0]) ? (raw[0] as unknown[]) : [];
  const out = chunks
    .map((c) => (Array.isArray(c) ? c[0] : ""))
    .filter((x): x is string => typeof x === "string")
    .join("")
    .trim();
  return out || text;
}

function questionHash(question: string, correctAnswer: string): string {
  return createHash("sha256")
    .update(`${question}\n${correctAnswer}`)
    .digest("hex");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function signPayload(payload: string): string {
  return createHmac("sha256", secretKey()).update(payload).digest("base64url");
}

export async function buildTriviaQuestion(token?: string): Promise<TriviaQuestionPublic> {
  const raw = await fetchTriviaRaw(token);
  const promptEs = await translateToSpanish(raw.question).catch(() => raw.question);
  const correctEs = await translateToSpanish(raw.correctAnswer).catch(
    () => raw.correctAnswer
  );
  const incorrectEs = await Promise.all(
    raw.incorrectAnswers.map((x) => translateToSpanish(x).catch(() => x))
  );

  const options = shuffle([correctEs, ...incorrectEs]);
  const correctIndex = options.findIndex((x) => x === correctEs);
  const qHash = questionHash(promptEs, correctEs);
  const payload = JSON.stringify({
    q: qHash,
    c: correctIndex,
    exp: Date.now() + 1000 * 60 * 10,
  });
  const sig = signPayload(payload);
  const answerToken = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  return {
    prompt: promptEs,
    options,
    category: raw.category,
    difficulty: raw.difficulty,
    token: raw.token,
    answerToken,
  };
}

export function verifyAnswerToken(token: string): { correctIndex: number } | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
  const expected = signPayload(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  const ok = timingSafeEqual(a, b);
  if (!ok) return null;
  const data = JSON.parse(payload) as { c: number; exp: number };
  if (Date.now() > data.exp) return null;
  if (!Number.isInteger(data.c) || data.c < 0 || data.c > 3) return null;
  return { correctIndex: data.c };
}

export function scoreTriviaRound(correct: boolean, elapsedMs?: number): number {
  if (!correct) return 0;
  const t = typeof elapsedMs === "number" ? Math.max(0, elapsedMs) : 5000;
  if (t < 1500) return 10;
  if (t < 2500) return 9;
  if (t < 3500) return 8;
  if (t < 5000) return 7;
  if (t < 7000) return 6;
  if (t < 9000) return 5;
  return 4;
}
