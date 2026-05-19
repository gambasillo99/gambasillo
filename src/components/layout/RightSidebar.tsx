"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { getActiveMembers } from "@/lib/data/store";
import type { User } from "@/types";
import { formatUsername } from "@/lib/utils";
import { copy } from "@/lib/gambas-copy";

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
        <h3 className="font-bold text-sm mb-1">{copy.clubTitle}</h3>
        <p className="text-gambas-muted text-sm leading-relaxed">{copy.clubDesc}</p>
      </div>

      <div className="rounded-2xl bg-gambas-card/50 border border-gambas-border/30 p-4 shadow-card">
        <h3 className="font-bold text-sm mb-3">{copy.activeMembers}</h3>
        {members.length === 0 ? (
          <p className="text-gambas-muted text-sm">
            Aún no hay gamberos en el club. ¡Regístrate y sé el primero!
          </p>
        ) : (
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
                    lastSeenAt={member.lastSeenAt}
                    showOnline
                    size="sm"
                    linkToProfile={false}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-gambas-accent transition-colors">
                      {member.displayName}
                    </p>
                    <p className="text-gambas-muted text-xs truncate">
                      {formatUsername(member.username)}{" "}
                      <span className="text-emerald-500">
                        · {copy.online}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
