"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Disc3, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { AlbumDto, AlbumArtistInfo } from "@/app/types/album";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  AdminDataTable,
  AdminPageHeader,
  AdminDetailField,
  AdminSpinner,
  Dialog,
} from "@/app/components/admin";
import api, { parseAxiosError } from "@/lib/axios";
import { useToast } from "@/app/context/ToastContext";

const PAGE_SIZE = 20;

type ArtistRow = { artistId: string; role: "primary" | "collaborator" };

type AlbumForm = {
  title:         string;
  releaseDate:   string;
  coverImageUrl: string;
  price:         string;
  artists:       ArtistRow[];
  trackIds:      string;
};

const emptyForm = (): AlbumForm => ({
  title:         "",
  releaseDate:   "",
  coverImageUrl: "",
  price:         "",
  artists:       [{ artistId: "", role: "primary" }],
  trackIds:      "",
});

function formFromAlbum(album: AlbumDto): AlbumForm {
  return {
    title:         album.title,
    releaseDate:   album.releaseDate,
    coverImageUrl: album.coverImageUrl,
    price:         String(album.price),
    artists:       album.artists.map((a) => ({ artistId: String(a.artistId), role: a.role })),
    trackIds:      album.tracks?.map((t) => t.id).join(", ") ?? "",
  };
}

