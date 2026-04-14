"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Upload, CheckCircle, Loader, Trash2 } from "lucide-react";
import Link from "next/link";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { ArtistPicker, type ArtistInput } from "@/app/components/artist/ArtistPicker";
import { ImageCropModal } from "@/app/components/ui/ImageCropModal";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { parseAxiosError } from "@/lib/axios";
import type { AlbumDto } from "@/app/types/album";
import type { TrackDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function EditAlbumContent() {
  const t              = useTranslations("Artist");
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const { isDark }     = useTheme();
  const { session }    = useAuth();
  const router         = useRouter();
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const [myTracks, setMyTracks]           = useState<TrackDto[]>([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [coverKey, setCoverKey]           = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [cropFile, setCropFile]           = useState<File | null>(null);

  const [form, setForm] = useState({ title: "", releaseDate: "", price: "" });
  const [trackIds, setTrackIds] = useState<number[]>([]);
  const [artists, setArtists]   = useState<ArtistInput[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    Promise.all([
      api.get<AlbumDto>(API_ENDPOINTS.albums.detail(Number(id))),
      api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?artistId=${session.user.id}&limit=100`),
    ])
      .then(([albumRes, tracksRes]) => {
        const al = albumRes.data;
        setForm({
          title:       al.title,
          releaseDate: al.releaseDate.slice(0, 10),
          price:       String(al.price),
        });
        setCoverKey(al.coverImageUrl);
        setCoverFileName("current cover");
        setTrackIds((al.tracks ?? []).map((tr) => tr.id));
        setArtists(al.artists.map((a) => ({
          artistId:    a.artistId,
          displayName: a.displayName,
          role:        a.role,
        })));
        setMyTracks(tracksRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.id, id]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const toggleTrack = (tid: number) =>
    setTrackIds((prev) => prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverKey) { setError("Cover image is required."); return; }
    setError(null);
    setSaving(true);
    try {
      await api.patch(API_ENDPOINTS.albums.detail(Number(id)), {
        title:         form.title.trim(),
        releaseDate:   form.releaseDate,
        coverImageUrl: coverKey,
        price:         Number(form.price),
        artists:       artists.map(({ artistId, role }) => ({ artistId, role })),
        trackIds:      trackIds.length > 0 ? trackIds : undefined,
      });
      router.push(`/${locale}/artist/albums`);
    } catch (err) {
      setError(parseAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.albums.detail(Number(id)));
      router.push(`/${locale}/artist/albums`);
    } catch (err) {
      setError(parseAxiosError(err));
      setDeleting(false);
    }
  };

  const inputCls = `w-full rounded-sm border px-3 py-2.5 outline-none text-xs tracking-wider transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-xs tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;

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
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/${locale}/artist/albums`}
          className={`mb-6 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${
            isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          <ArrowLeft size={12} /> {t("myAlbums")}
        </Link>

        <div className={`rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"}`}>
          <div className="mb-6 flex items-center justify-between">
            <SectionLabel>{t("editAlbum")}</SectionLabel>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] tracking-wider transition-all ${
                isDark
                  ? "border-red-500/30 text-red-400 hover:border-red-400/60 hover:bg-red-400/10"
                  : "border-red-300 text-red-500 hover:border-red-400 hover:bg-red-50"
              }`}
            >
              <Trash2 size={11} /> {deleting ? t("deleting") : t("delete")}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <VHSSpinner />
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              {/* Title */}
              <div>
                <label className={labelCls}>{t("albumTitle")} *</label>
                <input required type="text" className={inputCls} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>

              {/* Release date + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t("releaseDateLabel")} *</label>
                  <input required type="date" className={inputCls} value={form.releaseDate} onChange={(e) => setForm((p) => ({ ...p, releaseDate: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>{t("priceLabel")} *</label>
                  <input required type="number" min={0} step="0.01" className={inputCls} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className={labelCls}>{t("coverImageUrl")} *</label>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
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
                    <><Loader size={13} className="animate-spin shrink-0" /> {t("uploading")}</>
                  ) : coverKey ? (
                    <><CheckCircle size={13} className={`shrink-0 ${isDark ? "text-fear" : "text-[#c4234e]"}`} /> {coverFileName}</>
                  ) : (
                    <><Upload size={13} className="shrink-0" /> {t("chooseCoverImage")}</>
                  )}
                </button>
              </div>

              {/* Collaborating artists */}
              <div>
                <label className={labelCls}>{t("collaboratingArtists")}</label>
                <ArtistPicker value={artists} onChange={setArtists} featRole="collaborator" isDark={isDark} />
              </div>

              {/* Tracks */}
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
                              : isDark ? "border-royalblue/20 hover:border-royalblue/40" : "border-[#a89888]/30 hover:border-[#a89888]/60"
                          }`}
                        >
                          <input type="checkbox" className="h-3.5 w-3.5 cursor-pointer accent-current" checked={selected} onChange={() => toggleTrack(track.id)} />
                          <span className={`text-xs tracking-wide ${isDark ? "text-vhs-light" : "text-[#4a4540]"}`}>{track.title}</span>
                          <span className={`ml-auto text-xs ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                            {track.artists.map((a) => a.displayName).join(", ")}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded border border-red-400/30 bg-red-400/10 p-2 text-xs tracking-wide text-red-400">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <Link
                  href={`/${locale}/artist/albums`}
                  className={`flex-1 rounded-sm border py-2.5 text-center text-xs font-bold tracking-[2px] no-underline transition-all ${
                    isDark ? "border-royalblue/30 text-vhs-muted hover:text-vhs-white" : "border-[#a89888] text-[#635b53] hover:text-[#2a2520]"
                  }`}
                >
                  {t("cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={saving || coverUploading}
                  className={`flex-1 rounded-sm py-2.5 text-xs font-bold tracking-[2px] text-white transition-all hover:brightness-110 disabled:opacity-50 ${
                    isDark ? "bg-fear" : "bg-[#c4234e]"
                  }`}
                >
                  {saving ? t("creating") : t("saveChanges")}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

export default function EditAlbumPage() {
  return (
    <PageShell>
      <EditAlbumContent />
    </PageShell>
  );
}
