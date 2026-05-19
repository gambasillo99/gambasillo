"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ProfileEditModal } from "./ProfileEditModal";
import { formatUsername } from "@/lib/utils";
import { toggleFollow, isFollowing } from "@/lib/data/store";
import { useAuth } from "@/lib/auth/context";
import { copy } from "@/lib/gambas-copy";
import { ExternalLink } from "lucide-react";

interface ProfileHeaderProps {
  profile: User;
  onProfileUpdate?: (user: User) => void;
}

export function ProfileHeader({ profile, onProfileUpdate }: ProfileHeaderProps) {
  const { user, refreshUser } = useAuth();
  const [localProfile, setLocalProfile] = useState(profile);
  const [followersCount, setFollowersCount] = useState(profile.followersCount);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const isOwnProfile = user?.id === localProfile.id;

  useEffect(() => {
    setLocalProfile(profile);
    setFollowersCount(profile.followersCount);
  }, [profile]);

  useEffect(() => {
    async function loadFollow() {
      if (!user || isOwnProfile) return;
      const f = await isFollowing(user.id, localProfile.id);
      setFollowing(f);
    }
    void loadFollow();
  }, [user, localProfile.id, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || isOwnProfile) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollow(user.id, localProfile.id);
      if (result) {
        setFollowing(result.following);
        setFollowersCount(result.followersCount);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const bannerStyle = localProfile.bannerUrl
    ? {
        backgroundImage: `url(${localProfile.bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className="border-b border-gambas-border/40">
      <div
        className="h-36 bg-gradient-to-br from-gambas-accent/25 via-gambas-accent2/15 to-gambas-bg"
        style={bannerStyle}
      />
      <div className="px-4 pb-4 -mt-14">
        <div className="flex items-end justify-between gap-3">
          <Avatar
            username={localProfile.username}
            displayName={localProfile.displayName}
            avatarUrl={localProfile.avatarUrl}
            lastSeenAt={localProfile.lastSeenAt}
            showOnline
            size="xl"
            linkToProfile={false}
            className="ring-4 ring-gambas-bg"
          />
          <div className="flex gap-2">
            {isOwnProfile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
              >
                {copy.editProfile}
              </Button>
            )}
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
                    ? copy.followingBtn
                    : copy.follow}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <h1 className="text-xl font-bold">{localProfile.displayName}</h1>
          <p className="text-gambas-muted">{formatUsername(localProfile.username)}</p>
          {localProfile.bio && (
            <p className="mt-2 text-gambas-text text-[15px] leading-relaxed">
              {localProfile.bio}
            </p>
          )}
          {localProfile.links?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {localProfile.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gambas-accent hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {link.label || link.url}
                </a>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-3 text-sm">
            <span>
              <strong className="text-gambas-text">
                {localProfile.followingCount}
              </strong>{" "}
              <span className="text-gambas-muted">{copy.following}</span>
            </span>
            <span>
              <strong className="text-gambas-text">{followersCount}</strong>{" "}
              <span className="text-gambas-muted">{copy.followers}</span>
            </span>
          </div>
        </div>
      </div>

      {editing && user && (
        <ProfileEditModal
          user={localProfile}
          onClose={() => setEditing(false)}
          onSaved={(u) => {
            setLocalProfile(u);
            onProfileUpdate?.(u);
            void refreshUser();
          }}
        />
      )}
    </div>
  );
}
