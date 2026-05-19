"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatUsername } from "@/lib/utils";
import { toggleFollow, isFollowing } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";

interface ProfileHeaderProps {
  profile: User;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth();
  const [followersCount, setFollowersCount] = useState(profile.followersCount);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user?.id === profile.id;

  useEffect(() => {
    async function loadFollow() {
      if (!user || isOwnProfile) return;
      const f = await isFollowing(user.id, profile.id);
      setFollowing(f);
    }
    void loadFollow();
  }, [user, profile.id, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || isOwnProfile) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollow(user.id, profile.id);
      if (result) {
        setFollowing(result.following);
        setFollowersCount(result.followersCount);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="border-b border-gambas-border/40">
      <div className="h-32 bg-gradient-to-br from-gambas-accent/20 via-gambas-accent2/10 to-transparent" />
      <div className="px-4 pb-4 -mt-12">
        <div className="flex items-end justify-between">
          <Avatar
            username={profile.username}
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            size="xl"
            linkToProfile={false}
            className="ring-4 ring-gambas-bg"
          />
          {!isOwnProfile && user && (
            <Button
              variant={following ? "secondary" : "primary"}
              size="sm"
              onClick={() => void handleFollow()}
              disabled={followLoading}
            >
              {followLoading
                ? "..."
                : following
                  ? "Siguiendo"
                  : "Seguir"}
            </Button>
          )}
        </div>
        <div className="mt-3">
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
          <p className="text-gambas-muted">{formatUsername(profile.username)}</p>
          {profile.bio && (
            <p className="mt-2 text-gambas-text text-[15px] leading-relaxed">
              {profile.bio}
            </p>
          )}
          <div className="flex gap-4 mt-3 text-sm">
            <span>
              <strong className="text-gambas-text">
                {profile.followingCount}
              </strong>{" "}
              <span className="text-gambas-muted">siguiendo</span>
            </span>
            <span>
              <strong className="text-gambas-text">{followersCount}</strong>{" "}
              <span className="text-gambas-muted">seguidores</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
