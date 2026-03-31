"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Music, Pencil, Trash2, RotateCcw, UserCircle2, CalendarDays, Link2 } from "lucide-react";
import type { ArtistDto } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  Dialog,
  AdminPageHeader,
  AdminDataTable,
} from "@/app/components/admin";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

export default function AdminArtistsPage() {
  const t = useTranslations("Admin");

  const [artists,    setArtists]    = useState<ArtistDto[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [sortBy,     setSortBy]     = useState<string | undefined>();
  const [sortDir,    setSortDir]    = useState<"asc" | "desc">("asc");
  const [filters,    setFilters]    = useState<Record<string, string>>({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [dialogMode,     setDialogMode]     = useState<"view" | "edit">("view");
  const [selected,       setSelected]       = useState<ArtistDto | null>(null);
  const [detailLoading,  setDetailLoading]  = useState(false);

  const [form, setForm] = useState({ bio: "", bannerImageUrl: "", artistSince: "" });

  // ── Core load ─────────────────────────────────────────────────────────────
  const load = useCallback(async (
    p:  number,
    sb: string | undefined,
    sd: "asc" | "desc",
    f:  Record<string, string>,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (sb) {
        params.set("sortBy", sb);
        params.set("sortDir", sd.toUpperCase());
      }

      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });

      const { data } = await api.get<PaginatedResponse<ArtistDto>>(
        `${API_ENDPOINTS.admin.artists}?${params}`,
      );
      setArtists(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, undefined, "asc", {}); }, [load]);

  const reload = () => load(page, sortBy, sortDir, filters);

  // ── Sort / page (immediate) ───────────────────────────────────────────────
  const handleSortChange = (key: string, dir: "asc" | "desc") => {
    setSortBy(key); setSortDir(dir); setPage(1);
    void load(1, key, dir, filters);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void load(p, sortBy, sortDir, filters);
  };

  // ── Filter (debounced 400 ms) ─────────────────────────────────────────────
  const filterDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined,);

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next); setPage(1);
    clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => void load(1, sortBy, sortDir, next), 400);
  };

  // ── Detail fetch ──────────────────────────────────────────────────────────
  const fetchDetail = async (userId: number): Promise<ArtistDto> => {
    const { data } = await api.get<ArtistDto>(API_ENDPOINTS.admin.artistDetail(userId));
    return data;
  };

  const openView = async (artist: ArtistDto) => {
    setDialogMode("view"); setSelected(null); setDialogOpen(true); setDetailLoading(true);
    try {
      const data = await fetchDetail(artist.userId);
      setSelected(data);
      setForm({ bio: data.bio ?? "", bannerImageUrl: data.bannerImageUrl ?? "", artistSince: data.artistSince ?? "" });
    } catch (e) { console.error("Failed to load artist detail", e); }
    finally { setDetailLoading(false); }
  };

  const openEdit = async (artist?: ArtistDto) => {
    const base = artist ?? selected;

    if(!base)
      return;

    setDialogMode("edit"); setDialogOpen(true); setDetailLoading(true);
    try {
      const data = await fetchDetail(base.userId);
      setSelected(data);
      setForm({ bio: data.bio ?? "", bannerImageUrl: data.bannerImageUrl ?? "", artistSince: data.artistSince ?? "" });
    } catch (e) { console.error("Failed to load artist detail", e); }
    finally { setDetailLoading(false); }
  };

  const saveArtist = async () => {
    if(!selected)
      return;

    const { data: updated } = await api.patch<ArtistDto>(API_ENDPOINTS.admin.artistDetail(selected.userId), {
      bio:            form.bio || null,
      bannerImageUrl: form.bannerImageUrl || null,
      artistSince:    form.artistSince || null,
    });
    await reload();
    setSelected(updated);
  };

  const deleteArtist = async (artist: ArtistDto) => {
    if (!confirm(`${t("deleteArtistQuestion")} #${artist.userId} (${artist.displayName})?`))
      return;

    await api.delete(API_ENDPOINTS.admin.artistDetail(artist.userId));
    await reload();
    if(selected?.userId === artist.userId) {
      setDialogOpen(false);
      setSelected(null);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { label: t("id"),          sortKey: "userId" },
    { label: t("nickname"),    sortKey: "displayName", filter: { type: "text" as const } },
    { label: t("email"),       sortKey: "email",       filter: { type: "text" as const } },
    { label: t("artistSince"), sortKey: "artistSince" },
    { label: t("memberSince"), sortKey: "memberSince" },
    { label: t("operations"),  align: "center" as const },
  ];

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader icon={<Music size={18} />} title={t("artists")}>
        <button
          className="btn btn-soft btn-square"
          onClick={async () => { setRefreshing(true); await reload().finally(() => setRefreshing(false)); }}
          disabled={loading || refreshing}
          title={t("refresh")}
          type="button"
        >
          {refreshing ? <span className="loading loading-spinner loading-sm" /> : <RotateCcw size={18} />}
        </button>
      </AdminPageHeader>

      <main className="pt-2 flex-1 overflow-auto">
        <AdminDataTable
          columns={columns}
          loading={loading}
          empty={artists.length === 0 && !loading}
          emptyText={t("noArtists")}
          footer={<span>{t("total")}: {total}</span>}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={handlePageChange}
        >
          {artists.map((artist) => (
            <tr
              key={artist.userId}
              className="hover:bg-stone-200 transition-colors cursor-pointer"
              onClick={() => openView(artist)}
            >
              <td>{artist.userId}</td>
              <td className="font-medium">{artist.displayName}</td>
              <td>{artist.email}</td>
              <td>
                {artist.artistSince
                  ? new Date(artist.artistSince).toLocaleDateString()
                  : <span className="text-gray-400">—</span>}
              </td>
              <td>{new Date(artist.memberSince).toLocaleDateString()}</td>
              <td className="text-center">
                <div className="flex justify-center items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); void openEdit(artist); }}
                    className="btn btn-xs btn-info"
                    title={t("edit")}
                  >
                    <Pencil size={14} color="#fff" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteArtist(artist).catch(console.error); }}
                    className="btn btn-xs btn-error"
                    title={t("delete")}
                  >
                    <Trash2 size={14} color="#fff" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </main>

      <Dialog
        open={dialogOpen}
        mode={dialogMode}
        onCloseAction={() => { setDialogOpen(false); setSelected(null); }}
        onEdit={dialogMode === "view" ? () => openEdit() : undefined}
        onSave={dialogMode === "edit" ? saveArtist : undefined}
        closeAfterSave
        title={dialogMode === "edit" ? t("editArtist") : t("detailArtist")}
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : dialogMode === "view" ? (
          selected ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-info/20 to-info/5">
                {selected.bannerImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.bannerImageUrl} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <div className="relative flex items-center gap-4 p-4">
                  {selected.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.profileImageUrl} alt={selected.displayName} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info text-white font-bold text-lg shadow">
                      {initials(selected.displayName)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-base">{selected.displayName}</div>
                    <div className="text-xs text-gray-500">{selected.email}</div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                      <Music size={10} /> {t("artist")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3">
                  <CalendarDays size={14} className="shrink-0 text-info" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">{t("artistSince")}</div>
                    <div className="text-xs font-semibold">
                      {selected.artistSince ? new Date(selected.artistSince).toLocaleDateString() : <span className="text-gray-400">—</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3">
                  <UserCircle2 size={14} className="shrink-0 text-gray-400" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">{t("memberSince")}</div>
                    <div className="text-xs font-semibold">{new Date(selected.memberSince).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-gray-400 font-semibold">{t("bio")}</div>
                <div className="rounded-lg border bg-slate-50 p-3 text-xs leading-relaxed text-gray-700 min-h-[48px]">
                  {selected.bio || <span className="text-gray-400 italic">{t("noBio")}</span>}
                </div>
              </div>

              {(selected.bannerImageUrl || selected.profileImageUrl) && (
                <div className="space-y-1.5">
                  {selected.bannerImageUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <Link2 size={12} className="shrink-0 text-gray-400" />
                      <span className="text-gray-500 shrink-0">{t("bannerImageUrl")}:</span>
                      <span className="truncate text-blue-500">{selected.bannerImageUrl}</span>
                    </div>
                  )}
                  {selected.profileImageUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <Link2 size={12} className="shrink-0 text-gray-400" />
                      <span className="text-gray-500 shrink-0">{t("profileImageUrl")}:</span>
                      <span className="truncate text-blue-500">{selected.profileImageUrl}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-2 text-xs text-gray-400">ID: {selected.userId}</div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">{t("noArtists")}</div>
          )
        ) : (
          <form className="space-y-3">
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-sm font-medium">{t("bio")}</span>
                <textarea className="textarea textarea-bordered w-full text-sm" rows={4} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-sm font-medium">{t("bannerImageUrl")}</span>
                <input className="input input-bordered w-full text-sm" value={form.bannerImageUrl} onChange={(e) => setForm((p) => ({ ...p, bannerImageUrl: e.target.value }))} placeholder="https://..." />
              </fieldset>
            </div>
            <div className="form-control">
              <fieldset className="fieldset">
                <span className="text-sm font-medium">{t("artistSince")}</span>
                <input type="date" className="input input-bordered w-full text-sm" value={form.artistSince ? form.artistSince.slice(0, 10) : ""} onChange={(e) => setForm((p) => ({ ...p, artistSince: e.target.value }))} />
              </fieldset>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
