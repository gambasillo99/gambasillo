import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/gambas-copy";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: 32, text: "text-lg" },
  md: { img: 40, text: "text-xl" },
  lg: { img: 56, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <Link
      href="/feed"
      className={cn(
        "inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt={copy.appName}
        width={s.img}
        height={s.img}
        className="rounded-xl object-contain group-hover:scale-105 transition-transform duration-200"
        priority
      />
      {showText && (
        <span className={cn(s.text, "font-bold tracking-tight text-gradient")}>
          {copy.appName}
        </span>
      )}
    </Link>
  );
}
