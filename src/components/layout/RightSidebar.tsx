"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { getActiveMembers } from "@/lib/data/store";
import type { User } from "@/types";
import { formatUsername } from "@/lib/utils";

export function RightSidebar() {
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    async function load() {
      const users = await getActiveMembers();
      setMembers(users);
    }
    void load();
  }, []);

  return (
    <aside className="hidden xl:block w-80 shrink-0 sticky top-0 h-screen py-4 px-4 space-y-4">
      <div className="rounded-2xl bg-gambas-card/50 border border-gambas-border/30 p-4 shadow-card">
        <h3 className="font-bold text-sm mb-1">🦐 Club Gambasillo</h3>
        <p className="text-gambas-muted text-sm leading-relaxed">
          Red privada para amigos. Sin algoritmos, sin anuncios, solo buena vibra
          underground.
        </p>
      </div>

      <div className="rounded-2xl bg-gambas-card/50 border border-gambas-border/30 p-4 shadow-card">
        <h3 className="font-bold text-sm mb-3">Miembros activos</h3>
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.id}>
              <Link
                href={`/profile/${member.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar
                  username={member.username}
                  displayName={member.displayName}
                  avatarUrl={member.avatarUrl}
                  size="sm"
                  linkToProfile={false}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-gambas-accent transition-colors">
                    {member.displayName}
                  </p>
                  <p className="text-gambas-muted text-xs truncate">
                    {formatUsername(member.username)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-gambas-accent/10 to-gambas-accent2/10 border border-gambas-border/20 p-4">
        <p className="text-xs text-gambas-muted leading-relaxed">
          <span className="text-gambas-accent font-semibold">Tip:</span> Usuarios
          demo: @marina, @pixel, @nexus — contraseña:{" "}
          <code className="text-gambas-shrimp">gambas123</code>
        </p>
      </div>
    </aside>
  );
}
