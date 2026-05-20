"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { isRemoteBackend } from "@/lib/config";
import {
  type RGB,
  roundScoreForGuess,
  rgbToCss,
  clamp255,
} from "@/lib/color-game/score";
import { addLocalColorTotal, getLocalColorTotal } from "@/lib/color-game/local";
import { copy } from "@/lib/gambas-copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

type Phase = "memorize" | "guess" | "result";

function randomRgb(): RGB {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

type LeaderEntry = {
  rank: number;
  userId: string;
  totalPoints: number;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export function ColorMemoryGame() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("memorize");
  const [memKey, setMemKey] = useState(0);
  const [targetColor, setTargetColor] = useState<RGB>(randomRgb);
  const [guessColor, setGuessColor] = useState<RGB>({
    r: 128,
    g: 128,
    b: 128,
  });
  const [countdown, setCountdown] = useState(5);
  const [roundScore, setRoundScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

  const targetRef = useRef(targetColor);
  targetRef.current = targetColor;

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/color-game/leaderboard", {
        credentials: "include",
      });
      const data = (await res.json()) as { entries?: LeaderEntry[] };
      setLeaderboard(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (!user?.id) return;
    if (!isRemoteBackend()) {
      setLocalMode(true);
      setTotalPoints(getLocalColorTotal(user.id));
      return;
    }
    setLocalMode(false);
    void fetch("/api/color-game/score", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { totalPoints?: number } | null) => {
        if (d && typeof d.totalPoints === "number") setTotalPoints(d.totalPoints);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (phase !== "memorize") return;

    setCountdown(5);
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          setPhase("guess");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [phase, memKey]);

  useEffect(() => {
    if (phase !== "result") return;
    const t = window.setTimeout(() => {
      setTargetColor(randomRgb());
      setGuessColor({ r: 128, g: 128, b: 128 });
      setPhase("memorize");
      setMemKey((k) => k + 1);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [phase]);

  const submitGuess = async () => {
    if (!user || phase !== "guess") return;
    setBusy(true);
    const target = targetRef.current;
    const guess = {
      r: clamp255(guessColor.r),
      g: clamp255(guessColor.g),
      b: clamp255(guessColor.b),
    };

    const localRound = roundScoreForGuess(target, guess);
    try {
      const res = await fetch("/api/color-game/score", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, guess }),
      });
      const data = (await res.json()) as {
        roundScore?: number;
        totalPoints?: number;
      };

      if (res.ok && typeof data.totalPoints === "number") {
        setRoundScore(data.roundScore ?? localRound);
        setTotalPoints(data.totalPoints);
        setLocalMode(false);
      } else if (res.status === 503 || res.status === 500) {
        const t = addLocalColorTotal(user.id, localRound);
        setRoundScore(localRound);
        setTotalPoints(t);
        setLocalMode(true);
      } else {
        setRoundScore(localRound);
        if (user?.id) {
          const t = addLocalColorTotal(user.id, localRound);
          setTotalPoints(t);
          setLocalMode(true);
        }
      }
    } catch {
      const t = addLocalColorTotal(user.id, localRound);
      setRoundScore(localRound);
      setTotalPoints(t);
      setLocalMode(true);
    } finally {
      setBusy(false);
      setPhase("result");
      void loadBoard();
    }
  };

  const setChannel = (key: keyof RGB, v: number) => {
    setGuessColor((prev) => ({ ...prev, [key]: clamp255(v) }));
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gambas-text">{copy.colorGameTitle}</h1>
        <p className="text-sm text-gambas-muted mt-1 max-w-xl">
          {copy.colorGameSubtitle}
        </p>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-gambas-border/40 shadow-card",
          "min-h-[200px] flex flex-col items-center justify-center transition-colors duration-500",
          phase === "memorize" && "p-8"
        )}
        style={{
          backgroundColor:
            phase === "memorize"
              ? rgbToCss(targetColor)
              : "#0a0e14",
        }}
      >
        {phase === "memorize" && (
          <div className="text-center space-y-3 mix-blend-difference text-white drop-shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide">
              {copy.colorGameMemorize}
            </p>
            <p className="text-6xl font-black tabular-nums">{countdown}</p>
            <p className="text-sm opacity-90">{copy.colorGameCountdown}</p>
          </div>
        )}

        {phase === "guess" && (
          <div className="w-full p-6 space-y-6 text-gambas-text bg-gambas-card/95">
            <p className="text-center font-semibold">{copy.colorGameGuess}</p>
            <div className="flex flex-col sm:flex-row gap-6 items-stretch">
              <div
                className="flex-1 min-h-[120px] rounded-2xl border border-gambas-border/50 shrink-0"
                style={{ backgroundColor: rgbToCss(guessColor) }}
              />
              <div className="flex-1 space-y-4">
                {(["r", "g", "b"] as const).map((ch) => (
                  <label key={ch} className="block text-xs uppercase text-gambas-muted">
                    {ch}
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={guessColor[ch]}
                      onChange={(e) =>
                        setChannel(ch, Number(e.target.value))
                      }
                      className="w-full accent-gambas-accent mt-1"
                    />
                    <span className="text-gambas-text tabular-nums">
                      {guessColor[ch]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              fullWidth
              disabled={busy}
              onClick={() => void submitGuess()}
              className="gap-2"
            >
              {copy.colorGameConfirm}
            </Button>
          </div>
        )}

        {phase === "result" && (
          <div className="w-full p-6 bg-gambas-card/95 text-gambas-text text-center space-y-4">
            <p className="text-lg font-bold">
              {copy.colorGameRound}:{" "}
              <span className="text-gambas-accent">{roundScore}</span>{" "}
              {copy.colorGamePoints}
            </p>
            {totalPoints !== null && (
              <p className="text-sm text-gambas-muted">
                {copy.colorGameYourTotal}:{" "}
                <strong className="text-gambas-text">{totalPoints}</strong>
              </p>
            )}
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="text-left">
                <p className="text-xs text-gambas-muted mb-1">Objetivo</p>
                <div
                  className="w-20 h-20 rounded-xl border border-gambas-border"
                  style={{ backgroundColor: rgbToCss(targetColor) }}
                />
              </div>
              <div className="text-left">
                <p className="text-xs text-gambas-muted mb-1">{copy.colorGamePreview}</p>
                <div
                  className="w-20 h-20 rounded-xl border border-gambas-border"
                  style={{ backgroundColor: rgbToCss(guessColor) }}
                />
              </div>
            </div>
            <p className="text-xs text-gambas-muted animate-pulse">
              Siguiente color en breve…
            </p>
          </div>
        )}
      </div>

      {localMode && (
        <p className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
          {copy.colorGameLocalOnly}
        </p>
      )}

      <section className="rounded-2xl border border-gambas-border/40 bg-gambas-card/40 overflow-hidden">
        <h2 className="text-lg font-bold px-4 py-3 border-b border-gambas-border/30">
          {copy.colorGameLeaderboard}
        </h2>
        {leaderboard.length === 0 ? (
          <p className="p-6 text-sm text-gambas-muted text-center">
            {copy.colorGameEmptyLb}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gambas-muted border-b border-gambas-border/30">
                  <th className="px-4 py-2 w-12">{copy.colorGameRank}</th>
                  <th className="px-4 py-2">{copy.colorGamePlayer}</th>
                  <th className="px-4 py-2 text-right">{copy.colorGameScore}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr
                    key={row.userId}
                    className={cn(
                      "border-b border-gambas-border/20 last:border-0",
                      user?.id === row.userId && "bg-gambas-accent/10"
                    )}
                  >
                    <td className="px-4 py-3 tabular-nums text-gambas-muted">
                      {row.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/profile/${row.username}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <Avatar
                          username={row.username}
                          displayName={row.displayName}
                          avatarUrl={row.avatarUrl}
                          size="sm"
                          linkToProfile={false}
                        />
                        <span>
                          <span className="font-medium block leading-tight">
                            {row.displayName}
                          </span>
                          <span className="text-xs text-gambas-muted">
                            @{row.username}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gambas-accent tabular-nums">
                      {row.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
