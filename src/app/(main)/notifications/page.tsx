"use client";

import { Bell } from "lucide-react";

const placeholderNotifications = [
  {
    id: "1",
    text: "@pixel le dio like a tu post",
    time: "hace 5 min",
  },
  {
    id: "2",
    text: "@nexus te siguió",
    time: "hace 1 h",
  },
  {
    id: "3",
    text: "@marina comentó en tu post",
    time: "hace 3 h",
  },
];

export default function NotificationsPage() {
  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3">
        <h1 className="text-lg font-bold">Notificaciones</h1>
      </header>
      <div className="divide-y divide-gambas-border/30">
        {placeholderNotifications.map((n) => (
          <div
            key={n.id}
            className="flex gap-3 p-4 card-hover animate-slide-up"
          >
            <div className="w-10 h-10 rounded-full bg-gambas-accent/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-gambas-accent" />
            </div>
            <div>
              <p className="text-sm text-gambas-text">{n.text}</p>
              <p className="text-xs text-gambas-muted mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-gambas-muted text-xs py-6 px-4">
        Notificaciones en tiempo real cuando conectes Supabase
      </p>
    </div>
  );
}
