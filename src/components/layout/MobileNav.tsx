"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Bell, PenSquare, Palette } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/gambas-copy";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const items = [
    { href: "/feed", icon: Home, label: copy.inicio },
    { href: "/color-game", icon: Palette, label: copy.colorGameNav },
    { href: "/notifications", icon: Bell, label: "Alertas" },
    { href: "/feed?compose=1", icon: PenSquare, label: copy.gambear, accent: true },
    { href: `/profile/${user.username}`, icon: User, label: "Perfil" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gambas-border/50 bg-gambas-bg/95 backdrop-blur-xl safe-area-pb">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/feed" && pathname.startsWith("/feed")) ||
            (item.href === "/color-game" && pathname.startsWith("/color-game")) ||
            (item.label === "Perfil" && pathname.startsWith("/profile"));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 p-2 rounded-xl min-w-[60px]",
                "transition-colors duration-200",
                item.accent &&
                  "bg-gradient-to-br from-gambas-accent to-gambas-accent2 text-white -mt-4 shadow-glow rounded-2xl px-4 py-3",
                !item.accent &&
                  (active
                    ? "text-gambas-accent"
                    : "text-gambas-muted hover:text-gambas-text")
              )}
            >
              <item.icon className={cn("w-5 h-5", item.accent && "w-6 h-6")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
