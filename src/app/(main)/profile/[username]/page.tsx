"use client";

import { use, useEffect, useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostFeed } from "@/components/posts/PostFeed";
import { getUserByUsername } from "@/lib/data/store";
import type { User } from "@/types";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = Boolean(currentUser && profile && currentUser.id === profile.id);

  useEffect(() => {
    async function load() {
      const u = await getUserByUsername(username);
      setProfile(u);
      setLoading(false);
    }
    void load();
  }, [username]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gambas-muted animate-pulse-soft">
        Cargando perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-gambas-muted">Gambero no encontrado</p>
        <Link
          href="/feed"
          className="text-gambas-accent text-sm mt-2 inline-block hover:underline"
        >
          Volver al gambasillín
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gambas-bg/80 border-b border-gambas-border/40 px-4 py-3 flex items-center gap-3">
        <Link
          href="/feed"
          className="p-1.5 rounded-full hover:bg-gambas-card transition-colors lg:hidden shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate">
            {profile.displayName}
          </h1>
          <p className="text-gambas-muted text-xs truncate">@{profile.username}</p>
        </div>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => void logout()}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 border border-red-400/30 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="sm:hidden">Salir</span>
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        )}
      </header>
      <ProfileHeader
        profile={profile}
        onProfileUpdate={(u) => setProfile(u)}
      />
      <PostFeed
        userId={profile.id}
        showComposer={currentUser?.id === profile.id}
      />
    </div>
  );
}
