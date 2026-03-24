"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { ArtistPicker, type ArtistInput } from "@/app/components/artist/ArtistPicker";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { parseAxiosError } from "@/lib/axios";
import type { TrackDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function NewAlbumContent() {
  const t              = useTranslations("Artist");
  const { locale }     = useParams<{ locale: string }>();
  const { isDark }     = useStoreTheme();
  const { session }    = useAuth();
  const router         = useRouter();

  const [myTracks, setMyTracks] = useState<TrackDto[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    title:         "",
    releaseDate:   "",
    coverImageUrl: "",
    price:         "",
  });
  const [trackIds, setTrackIds] = useState<number[]>([]);
  const [artists, setArtists]   = useState<ArtistInput[]>([]);

  // Pre-fill primary artist
  useEffect(() => {
    if (session?.user) {
      setArtists([{
        artistId:    session.user.id,
        displayName: session.user.displayName,
        role:        "primary",
      }]);
    }
  }, [session?.user?.id]);

  // Load own tracks for selection
  useEffect(() => {
    if (!session?.user?.id) return;
    api.get<PaginatedResponse<TrackDto>>(
      `${API_ENDPOINTS.tracks.list}?artistId=${session.user.id}&limit=100`,
    )
      .then(({ data }) => setMyTracks(data.data))
      .catch(console.error);
  }, [session?.user?.id]);

  const toggleTrack = (id: number) => {
    setTrackIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.albums.list, {
        title:         form.title.trim(),
        releaseDate:   form.releaseDate,
        coverImageUrl: form.coverImageUrl.trim(),
        price:         Number(form.price),
        artists:       artists.map(({ artistId, role }) => ({ artistId, role })),
        trackIds:      trackIds.length > 0 ? trackIds : undefined,
      });
      router.push(`/${locale}/artist`);
    } catch (err) {
      setError(parseAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-sm border px-3 py-2.5 outline-none text-[11px] tracking-wider transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-[9px] tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/${locale}/artist`}
          className={`mb-6 inline-flex items-center gap-1.5 text-[10px] tracking-[2px] no-underline ${
            isDark ? "text-vhs-muted hover:text-fear" : "text-[#8a8578] hover:text-[#c4234e]"
          }`}
        >
          <ArrowLeft size={12} /> {t("backToDashboard")}
        </Link>

        <div
          className={`rounded border p-6 sm:p-8 ${
            isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/80"
          }`}
        >
          <SectionLabel className="mb-6">{t("newAlbum")}</SectionLabel>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            {/* Title */}
            <div>
              <label className={labelCls}>{t("albumTitle")} *</label>
              <input
                required
                type="text"
                className={inputCls}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Release date + Price row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("releaseDateLabel")} *</label>
                <input
                  required
                  type="date"
                  className={inputCls}
                  value={form.releaseDate}
                  onChange={(e) => setForm((p) => ({ ...p, releaseDate: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>{t("priceLabel")} *</label>
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputCls}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
            </div>

            {/* Cover image URL */}
            <div>
              <label className={labelCls}>{t("coverImageUrl")} *</label>
              <input
                required
                type="url"
                className={inputCls}
                placeholder="https://"
                value={form.coverImageUrl}
                onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
              />
            </div>

            {/* Collaborating artists */}
            <div>
              <label className={labelCls}>{t("collaboratingArtists")}</label>
              <ArtistPicker
                value={artists}
                onChange={setArtists}
                featRole="collaborator"
                isDark={isDark}
              />
            </div>

            {/* Track selection */}
            {myTracks.length > 0 && (
              <div>
                <label className={labelCls}>{t("tracksOptional")}</label>
                <div className="max-h-56 space-y-1 overflow-y-auto">
                  {myTracks.map((track) => {
                    const selected = trackIds.includes(track.id);
                    return (
                      <label
                        key={track.id}
                        className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2 transition-colors ${
                          selected
                            ? isDark ? "border-fear/40 bg-fear/10" : "border-[#c4234e]/30 bg-[#c4234e]/5"
                            : isDark ? "border-royalblue/20 hover:border-royalblue/40" : "border-[#c4b8a8]/30 hover:border-[#c4b8a8]/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 cursor-pointer accent-current"
                          checked={selected}
                          onChange={() => toggleTrack(track.id)}
                        />
                        <span className={`text-[11px] tracking-wide ${isDark ? "text-vhs-light" : "text-[#4a4540]"}`}>
                          {track.title}
                        </span>
                        <span className={`ml-auto text-[9px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
                          {track.artists.map((a) => a.displayName).join(", ")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded border border-red-400/30 bg-red-400/10 p-2 text-[10px] tracking-wide text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href={`/${locale}/artist`}
                className={`flex-1 rounded-sm border py-2.5 text-center text-[11px] font-bold tracking-[2px] transition-all ${
                  isDark
                    ? "border-royalblue/30 text-vhs-muted hover:text-vhs-white"
                    : "border-[#c4b8a8] text-[#8a8578] hover:text-[#2a2520]"
                }`}
              >
                {t("cancel")}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 rounded-sm py-2.5 text-[11px] font-bold tracking-[2px] text-white transition-all hover:brightness-110 disabled:opacity-50 ${
                  isDark ? "bg-fear" : "bg-[#c4234e]"
                }`}
              >
                {saving ? t("creating") : t("createAlbumBtn")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default function NewAlbumPage() {
  return (
    <PageShell>
      <NewAlbumContent />
    </PageShell>
  );
}
