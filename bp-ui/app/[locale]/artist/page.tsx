"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock, Disc2, Music, Package, Pencil, Play, Settings, Trash2 } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { TrackDto } from "@/app/types/track";
import type { AlbumDto } from "@/app/types/album";
import type { ProductDto } from "@/app/types/product";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function ArtistContent() {
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useTheme();
  const { session } = useAuth();
  const t           = useTranslations("Artist");
  const userId      = session?.user?.id ?? null;

  const [trackTotal, setTrackTotal]     = useState<number | null>(null);
  const [albumTotal, setAlbumTotal]     = useState<number | null>(null);
  const [productTotal, setProductTotal] = useState<number | null>(null);
  const [recentTracks, setRecentTracks] = useState<TrackDto[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<AlbumDto[]>([]);
  const [loading, setLoading]           = useState(true);

  const deleteTrack = async (id: number, title: string) => {
    if(!confirm(`Delete "${title}"?`))
      return;

    try {
      await (await import("@/lib/axios")).default.delete(API_ENDPOINTS.tracks.detail(id));
      setRecentTracks((p) => p.filter((t) => t.id !== id));
      setTrackTotal((n) => (n ?? 1) - 1);
    } catch {}
  };

  const deleteAlbum = async (id: number, title: string) => {
    if(!confirm(`Delete "${title}"?`))
      return;

    try {
      await (await import("@/lib/axios")).default.delete(API_ENDPOINTS.albums.detail(id));
      setRecentAlbums((p) => p.filter((a) => a.id !== id));
      setAlbumTotal((n) => (n ?? 1) - 1);
    } catch {}
  };

  useEffect(() => {
    if(!userId) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?artistId=${userId}&limit=5`),
      api.get<PaginatedResponse<AlbumDto>>(`${API_ENDPOINTS.albums.list}?artistId=${userId}&limit=5`),
      api.get<PaginatedResponse<ProductDto>>(`${API_ENDPOINTS.products.list}?artistId=${userId}&limit=1`),
    ])
      .then(([tracksRes, albumsRes, productsRes]) => {
        setTrackTotal(tracksRes.data.total);
        setAlbumTotal(albumsRes.data.total);
        setProductTotal(productsRes.data.total);
        setRecentTracks(tracksRes.data.data);
        setRecentAlbums(albumsRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const statCls   = `text-center p-4 rounded border ${isDark ? "bg-darkblue/60 border-royalblue/20" : "bg-[#ede7db]/60 border-[#a89888]/20"}`;
  const cardCls   = `rounded border p-5 sm:p-6 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#a89888]/30 bg-white/70"}`;
  const mutedCls  = isDark ? "text-vhs-muted" : "text-[#635b53]";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <SectionLabel className="mb-1">{t("dashboard")}</SectionLabel>
            <h1 className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>
              {session?.user.displayName ?? "ARTIST"}
            </h1>
          </div>
          <Link
            href={`/${locale}/artist/profile`}
            className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-bold tracking-[2px] no-underline transition-all ${
              isDark
                ? "border-royalblue/40 text-vhs-light hover:border-fear"
                : "border-[#a89888] text-[#524a44] hover:border-[#c4234e]"
            }`}
          >
            <Settings size={12} /> {t("editProfile")}
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("tracks"),      value: trackTotal   ?? "—", color: "text-fear" },
            { label: t("albums"),      value: albumTotal   ?? "—", color: "text-vhs-purple" },
            { label: t("myProducts"),  value: productTotal ?? "—", color: "text-vhs-cyan" },
            { label: t("plays"),       value: "—",                 color: "text-vhs-green" },
          ].map((s) => (
            <div key={s.label} className={statCls}>
              <div className={`mb-1 text-xs tracking-wider ${mutedCls}`}>{s.label}</div>
              <div className={`text-xl font-bold ${s.color}`}>{String(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className={`mb-6 ${cardCls}`}>
          <SectionLabel className="mb-4">{t("quickActions")}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: t("uploadTrack"), icon: <Music   size={20} />, href: `/${locale}/artist/tracks/new` },
              { label: t("createAlbum"), icon: <Disc2   size={20} />, href: `/${locale}/artist/albums/new` },
              { label: t("addProduct"),  icon: <Package size={20} />, href: `/${locale}/artist/products/new` },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center gap-3 rounded border p-3 no-underline transition-all hover:-translate-y-0.5 ${
                  isDark
                    ? "border-royalblue/20 bg-royalblue/10 text-vhs-light hover:border-fear/30"
                    : "border-[#a89888]/30 bg-[#ede7db]/40 text-[#524a44] hover:border-[#c4234e]/20"
                }`}
              >
                <span>{a.icon}</span>
                <span className="text-xs font-bold tracking-[2px]">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent content */}
        {loading ? (
          <div className="flex justify-center py-10">
            <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Recent tracks */}
            <div className={cardCls}>
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>{t("recentTracks")}</SectionLabel>
                <Link href={`/${locale}/artist/tracks`} className={`text-xs tracking-widest no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"}`}>
                  {t("viewAll")} <ArrowRight size={11} />
                </Link>
              </div>
              {recentTracks.length === 0 ? (
                <div className={`py-6 text-center text-xs tracking-widest ${mutedCls}`}>{t("noRecentTracks")}</div>
              ) : (
                <div className="space-y-1">
                  {recentTracks.map((track) => (
                    <div key={track.id} className={`flex items-center gap-3 rounded border px-3 py-2 ${isDark ? "border-royalblue/20 bg-royalblue/5" : "border-[#a89888]/20 bg-[#faf8f5]"}`}>
                      {track.coverImageUrl ? (
                        <img src={track.coverImageUrl} alt={track.title} className="h-8 w-8 shrink-0 rounded object-cover" />
                      ) : (
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/30 bg-[#f5f0e8]"}`}>
                          <Play size={11} className={mutedCls} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>{track.title}</div>
                        <div className={`text-xs tracking-wide ${mutedCls}`}>{track.genres.map((g) => g.name).join(" · ")}</div>
                      </div>
                      <div className={`flex shrink-0 items-center gap-1 text-xs tabular-nums ${mutedCls}`}>
                        <Clock size={9} />{formatDuration(track.durationSeconds)}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link href={`/${locale}/artist/tracks/${track.id}/edit`} className={`flex h-6 w-6 items-center justify-center rounded-sm border transition-opacity hover:opacity-70 ${isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#a89888]/40 text-[#635b53]"}`}>
                          <Pencil size={10} />
                        </Link>
                        <button onClick={() => void deleteTrack(track.id, track.title)} className={`hover:text-fear flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-all ${isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#a89888]/40 text-[#635b53]"}`}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent albums */}
            <div className={cardCls}>
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>{t("recentAlbums")}</SectionLabel>
                <Link href={`/${locale}/artist/albums`} className={`text-xs tracking-widest no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"}`}>
                  {t("viewAll")} <ArrowRight size={11} />
                </Link>
              </div>
              {recentAlbums.length === 0 ? (
                <div className={`py-6 text-center text-xs tracking-widest ${mutedCls}`}>{t("noRecentAlbums")}</div>
              ) : (
                <div className="space-y-1">
                  {recentAlbums.map((album) => (
                    <div key={album.id} className={`flex items-center gap-3 rounded border px-3 py-2 ${isDark ? "border-royalblue/20 bg-royalblue/5" : "border-[#a89888]/20 bg-[#faf8f5]"}`}>
                      <img
                        src={album.coverImageUrl}
                        alt={album.title}
                        className="h-8 w-8 shrink-0 rounded object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>{album.title}</div>
                        <div className={`text-xs tracking-wide ${mutedCls}`}>{new Date(album.releaseDate).getFullYear()}</div>
                      </div>
                      <div className={`shrink-0 text-xs tabular-nums ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                        {album.price} CZK
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link href={`/${locale}/artist/albums/${album.id}/edit`} className={`flex h-6 w-6 items-center justify-center rounded-sm border transition-opacity hover:opacity-70 ${isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#a89888]/40 text-[#635b53]"}`}>
                          <Pencil size={10} />
                        </Link>
                        <button onClick={() => void deleteAlbum(album.id, album.title)} className={`hover:text-fear flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-all ${isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#a89888]/40 text-[#635b53]"}`}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ArtistPage() {
  return (
    <PageShell>
      <ArtistContent />
    </PageShell>
  );
}
