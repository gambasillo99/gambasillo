"use client";

import { useRef, useState } from "react";
import { Image, Video, Mic, X, Loader2 } from "lucide-react";
import type { MediaItem } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/context";
import { generateId } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { MediaPreview } from "./MediaPreview";
import { copy } from "@/lib/gambas-copy";

interface PostComposerProps {
  onPost: (content: string, media: MediaItem[]) => void | Promise<void>;
  autoFocus?: boolean;
}

const hasCloudinaryUpload =
  typeof window !== "undefined" &&
  Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

export function PostComposer({ onPost, autoFocus }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(
    null
  );

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && media.length === 0) return;
    setPosting(true);
    try {
      await onPost(trimmed, media);
      setContent("");
      setMedia([]);
    } finally {
      setPosting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !mediaType) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (hasCloudinaryUpload) {
          const uploaded = await apiClient.upload(file, mediaType);
          setMedia((prev) => [
            ...prev,
            {
              id: uploaded.id || generateId(),
              type: mediaType,
              url: uploaded.url,
            },
          ]);
        } else {
          const url = URL.createObjectURL(file);
          setMedia((prev) => [
            ...prev,
            { id: generateId(), type: mediaType, url },
          ]);
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
      setMediaType(null);
    }
  };

  const openFilePicker = (type: "image" | "video" | "audio") => {
    setMediaType(type);
    fileInputRef.current?.click();
  };

  const canPost =
    (content.trim().length > 0 || media.length > 0) && !posting && !uploading;

  return (
    <div className="p-4 border-b border-gambas-border/40">
      <div className="flex gap-3">
        <Avatar
          username={user.username}
          displayName={user.displayName}
          avatarUrl={user.avatarUrl}
          linkToProfile={false}
        />
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={copy.composePlaceholder}
            autoFocus={autoFocus}
            rows={3}
            className="w-full bg-transparent text-gambas-text placeholder:text-gambas-muted/60 resize-none focus:outline-none text-[15px] leading-relaxed"
          />

          {media.length > 0 && (
            <div className="relative">
              <MediaPreview media={media} />
              <button
                type="button"
                onClick={() => setMedia([])}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Quitar multimedia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={
              mediaType === "image"
                ? "image/*"
                : mediaType === "video"
                  ? "video/*"
                  : "audio/*"
            }
            multiple={mediaType === "image"}
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex items-center justify-between pt-1 border-t border-gambas-border/30">
            <div className="flex gap-1 items-center">
              <MediaButton
                icon={Image}
                label="Imagen"
                disabled={uploading}
                onClick={() => openFilePicker("image")}
              />
              <MediaButton
                icon={Video}
                label="Vídeo"
                disabled={uploading}
                onClick={() => openFilePicker("video")}
              />
              <MediaButton
                icon={Mic}
                label="Audio"
                disabled={uploading}
                onClick={() => openFilePicker("audio")}
              />
              {uploading && (
                <Loader2 className="w-4 h-4 text-gambas-accent animate-spin ml-1" />
              )}
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={!canPost}>
              {posting ? copy.gambearing : copy.gambear}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-full text-gambas-accent hover:bg-gambas-accent/10 transition-colors disabled:opacity-40"
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
