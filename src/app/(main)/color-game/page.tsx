"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ColorMemoryGame } from "@/components/color-game/ColorMemoryGame";
import { TriviaQuizGame } from "@/components/trivia/TriviaQuizGame";
import { copy } from "@/lib/gambas-copy";

export default function ColorGamePage() {
  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3 flex items-center gap-3">
        <Link
          href="/feed"
          className="p-1.5 rounded-full hover:bg-gambas-card transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold truncate">{copy.colorGameTitle}</h1>
      </header>
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <ColorMemoryGame />
        <TriviaQuizGame />
      </div>
    </div>
  );
}
