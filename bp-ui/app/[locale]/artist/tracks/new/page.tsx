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
import type { GenreDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function NewTrackContent() {
  const t              = useTranslations("Artist");
  const { locale }     = useParams<{ locale: string }>();
  const { isDark }     = useStoreTheme();
  const { session }    = useAuth();
  const router         = useRouter();

  const [genres, setGenres]     = useState<GenreDto[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    title:           "",
    audioUrl:        "",
    durationSeconds: "",
    bpm:             "",
    price:           "",
    coverImageUrl:   "",
  });
  const [genreIds, setGenreIds]   = useState<number[]>([]);
  const [artists, setArtists]     = useState<ArtistInput[]>([]);

  // Pre-fill primary artist from session
  useEffect(() => {
    if (session?.user) {
      setArtists([{
        artistId:    session.user.id,
        displayName: session.user.displayName,
        role:        "primary",
      }]);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    api.get<PaginatedResponse<GenreDto>>(`${API_ENDPOINTS.genres.list}?limit=100`)
      .then(({ data }) => setGenres(data.data))
      .catch(console.error);
  }, []);

  const toggleGenre = (id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.tracks.list, {
        title:           form.title.trim(),
        audioUrl:        form.audioUrl.trim(),
        durationSeconds: Number(form.durationSeconds),
        bpm:             form.bpm ? Number(form.bpm) : undefined,
        price:           form.price ? Number(form.price) : undefined,
        coverImageUrl:   form.coverImageUrl.trim() || undefined,
        genreIds,
        artists:         artists.map(({ artistId, role }) => ({ artistId, role })),
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
          <SectionLabel className="mb-6">{t("newTrack")}</SectionLabel>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            {/* Title */}
            <div>
              <label className={labelCls}>{t("trackTitle")} *</label>
              <input
                required
                type="text"
                className={inputCls}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Audio URL */}
            <div>
              <label className={labelCls}>{t("audioUrl")} *</label>
              <input
                required
                type="url"
                className={inputCls}
                placeholder="https://"
                value={form.audioUrl}
                onChange={(e) => setForm((p) => ({ ...p, audioUrl: e.target.value }))}
              />
            </div>

            {/* Duration + BPM row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("durationSec")} *</label>
                <input
                  required
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.durationSeconds}
                  onChange={(e) => setForm((p) => ({ ...p, durationSeconds: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>{t("bpmLabel")}</label>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.bpm}
                  onChange={(e) => setForm((p) => ({ ...p, bpm: e.target.value }))}
                />
              </div>
            </div>

            {/* Price + Cover row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("priceLabel")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputCls}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>{t("coverImageUrl")}</label>
                <input
                  type="url"
                  className={inputCls}
                  placeholder="https://"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
                />
              </div>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div>
                <label className={labelCls}>{t("genresLabel")}</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => {
                    const active = genreIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.id)}
                        className={`rounded border px-3 py-1 text-[10px] tracking-widest transition-colors ${
                          active
                            ? isDark ? "bg-fear text-white border-fear" : "bg-[#c4234e] text-white border-[#c4234e]"
                            : isDark ? "bg-royalblue/20 text-vhs-cyan border-royalblue/30" : "bg-[#f5f0e8] text-[#6b5f4e] border-[#d4c8b0]"
                        }`}
                      >
                        {g.name.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Featured artists */}
            <div>
              <label className={labelCls}>{t("featuredArtists")}</label>
              <ArtistPicker
                value={artists}
                onChange={setArtists}
                featRole="feat"
                isDark={isDark}
              />
            </div>

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
                {saving ? t("creating") : t("createTrack")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default function NewTrackPage() {
  return (
    <PageShell>
      <NewTrackContent />
    </PageShell>
  );
}
