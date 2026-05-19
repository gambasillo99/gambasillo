import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "text-xl", text: "text-lg" },
  md: { icon: "text-2xl", text: "text-xl" },
  lg: { icon: "text-3xl", text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <Link
      href="/feed"
      className={cn(
        "inline-flex items-center gap-2 group transition-opacity hover:opacity-90",
        className
      )}
    >
      <span
        className={cn(
          s.icon,
          "flex items-center justify-center w-9 h-9 rounded-xl",
          "bg-gradient-to-br from-gambas-accent to-gambas-accent2",
          "shadow-glow group-hover:scale-105 transition-transform duration-200"
        )}
        aria-hidden
      >
        🦐
      </span>
      {showText && (
        <span className={cn(s.text, "font-bold tracking-tight text-gradient")}>
          Gambasillo
        </span>
      )}
    </Link>
  );
}