export default function AdminAlbumsPage() {
  const t     = useTranslations("Admin");
  const toast = useToast();

  const [albums, setAlbums]         = useState<AlbumDto[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [sortBy, setSortBy]         = useState<string | undefined>();
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [filters, setFilters]       = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen]         = useState(false);
  const [dialogMode, setDialogMode]         = useState<"create" | "edit" | "view">("view");
  const [selected, setSelected]             = useState<AlbumDto | null>(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [form, setForm]                     = useState<AlbumForm>(emptyForm());

  const load = useCallback(async (
    p:  number,
    sb: string | undefined,
    sd: "asc" | "desc",
    f:  Record<string, string>,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if(sb) {
        params.set("sortBy", sb);
        params.set("sortDir", sd.toUpperCase());
      }
      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get<PaginatedResponse<AlbumDto>>(`${API_ENDPOINTS.adminAlbums.list}?${params}`);
      setAlbums(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, undefined, "desc", {}); }, [load]);

  const reload = () => load(page, sortBy, sortDir, filters);

  const handleSortChange = (key: string, dir: "asc" | "desc") => {
    setSortBy(key); setSortDir(dir); setPage(1);
    void load(1, key, dir, filters);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void load(p, sortBy, sortDir, filters);
  };

  const filterDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next); setPage(1);
    clearTimeout(filterDebounce.current);
    filterDebounce.current = setTimeout(() => void load(1, sortBy, sortDir, next), 400);
  };

  const fetchDetail = async (id: number): Promise<AlbumDto> => {
    const { data } = await api.get<AlbumDto>(API_ENDPOINTS.adminAlbums.detail(id));
    return data;
  };

  const openCreate = () => {
    setForm(emptyForm());
    setSelected(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openView = async (album: AlbumDto) => {
    setDialogMode("view");
    setSelected(null);
    setDialogOpen(true);
    setDetailLoading(true);
    try {
      const data = await fetchDetail(album.id);
      setSelected(data);
      setForm(formFromAlbum(data));
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (album?: AlbumDto) => {
    const base = album ?? selected;
    if(!base)
      return;

    setDialogMode("edit");
    setDialogOpen(true);

    if(!selected || selected.id !== base.id) {
      setDetailLoading(true);
      try {
        const data = await fetchDetail(base.id);
        setSelected(data);
        setForm(formFromAlbum(data));
      } finally {
        setDetailLoading(false);
      }
    } else {
      setForm(formFromAlbum(selected));
    }
  };

  const buildPayload = () => ({
    title:         form.title,
    releaseDate:   form.releaseDate,
    coverImageUrl: form.coverImageUrl,
    price:         parseFloat(form.price),
    artists:       form.artists
      .filter((a) => a.artistId.trim() !== "")
      .map((a) => ({ artistId: parseInt(a.artistId, 10), role: a.role })),
    trackIds: form.trackIds
      ? form.trackIds.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
      : undefined,
  });

  const save = async () => {
    try {
      if(dialogMode === "create") {
        await api.post(API_ENDPOINTS.adminAlbums.list, buildPayload());
      } else if(dialogMode === "edit" && selected) {
        await api.patch(API_ENDPOINTS.adminAlbums.detail(selected.id), buildPayload());
      }
      await reload();
      setDialogOpen(false);
      toast.success(t("toastSaved"));
    } catch (err) {
      toast.error(parseAxiosError(err));
    }
  };

  const remove = async (album: AlbumDto) => {
    if (!confirm(`${t("deleteAlbumQuestion")} "${album.title}"?`))
      return;

    try {
      await api.delete(API_ENDPOINTS.adminAlbums.detail(album.id));
      await reload();
      if(selected?.id === album.id) {
        setDialogOpen(false);
        setSelected(null);
      }
      toast.success(t("toastDeleted"));
    } catch (err) {
      toast.error(parseAxiosError(err));
    }
  };

  const addArtistRow    = () => setForm((f) => ({ ...f, artists: [...f.artists, { artistId: "", role: "collaborator" as const }] }));
  const removeArtistRow = (i: number) => setForm((f) => ({ ...f, artists: f.artists.filter((_, idx) => idx !== i) }));
  const updateArtistRow = (i: number, field: keyof ArtistRow, value: string) =>
    setForm((f) => ({ ...f, artists: f.artists.map((a, idx) => idx === i ? { ...a, [field]: value } : a) }));

  const columns = [
    { label: t("id"),          sortKey: "id" },
    { label: t("title"),       sortKey: "title", filter: { type: "text" as const } },
    { label: t("releaseDate"), sortKey: "releaseDate" },
    { label: t("price"),       sortKey: "price" },
    { label: t("artists") },
    { label: t("operations"),  align: "center" as const },
  ];

  const dialogTitle =
    dialogMode === "create" ? t("newAlbum") :
    dialogMode === "edit"   ? t("editAlbum") :
    t("detailAlbum");

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader icon={<Disc3 size={18} />} title={t("albums")}>
        <button className="btn btn-sm btn-info text-white" onClick={openCreate}>
          <Plus size={18} /> {t("newAlbum")}
        </button>
        <button
          className="btn btn-soft btn-square"
          onClick={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}
          disabled={loading || refreshing}
        >
          {refreshing ? <AdminSpinner size="sm" /> : <RotateCcw size={18} />}
        </button>
      </AdminPageHeader>

      <main className="pt-2 flex-1 overflow-auto">
        <AdminDataTable
          columns={columns}
          loading={loading}
          empty={albums.length === 0 && !loading}
          emptyText={t("noAlbums")}
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
          {albums.map((album) => (
            <tr
              key={album.id}
              className="hover:bg-base-200 transition-colors cursor-pointer"
              onClick={() => void openView(album)}
            >
              <td>{album.id}</td>
              <td className="font-medium max-w-[200px] truncate">
                <div className="flex items-center gap-2">
                  {album.coverImageUrl && (
                    <img src={album.coverImageUrl} alt={album.title} className="h-8 w-8 rounded object-cover shrink-0" />
                  )}
                  {album.title}
                </div>
              </td>
              <td>{album.releaseDate}</td>
              <td>{album.price} CZK</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {album.artists.map((a: AlbumArtistInfo) => (
                    <span key={a.artistId} className={`badge badge-xs ${a.role === "primary" ? "badge-info" : "badge-ghost"}`}>
                      {a.displayName}
                    </span>
                  ))}
                </div>
              </td>
              <td className="text-center">
                <button className="btn btn-xs btn-info mr-1" onClick={(e) => { e.stopPropagation(); void openEdit(album); }}>
                  <Pencil size={14} color="#fff" />
                </button>
                <button className="btn btn-xs btn-error" onClick={(e) => { e.stopPropagation(); void remove(album); }}>
                  <Trash2 size={14} color="#fff" />
                </button>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </main>

      <Dialog
        open={dialogOpen}
        mode={dialogMode}
        title={dialogTitle}
        onCloseAction={() => setDialogOpen(false)}
        onSave={dialogMode !== "view" ? save : undefined}
        onEdit={dialogMode === "view" ? () => void openEdit() : undefined}
        maxWidthClass="max-w-2xl"
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <AdminSpinner />
          </div>
        ) : dialogMode === "view" && selected ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 rounded-lg bg-base-300/50 p-4">
              {selected.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.coverImageUrl} alt={selected.title} className="h-14 w-14 rounded object-cover border border-base-content/20 shadow" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-info/15 text-info">
                  <Disc3 size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base truncate">{selected.title}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selected.artists.map((a) => (
                    <span key={a.artistId} className={`badge badge-sm ${a.role === "primary" ? "badge-info" : "bg-base-content/20 text-base-content/80"}`}>
                      {a.displayName} ({a.role})
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-base-content/40 self-start">#{selected.id}</div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <AdminDetailField label={t("releaseDate")} value={selected.releaseDate} block />
              <AdminDetailField label={t("price")} value={`${selected.price} CZK`} block />
            </div>

            {/* Tracklist */}
            {selected.tracks && selected.tracks.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold text-base-content/70">{t("tracks")} ({selected.tracks.length}):</div>
                <div className="rounded border border-base-300 bg-base-200 p-2 text-xs leading-relaxed max-h-48 overflow-y-auto space-y-1">
                  {selected.tracks.map((track, i) => (
                    <div key={track.id} className="flex items-center gap-2 text-base-content">
                      <span className="text-base-content/40 w-5 text-right">{i + 1}.</span>
                      <span className="font-medium">{track.title}</span>
                      <span className="text-base-content/40">— {track.artists.map((a) => a.displayName).join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("title")} *</legend>
                <input className="input input-bordered w-full text-sm" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("releaseDate")} *</legend>
                <input type="date" className="input input-bordered w-full text-sm" value={form.releaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("price")} *</legend>
                <input type="number" min={0} step={0.01} className="input input-bordered w-full text-sm" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("coverImageUrl")} *</legend>
                <input className="input input-bordered w-full text-sm" value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))} placeholder="https://..." />
              </fieldset>

              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("albumId")} (Track IDs — čárkou oddělené)</legend>
                <input className="input input-bordered w-full text-sm" value={form.trackIds}
                  onChange={(e) => setForm((f) => ({ ...f, trackIds: e.target.value }))} placeholder="1, 2, 3" />
              </fieldset>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t("artists")} *</span>
                <button type="button" className="btn btn-xs btn-ghost" onClick={addArtistRow}>
                  <Plus size={12} /> {t("addArtist")}
                </button>
              </div>
              <div className="space-y-2">
                {form.artists.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="number" min={1}
                      className="input input-bordered input-sm w-32"
                      placeholder={t("artistId")}
                      value={row.artistId}
                      onChange={(e) => updateArtistRow(i, "artistId", e.target.value)}
                    />
                    <select
                      className="select select-bordered select-sm"
                      value={row.role}
                      onChange={(e) => updateArtistRow(i, "role", e.target.value)}
                    >
                      <option value="primary">{t("primaryRole")}</option>
                      <option value="collaborator">{t("collaboratorRole")}</option>
                    </select>
                    {form.artists.length > 1 && (
                      <button type="button" className="btn btn-xs btn-error btn-ghost" onClick={() => removeArtistRow(i)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
