"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Bell,
  LogOut,
  PenSquare,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/gambas-copy";

const navItems = [
  { href: "/feed", label: copy.inicio, icon: Home },
  { href: "/profile", label: "Perfil", icon: User, dynamic: true },
  { href: "/notifications", label: copy.notifications, icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-0 h-screen py-4 px-3">
      <Logo size="md" className="px-3 mb-6" />

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const href =
            item.dynamic === true
              ? `/profile/${user.username}`
              : item.href;
          const active =
            pathname === href ||
            (item.href === "/feed" && pathname.startsWith("/feed")) ||
            (item.dynamic && pathname.startsWith("/profile"));

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-medium",
                "transition-all duration-200",
                active
                  ? "bg-gambas-card text-gambas-text shadow-card"
                  : "text-gambas-muted hover:bg-gambas-card/50 hover:text-gambas-text"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 mt-4">
        <Link href="/feed?compose=1">
          <Button fullWidth className="gap-2">
            <PenSquare className="w-4 h-4" />
            {copy.nuevaGamba}
          </Button>
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-gambas-muted hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-[15px] font-medium"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>

        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gambas-card/50 transition-colors"
        >
          <Avatar
            username={user.username}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            size="sm"
            linkToProfile={false}
          />
          <div className="min-w-0 text-left">
            <p className="font-semibold text-sm truncate">{user.displayName}</p>
            <p className="text-gambas-muted text-xs truncate">
              @{user.username}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
