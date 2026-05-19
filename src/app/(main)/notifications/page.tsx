"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar } from "@/components/ui/Avatar";
import { copy } from "@/lib/gambas-copy";
import { REACTION_EMOJIS } from "@/types";
import type { Notification } from "@/types";

function notifText(n: Notification): string {
  const name = n.actor?.displayName ?? "Alguien";
  switch (n.type) {
    case "follow":
      return `${name} ${copy.notifFollow}`;
    case "like":
      return `${name} ${copy.notifLike}`;
    case "comment":
      return `${name} ${copy.notifComment}`;
    case "reaction": {
      const emoji =
        REACTION_EMOJIS.find((e) => e.key === n.emoji)?.char ?? "✨";
      return `${name} ${copy.notifReaction} ${emoji}`;
    }
    case "mention":
      return `${name} te mencionó en una gamba`;
    default:
      return `${name} interactuó contigo`;
  }
}

function NotifRow({ n }: { n: Notification }) {
  const href = n.postId
    ? `/post/${n.postId}`
    : `/profile/${n.actor?.username ?? ""}`;
  const timeAgo = formatDistanceToNow(new Date(n.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Link
      href={href}
      className={`flex gap-3 p-4 card-hover ${!n.readAt ? "bg-gambas-accent/5" : ""}`}
    >
      {n.actor ? (
        <Avatar
          username={n.actor.username}
          displayName={n.actor.displayName}
          avatarUrl={n.actor.avatarUrl}
          size="md"
          linkToProfile={false}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gambas-accent/20 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-gambas-accent" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gambas-text">{notifText(n)}</p>
        <p className="text-xs text-gambas-muted mt-0.5">{timeAgo}</p>
      </div>
    </Link>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, loading, markAllRead } = useNotifications(user?.id);

  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">{copy.notifications}</h1>
        {notifications.some((n) => !n.readAt) && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-sm text-gambas-accent hover:underline"
          >
            Marcar leídas
          </button>
        )}
      </header>

      {loading && (
        <p className="text-center text-gambas-muted py-12 animate-pulse-soft">
          Cargando gambalertas...
        </p>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-gambas-accent/20 flex items-center justify-center">
            <Bell className="w-7 h-7 text-gambas-accent" />
          </div>
          <p className="text-gambas-text font-medium mt-4">
            {copy.notificationsEmpty}
          </p>
          <p className="text-gambas-muted text-sm mt-2 max-w-xs">
            {copy.notificationsHint}
          </p>
        </div>
      )}

      <ul className="divide-y divide-gambas-border/30">
        {notifications.map((n) => (
          <li key={n.id}>
            <NotifRow n={n} />
          </li>
        ))}
      </ul>
    </div>
  );
}
