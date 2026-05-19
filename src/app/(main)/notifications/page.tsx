"use client";

import { Bell } from "lucide-react";
import { copy } from "@/lib/gambas-copy";

export default function NotificationsPage() {
  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3">
        <h1 className="text-lg font-bold">{copy.notifications}</h1>
      </header>
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-gambas-accent/20 flex items-center justify-center mb-4">
          <Bell className="w-7 h-7 text-gambas-accent" />
        </div>
        <p className="text-gambas-text font-medium">Sin gambalertas por ahora</p>
        <p className="text-gambas-muted text-sm mt-2 max-w-xs">
          Cuando alguien te dé una gambita, regambe tu gamba o te siga la corriente,
          lo verás aquí.
        </p>
      </div>
    </div>
  );
}
