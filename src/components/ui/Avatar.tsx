import Link from "next/link";
import { cn } from "@/lib/utils";

interface AvatarProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  linkToProfile?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const colors = [
  "from-gambas-accent to-orange-600",
  "from-gambas-accent2 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

function getColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  username,
  displayName,
  avatarUrl,
  size = "md",
  linkToProfile = true,
  className,
}: AvatarProps) {
  const initial = (displayName || username).charAt(0).toUpperCase();
  const gradient = getColor(username);

  const inner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={displayName || username}
      className={cn("rounded-full object-cover", sizeClasses[size], className)}
    />
  ) : (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white",
        "bg-gradient-to-br shadow-card",
        gradient,
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/profile/${username}`}
        className="shrink-0 hover:opacity-90 transition-opacity"
      >
        {inner}
      </Link>
    );
  }

  return <div className="shrink-0">{inner}</div>;
}
