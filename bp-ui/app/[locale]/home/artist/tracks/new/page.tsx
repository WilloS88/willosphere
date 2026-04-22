"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Upload, CheckCircle, Loader } from "lucide-react";
import { ImageCropModal } from "@/app/components/ui/ImageCropModal";
import Link from "next/link";

import { useTheme } from "@/lib/hooks";
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
  const { isDark }     = useTheme();
  const { session }    = useAuth();
  const router         = useRouter();
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const [genres, setGenres]               = useState<GenreDto[]>([]);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [uploading, setUploading]         = useState(false);
  const [s3Key, setS3Key]                 = useState<string | null>(null);
  const [fileName, setFileName]           = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverKey, setCoverKey]           = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [cropFile, setCropFile]           = useState<File | null>(null);

  const [form, setForm] = useState({
    title:           "",
    durationSeconds: "",
    bpm:             "",
    price:           "",
  });
  const [genreIds, setGenreIds]   = useState<number[]>([]);
  const [artists, setArtists]     = useState<ArtistInput[]>([]);

  useEffect(() => {
    if(session?.user) {
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file)
      return;

    e.target.value = "";
    setCropFile(file);
  };

  const uploadCroppedCover = async (blob: Blob, filename: string) => {
    setCropFile(null);
    setCoverFileName(filename);
    setCoverKey(null);
    setError(null);
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", new File([blob], filename, { type: blob.type }));
      const res = await fetch("/api/covers/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { key } = await res.json() as { key: string };
      setCoverKey(key);
    } catch {
      setError("Cover image upload failed. Try again.");
      setCoverFileName(null);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file)
      return;

    setFileName(file.name);
    setS3Key(null);
    setError(null);

    // Auto-detect duration from audio file
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);
    audio.addEventListener("loadedmetadata", () => {
      const secs = Math.round(audio.duration);
      if (isFinite(secs) && secs > 0) {
        setForm((p) => ({ ...p, durationSeconds: String(secs) }));
      }
      URL.revokeObjectURL(objectUrl);
    });

    // Upload to S3
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tracks/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { key } = await res.json() as { key: string };
      setS3Key(key);
    } catch {
      setError("Audio upload failed. Try again.");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const toggleGenre = (id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!s3Key) {
      setError("Please upload an audio file first.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.tracks.list, {
        title:           form.title.trim(),
        audioUrl:        s3Key,
        durationSeconds: Number(form.durationSeconds),
        bpm:             form.bpm ? Number(form.bpm) : undefined,
        price:           form.price ? Number(form.price) : undefined,
        coverImageUrl:   coverKey ?? undefined,
        genreIds,
        artists:         artists.map(({ artistId, role }) => ({ artistId, role })),
      });
      router.push(`/${locale}/home/artist`);
    } catch (err) {
      setError(parseAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-sm border px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-fear text-xs tracking-wider transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-xs tracking-[2px] mb-1.5 uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;

  return (
    <>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          onSave={(blob, filename) => void uploadCroppedCover(blob, filename)}
          onClose={() => setCropFile(null)}
        />
      )}
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/${locale}/home/artist`}
          className={`mb-6 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline uppercase ${
            isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          <ArrowLeft size={12} /> {t("backToDashboard")}
        </Link>

        <div
          className={`rounded border p-6 sm:p-8 ${
            isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"
          }`}
        >
          <SectionLabel className="mb-6">{t("newTrack")}</SectionLabel>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            {/* Audio file upload */}
            <div>
              <label htmlFor="audioFile" className={labelCls}>AUDIO FILE *</label>
              <input
                id="audioFile"
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => void handleFileChange(e)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`w-full rounded-sm border px-3 py-3 text-xs tracking-wider text-left transition-all flex items-center gap-2 ${
                  isDark
                    ? "bg-darkblue/60 border-royalblue/30 text-vhs-muted hover:border-fear/50 disabled:opacity-50"
                    : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#635b53] hover:border-[#c4234e]/50 disabled:opacity-50"
                }`}
              >
                {uploading ? (
                  <><Loader size={13} className="animate-spin shrink-0" /> {t("uploading")}</>
                ) : s3Key ? (
                  <><CheckCircle size={13} className={`shrink-0 ${isDark ? "text-fear" : "text-[#c4234e]"}`} /> {fileName}</>
                ) : (
                  <><Upload size={13} className="shrink-0" /> {t("chooseAudioFile")}</>
                )}
              </button>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="trackTitle" className={labelCls}>{t("trackTitle")} *</label>
              <input
                id="trackTitle"
                required
                type="text"
                className={inputCls}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
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
                <label htmlFor="coverImage" className={labelCls}>{t("coverImageUrl")}</label>
                <input
                  id="coverImage"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleCoverChange(e)}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className={`w-full rounded-sm border px-3 py-2.5 text-xs tracking-wider text-left transition-all flex items-center gap-2 ${
                    isDark
                      ? "bg-darkblue/60 border-royalblue/30 text-vhs-muted hover:border-fear/50 disabled:opacity-50"
                      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#635b53] hover:border-[#c4234e]/50 disabled:opacity-50"
                  }`}
                >
                  {coverUploading ? (
                    <><Loader size={13} className="animate-spin shrink-0" /> UPLOADING...</>
                  ) : coverKey ? (
                    <><CheckCircle size={13} className={`shrink-0 ${isDark ? "text-fear" : "text-[#c4234e]"}`} /> {coverFileName}</>
                  ) : (
                    <><Upload size={13} className="shrink-0" /> CHOOSE IMAGE</>
                  )}
                </button>
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
                        className={`rounded border px-3 py-1 text-xs tracking-widest transition-colors uppercase ${
                          active
                            ? isDark ? "bg-fear text-white border-fear" : "bg-[#c4234e] text-white border-[#c4234e]"
                            : isDark ? "bg-royalblue/20 text-vhs-cyan border-royalblue/30" : "bg-[#f5f0e8] text-[#6b5f4e] border-[#d4c8b0]"
                        }`}
                      >
                        {g.name}
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
              <div className="rounded border border-red-400/30 bg-red-400/10 p-2 text-xs tracking-wide text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href={`/${locale}/home/artist`}
                className={`flex-1 rounded-sm border py-2.5 text-center text-xs font-bold tracking-[2px] transition-all uppercase ${
                  isDark
                    ? "border-royalblue/30 text-vhs-muted hover:text-vhs-white"
                    : "border-[#a89888] text-[#635b53] hover:text-[#2a2520]"
                }`}
              >
                {t("cancel")}
              </Link>
              <button
                type="submit"
                disabled={saving || uploading || coverUploading || !s3Key}
                className={`flex-1 rounded-sm py-2.5 text-xs font-bold tracking-[2px] text-white transition-all hover:brightness-110 disabled:opacity-50 uppercase ${
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
  return <NewTrackContent />;
}
