import Link from "next/link";
import { cn } from "@/lib/utils";
import { isUserOnline } from "@/lib/presence";

interface AvatarProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  linkToProfile?: boolean;
  className?: string;
  lastSeenAt?: string | null;
  showOnline?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const dotSizes = {
  xs: "w-2 h-2 border",
  sm: "w-2.5 h-2.5 border-2",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
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
  lastSeenAt,
  showOnline = false,
}: AvatarProps) {
  const initial = (displayName || username).charAt(0).toUpperCase();
  const gradient = getColor(username);
  const online = showOnline && isUserOnline(lastSeenAt);

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
        "rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br shadow-card",
        gradient,
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  );

  const wrapped = (
    <span className="relative inline-block shrink-0">
      {inner}
      {showOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-gambas-bg",
            dotSizes[size],
            online ? "bg-emerald-500" : "bg-zinc-500"
          )}
          title={online ? "online" : "offline"}
        />
      )}
    </span>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/profile/${username}`}
        className="hover:opacity-90 transition-opacity"
      >
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}
