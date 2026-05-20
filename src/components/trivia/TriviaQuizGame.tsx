"use client";

import { useEffect, useMemo, useState } from "react";
import { copy } from "@/lib/gambas-copy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type TriviaQuestion = {
  prompt: string;
  options: string[];
  category: string;
  difficulty: string;
  token: string;
  answerToken: string;
};

export function TriviaQuizGame() {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);

  const canSubmit = selected !== null && !answered && !!question;

  const difficultyLabel = useMemo(() => {
    if (!question) return "";
    if (question.difficulty === "easy") return "Fácil";
    if (question.difficulty === "medium") return "Media";
    if (question.difficulty === "hard") return "Difícil";
    return question.difficulty;
  }, [question]);

  const loadQuestion = async () => {
    setLoading(true);
    setError("");
    setAnswered(false);
    setCorrect(null);
    setRoundScore(0);
    setSelected(null);

    try {
      const q = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/trivia/next${q}`, { credentials: "include" });
      const data = (await res.json()) as {
        question?: TriviaQuestion;
        error?: string;
      };
      if (!res.ok || !data.question) {
        throw new Error(data.error ?? "No se pudo cargar la pregunta");
      }
      setQuestion(data.question);
      setToken(data.question.token);
      setStartedAt(Date.now());
    } catch (e) {
      setQuestion(null);
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAnswer = async () => {
    if (!question || selected === null || answered) return;
    setLoading(true);
    try {
      const elapsedMs = Date.now() - startedAt;
      const res = await fetch("/api/trivia/answer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerToken: question.answerToken,
          selectedIndex: selected,
          elapsedMs,
        }),
      });
      const data = (await res.json()) as {
        correct?: boolean;
        roundScore?: number;
        totalPoints?: number | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "No se pudo validar respuesta");
      setAnswered(true);
      setCorrect(Boolean(data.correct));
      setRoundScore(Number(data.roundScore ?? 0));
      setTotalPoints(
        typeof data.totalPoints === "number" ? data.totalPoints : totalPoints
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo validar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gambas-border/40 bg-gambas-card/40 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{copy.quizTitle}</h2>
        <span className="text-xs text-gambas-muted">{copy.quiz4Options}</span>
      </div>

      {question && (
        <>
          <div className="text-xs text-gambas-muted flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-full bg-gambas-surface border border-gambas-border/30">
              {question.category}
            </span>
            <span className="px-2 py-1 rounded-full bg-gambas-surface border border-gambas-border/30">
              {difficultyLabel}
            </span>
          </div>

          <p className="text-gambas-text font-medium leading-relaxed">
            {question.prompt}
          </p>

          <div className="grid grid-cols-1 gap-2">
            {question.options.map((opt, idx) => (
              <button
                key={`${idx}-${opt}`}
                type="button"
                disabled={answered || loading}
                onClick={() => setSelected(idx)}
                className={cn(
                  "text-left px-3 py-2 rounded-xl border transition-colors",
                  selected === idx
                    ? "border-gambas-accent bg-gambas-accent/10"
                    : "border-gambas-border/40 hover:bg-gambas-surface"
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void submitAnswer()} disabled={!canSubmit || loading}>
              {copy.quizSubmit}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void loadQuestion()}
              disabled={loading}
            >
              {copy.quizNext}
            </Button>
          </div>
        </>
      )}

      {loading && <p className="text-sm text-gambas-muted">{copy.gambearing}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {answered && (
        <p className={cn("text-sm", correct ? "text-emerald-400" : "text-orange-300")}>
          {correct ? copy.quizCorrect : copy.quizWrong} · +{roundScore} pts
          {typeof totalPoints === "number" ? ` · ${copy.colorGameYourTotal}: ${totalPoints}` : ""}
        </p>
      )}
    </section>
  );
}
