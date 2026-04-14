"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, Pencil, Play, Plus, Trash2 } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { TrackDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function TracksContent() {
  const t           = useTranslations("Artist");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useTheme();
  const { session } = useAuth();
  const userId      = session?.user?.id ?? null;

  const [tracks, setTracks]   = useState<TrackDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!userId) { setLoading(false); return; }
    api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?artistId=${userId}&limit=100`)
      .then(({ data }) => setTracks(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  const remove = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(API_ENDPOINTS.tracks.detail(id));
      setTracks((prev) => prev.filter((tr) => tr.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Cannot delete track");
    }
  };

  const mutedCls = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls  = isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#a89888]/30 bg-white/70";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <SectionLabel className="mb-1">{t("myTracks")}</SectionLabel>
            <h1 className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>
              {t("tracks")}
            </h1>
          </div>
          <Link
            href={`/${locale}/artist/tracks/new`}
            className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-bold tracking-[2px] no-underline transition-all ${
              isDark
                ? "border-fear/40 bg-fear/10 text-fear hover:bg-fear/20"
                : "border-[#c4234e]/40 bg-[#c4234e]/5 text-[#c4234e] hover:bg-[#c4234e]/10"
            }`}
          >
            <Plus size={12} /> {t("uploadTrack")}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <VHSSpinner />
          </div>
        ) : tracks.length === 0 ? (
          <div className={`rounded border p-10 text-center ${cardCls}`}>
            <Play size={32} className={`mx-auto mb-3 opacity-30 ${mutedCls}`} />
            <div className={`text-xs tracking-widest ${mutedCls}`}>{t("noRecentTracks")}</div>
            <Link
              href={`/${locale}/artist/tracks/new`}
              className={`mt-4 inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-bold tracking-widest no-underline ${
                isDark ? "border-royalblue/30 text-vhs-light hover:border-fear/40" : "border-[#a89888] text-[#524a44]"
              }`}
            >
              <Plus size={11} /> {t("uploadTrack")}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <div key={track.id} className={`flex items-center gap-4 rounded border px-4 py-3 ${cardCls}`}>
                {/* Cover */}
                {track.coverImageUrl ? (
                  <img src={track.coverImageUrl} alt={track.title} className="h-9 w-9 shrink-0 rounded object-cover" />
                ) : (
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/30 bg-[#f5f0e8]"}`}>
                    <Play size={11} className={mutedCls} />
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                    {track.title}
                  </div>
                  <div className={`text-xs tracking-wide ${mutedCls}`}>
                    {track.genres.map((g) => g.name).join(" · ")}
                  </div>
                </div>

                {/* Duration */}
                <div className={`flex shrink-0 items-center gap-1 text-xs tabular-nums ${mutedCls}`}>
                  <Clock size={9} />{formatDuration(track.durationSeconds)}
                </div>

                {/* Price */}
                {track.price != null && (
                  <div className={`shrink-0 text-xs font-bold ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                    {track.price === 0 ? "FREE" : `${track.price} CZK`}
                  </div>
                )}

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/${locale}/artist/tracks/${track.id}/edit`}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-opacity hover:opacity-70 ${
                      isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#a89888]/40 text-[#635b53]"
                    }`}
                  >
                    <Pencil size={12} />
                  </Link>
                  <button
                    onClick={() => void remove(track.id, track.title)}
                    className={`hover:border-fear/40 hover:text-fear flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border transition-all ${
                      isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#a89888]/40 text-[#635b53]"
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ArtistTracksPage() {
  return (
    <PageShell>
      <TracksContent />
    </PageShell>
  );
}
