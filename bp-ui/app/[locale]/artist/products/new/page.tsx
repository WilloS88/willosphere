"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { parseAxiosError } from "@/lib/axios";
import type { TrackDto } from "@/app/types/track";
import type { AlbumDto } from "@/app/types/album";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function NewProductContent() {
  const t           = useTranslations("Artist");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useTheme();
  const { session } = useAuth();
  const router      = useRouter();
  const userId      = session?.user?.id ?? null;

  const [tracks, setTracks] = useState<TrackDto[]>([]);
  const [albums, setAlbums] = useState<AlbumDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [form, setForm] = useState({
    name:        "",
    type:        "physical" as "physical" | "digital",
    description: "",
    price:       "",
    trackId:     "" as string,
    albumId:     "" as string,
  });

  useEffect(() => {
    if(!userId)
      return;

    Promise.all([
      api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?artistId=${userId}&limit=100`),
      api.get<PaginatedResponse<AlbumDto>>(`${API_ENDPOINTS.albums.list}?artistId=${userId}&limit=100`),
    ])
      .then(([tr, al]) => {
        setTracks(tr.data.data);
        setAlbums(al.data.data);
      })
      .catch(console.error);
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.products.list, {
        name:        form.name.trim(),
        type:        form.type,
        description: form.description.trim() || undefined,
        price:       Number(form.price),
        trackId:     form.trackId ? Number(form.trackId) : undefined,
        albumId:     form.albumId ? Number(form.albumId) : undefined,
      });
      router.push(`/${locale}/artist/products`);
    } catch (err) {
      setError(parseAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-sm border px-3 py-2.5 outline-none text-xs tracking-wider transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-xs tracking-[2px] mb-1.5 uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/${locale}/artist/products`}
          className={`mb-6 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline uppercase ${
            isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          <ArrowLeft size={12} /> {t("manageProducts")}
        </Link>

        <div
          className={`rounded border p-6 sm:p-8 ${
            isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"
          }`}
        >
          <SectionLabel className="mb-6">{t("createProduct")}</SectionLabel>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            {/* Name */}
            <div>
              <label className={labelCls}>{t("productName")} *</label>
              <input
                required
                type="text"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Type */}
            <div>
              <label className={labelCls}>{t("productType")} *</label>
              <select
                className={selectCls}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "physical" | "digital" }))}
              >
                <option value="physical">{t("physical")}</option>
                <option value="digital">{t("digital")}</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>{t("productDescription")}</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Price */}
            <div>
              <label className={labelCls}>{t("productPrice")} *</label>
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

            {/* Link track / album */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("linkToTrack")}</label>
                <select
                  className={selectCls}
                  value={form.trackId}
                  onChange={(e) => setForm((p) => ({ ...p, trackId: e.target.value, albumId: "" }))}
                >
                  <option value="">{t("none")}</option>
                  {tracks.map((tr) => (
                    <option key={tr.id} value={tr.id}>{tr.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t("linkToAlbum")}</label>
                <select
                  className={selectCls}
                  value={form.albumId}
                  onChange={(e) => setForm((p) => ({ ...p, albumId: e.target.value, trackId: "" }))}
                >
                  <option value="">{t("none")}</option>
                  {albums.map((al) => (
                    <option key={al.id} value={al.id}>{al.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded border border-red-400/30 bg-red-400/10 p-2 text-xs tracking-wide text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href={`/${locale}/artist/products`}
                className={`flex-1 rounded-sm border py-2.5 text-center text-xs font-bold tracking-[2px] no-underline transition-all uppercase ${
                  isDark
                    ? "border-royalblue/30 text-vhs-muted hover:text-vhs-white"
                    : "border-[#a89888] text-[#635b53] hover:text-[#2a2520]"
                }`}
              >
                {t("cancel")}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 rounded-sm py-2.5 text-xs font-bold tracking-[2px] text-white transition-all hover:brightness-110 disabled:opacity-50 uppercase ${
                  isDark ? "bg-fear" : "bg-[#c4234e]"
                }`}
              >
                {saving ? t("creating") : t("createProduct")}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function NewProductPage() {
  return (
    <PageShell>
      <NewProductContent />
    </PageShell>
  );
}
