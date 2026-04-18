"use client";

import { Share2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "@/lib/hooks";
import { useToast } from "@/app/context/ToastContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { TrackDto } from "@/app/types/track";
import api from "@/lib/axios";

interface Props {
  track: TrackDto;
  size?: number;
}

function getPrimaryArtistId(track: TrackDto): number | null {
  const primary = track.artists?.find((a) => a.role === "primary");
  return primary?.artistId ?? track.artists?.[0]?.artistId ?? null;
}

export function ShareButton({ track, size = 14 }: Props) {
  const t          = useTranslations("Store");
  const { locale } = useParams<{ locale: string }>();
  const { isDark } = useTheme();
  const toast      = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const url = `${window.location.origin}/${locale}/home/tracks/${track.id}`;

    // Record share_track engagement action
    const artistId = getPrimaryArtistId(track);
    if (artistId) {
      api.post(API_ENDPOINTS.engagementActions.record, {
        actionType: "share_track",
        artistId,
        trackId: track.id,
      }).catch(() => {});
    }

    // Try native share API, fall back to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `${track.title} — ${track.artists.map((a) => a.displayName).join(", ")}`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("shareFailed"));
    }
  };

  return (
    <button
      title={t("shareTrack")}
      onClick={handleShare}
      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-sm transition-colors ${isDark ? "hover:bg-royalblue/20 text-vhs-muted hover:text-vhs-white" : "hover:bg-[#c4234e]/10 text-[#635b53] hover:text-[#2a2520]"}`}
    >
      <Share2 size={size} />
    </button>
  );
}
