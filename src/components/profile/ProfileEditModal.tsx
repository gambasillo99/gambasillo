"use client";

import { useState } from "react";
import type { User, ProfileLink } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/lib/data/store";
import { copy } from "@/lib/gambas-copy";
import { apiClient } from "@/lib/api/client";
import { isRemoteBackend } from "@/lib/config";
import { compressImageFile } from "@/lib/compress-media";
import { X, Plus, Trash2 } from "lucide-react";

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}

export function ProfileEditModal({
  user,
  onClose,
  onSaved,
}: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl);
  const [links, setLinks] = useState<ProfileLink[]>(user.links ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  async function uploadImage(file: File, kind: "avatar" | "banner") {
    setUploading(kind);
    try {
      const compressed = await compressImageFile(file);
      if (isRemoteBackend()) {
        const res = await apiClient.upload(compressed, "image");
        if (kind === "avatar") setAvatarUrl(res.url);
        else setBannerUrl(res.url);
      } else {
        const url = URL.createObjectURL(compressed);
        if (kind === "avatar") setAvatarUrl(url);
        else setBannerUrl(url);
      }
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, {
        displayName,
        bio,
        avatarUrl,
        bannerUrl,
        links: links.filter((l) => l.url.trim()),
      });
      if (updated) onSaved(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-gambas-card border border-gambas-border shadow-card p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <ModalHeader onClose={onClose} />

        <div className="space-y-4">
          <label className="block text-sm text-gambas-muted">
            Banner
            <input
              type="file"
              accept="image/*"
              disabled={uploading === "banner"}
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f, "banner");
              }}
            />
          </label>
          <label className="block text-sm text-gambas-muted">
            Avatar
            <input
              type="file"
              accept="image/*"
              disabled={uploading === "avatar"}
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f, "avatar");
              }}
            />
          </label>
          <Input
            label="Nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <div>
            <span className="text-sm font-medium text-gambas-muted mb-1 block">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-gambas-surface border border-gambas-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gambas-accent/40"
            />
          </div>
          <LinksEditor links={links} setLinks={setLinks} />
        </div>

        <Button fullWidth onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Guardando..." : "Guardar perfil"}
        </Button>
      </div>
    </div>
  );
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{copy.editProfile}</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-full hover:bg-gambas-surface"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function LinksEditor({
  links,
  setLinks,
}: {
  links: ProfileLink[];
  setLinks: (l: ProfileLink[]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gambas-muted">Links</span>
        <button
          type="button"
          onClick={() => setLinks([...links, { label: "", url: "" }])}
          className="text-gambas-accent text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 mb-2 items-start">
          <Input
            placeholder="Etiqueta"
            value={link.label}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], label: e.target.value };
              setLinks(next);
            }}
          />
          <Input
            placeholder="https://..."
            value={link.url}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], url: e.target.value };
              setLinks(next);
            }}
          />
          <button
            type="button"
            onClick={() => setLinks(links.filter((_, j) => j !== i))}
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

