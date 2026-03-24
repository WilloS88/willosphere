"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { AudioLines, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { TrackDto, GenreDto, TrackArtistInfo } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  AdminDataTable,
  AdminPageHeader,
  AdminDetailField,
  Dialog,
} from "@/app/components/admin";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

type ArtistRow = { artistId: string; role: "primary" | "feat" };

type TrackForm = {
  title:         string;
  durationSeconds: string;
  bpm:           string;
  audioUrl:      string;
  price:         string;
  coverImageUrl: string;
  albumId:       string;
  artists:       ArtistRow[];
  genreIds:      number[];
};

const emptyForm = (): TrackForm => ({
  title:           "",
  durationSeconds: "",
  bpm:             "",
  audioUrl:        "",
  price:           "",
  coverImageUrl:   "",
  albumId:         "",
  artists:         [{ artistId: "", role: "primary" }],
  genreIds:        [],
});

function formFromTrack(track: TrackDto): TrackForm {
  return {
    title:           track.title,
    durationSeconds: String(track.durationSeconds),
    bpm:             track.bpm != null ? String(track.bpm) : "",
    audioUrl:        track.audioUrl,
    price:           track.price != null ? String(track.price) : "",
    coverImageUrl:   track.coverImageUrl ?? "",
    albumId:         track.albumId != null ? String(track.albumId) : "",
    artists:         track.artists.map((a) => ({ artistId: String(a.artistId), role: a.role })),
    genreIds:        track.genres.map((g) => g.id),
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AdminTracksPage() {
  const t = useTranslations("Admin");

  const [tracks, setTracks]         = useState<TrackDto[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [sortBy, setSortBy]         = useState<string | undefined>();
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [filters, setFilters]       = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allGenres, setAllGenres]   = useState<GenreDto[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("view");
  const [selected, setSelected]     = useState<TrackDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm]             = useState<TrackForm>(emptyForm());

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

      const { data } = await api.get<PaginatedResponse<TrackDto>>(
        `${API_ENDPOINTS.adminTracks.list}?${params}`,
      );
      setTracks(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, undefined, "desc", {});
    api.get<PaginatedResponse<GenreDto>>(`${API_ENDPOINTS.adminGenres.list}?limit=100`)
      .then(({ data }) => setAllGenres(data.data))
      .catch(console.error);
  }, [load]);

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

  const fetchDetail = async (id: number): Promise<TrackDto> => {
    const { data } = await api.get<TrackDto>(API_ENDPOINTS.adminTracks.detail(id));
    return data;
  };

  const openCreate = () => {
    setForm(emptyForm());
    setSelected(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openView = async (track: TrackDto) => {
    setDialogMode("view");
    setSelected(null);
    setDialogOpen(true);
    setDetailLoading(true);
    try {
      const data = await fetchDetail(track.id);
      setSelected(data);
      setForm(formFromTrack(data));
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (track?: TrackDto) => {
    const base = track ?? selected;
    if(!base)
      return;

    setDialogMode("edit");
    if(!selected || selected.id !== base.id) {
      setDetailLoading(true);
      try {
        const data = await fetchDetail(base.id);
        setSelected(data);
        setForm(formFromTrack(data));
      } finally {
        setDetailLoading(false);
      }
    } else {
      setForm(formFromTrack(selected));
    }
  };

  const buildPayload = () => ({
    title:           form.title,
    durationSeconds: parseInt(form.durationSeconds, 10),
    bpm:             form.bpm           ? parseInt(form.bpm, 10)     : undefined,
    audioUrl:        form.audioUrl,
    price:           form.price         ? parseFloat(form.price)     : undefined,
    coverImageUrl:   form.coverImageUrl || undefined,
    albumId:         form.albumId       ? parseInt(form.albumId, 10) : undefined,
    artists:         form.artists
      .filter((a) => a.artistId.trim() !== "")
      .map((a) => ({ artistId: parseInt(a.artistId, 10), role: a.role })),
    genreIds: form.genreIds,
  });

  const save = async () => {
    if(dialogMode === "create") {
      await api.post(API_ENDPOINTS.adminTracks.list, buildPayload());
    } else if (dialogMode === "edit" && selected) {
      await api.patch(API_ENDPOINTS.adminTracks.detail(selected.id), buildPayload());
    }
    await reload();
    setDialogOpen(false);
  };

  const remove = async (track: TrackDto) => {
    if(!confirm(`${t("deleteTrackQuestion")} "${track.title}"?`))
      return;

    await api.delete(API_ENDPOINTS.adminTracks.detail(track.id));
    await reload();
    if(selected?.id === track.id) {
      setDialogOpen(false);
      setSelected(null);
    }
  };

  const addArtistRow    = () => setForm((f) => ({ ...f, artists: [...f.artists, { artistId: "", role: "feat" }] }));
  const removeArtistRow = (i: number) => setForm((f) => ({ ...f, artists: f.artists.filter((_, idx) => idx !== i) }));
  const updateArtistRow = (i: number, field: keyof ArtistRow, value: string) =>
    setForm((f) => ({
      ...f,
      artists: f.artists.map((a, idx) => idx === i ? { ...a, [field]: value } : a),
    }));

  const toggleGenre = (id: number) =>
    setForm((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id)
        ? f.genreIds.filter((g) => g !== id)
        : [...f.genreIds, id],
    }));

  const columns = [
    { label: t("id"),       sortKey: "id" },
    { label: t("title"),    sortKey: "title", filter: { type: "text" as const } },
    { label: t("duration"), sortKey: "duration" },
    { label: t("bpm"),      sortKey: "bpm" },
    { label: t("price"),    sortKey: "price" },
    { label: t("artists") },
    { label: t("genres") },
    { label: t("operations"), align: "center" as const },
  ];

  const dialogTitle =
    dialogMode === "create" ? t("newTrack") :
    dialogMode === "edit"   ? t("editTrack") :
    t("detailTrack");

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader icon={<AudioLines size={18} />} title={t("tracks")}>
        <button className="btn btn-sm btn-info text-white" onClick={openCreate}>
          <Plus size={18} /> {t("newTrack")}
        </button>
        <button
          className="btn btn-soft btn-square"
          onClick={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}
          disabled={loading || refreshing}
        >
          {refreshing
            ? <span className="loading loading-spinner loading-sm" />
            : <RotateCcw size={18} />}
        </button>
      </AdminPageHeader>

      <main className="pt-2 flex-1 overflow-auto">
        <AdminDataTable
          columns={columns}
          loading={loading}
          empty={tracks.length === 0 && !loading}
          emptyText={t("noTracks")}
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
          {tracks.map((track) => (
            <tr
              key={track.id}
              className="hover:bg-stone-200 transition-colors cursor-pointer"
              onClick={() => void openView(track)}
            >
              <td>{track.id}</td>
              <td className="font-medium max-w-[180px] truncate">{track.title}</td>
              <td className="tabular-nums">{formatDuration(track.durationSeconds)}</td>
              <td>{track.bpm ?? <span className="text-gray-400">—</span>}</td>
              <td>{track.price != null ? `${track.price} CZK` : <span className="text-gray-400">—</span>}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {track.artists.map((a) => (
                    <span key={a.artistId} className={`badge badge-xs ${a.role === "primary" ? "badge-info" : "badge-ghost"}`}>
                      {a.displayName}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {track.genres.map((g) => (
                    <span key={g.id} className="badge badge-xs badge-outline">{g.name}</span>
                  ))}
                </div>
              </td>
              <td className="text-center">
                <button
                  className="btn btn-xs btn-info mr-1"
                  onClick={(e) => { e.stopPropagation(); void openEdit(track); }}
                >
                  <Pencil size={14} color="#fff" />
                </button>
                <button
                  className="btn btn-xs btn-error"
                  onClick={(e) => { e.stopPropagation(); void remove(track); }}
                >
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
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : dialogMode === "view" && selected ? (
          <div className="space-y-3 text-sm">
            {selected.coverImageUrl && (
              <img src={selected.coverImageUrl} alt={selected.title} className="h-32 w-32 rounded object-cover border" />
            )}
            <AdminDetailField label={t("id")}       value={selected.id} />
            <AdminDetailField label={t("title")}    value={selected.title} />
            <AdminDetailField label={t("duration")} value={formatDuration(selected.durationSeconds)} />
            <AdminDetailField label={t("bpm")}      value={selected.bpm ?? "—"} />
            <AdminDetailField label={t("price")}    value={selected.price != null ? `${selected.price} CZK` : "—"} />
            <AdminDetailField label={t("albumId")}  value={selected.albumId ?? "—"} />
            <AdminDetailField label={t("audioUrl")} value={
              <a href={selected.audioUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline truncate block">{selected.audioUrl}</a>
            } />
            <div>
              <span className="font-semibold text-gray-600">{t("artists")}: </span>
              {selected.artists.map((a) => (
                <span key={a.artistId} className={`badge badge-sm mr-1 ${a.role === "primary" ? "badge-info" : "badge-ghost"}`}>
                  {a.displayName} ({a.role})
                </span>
              ))}
            </div>
            <div>
              <span className="font-semibold text-gray-600">{t("genres")}: </span>
              {selected.genres.map((g) => (
                <span key={g.id} className="badge badge-sm badge-outline mr-1">{g.name}</span>
              ))}
            </div>
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
                <legend className="text-sm font-medium">{t("duration")} *</legend>
                <input type="number" min={1} className="input input-bordered w-full text-sm"
                  value={form.durationSeconds}
                  onChange={(e) => setForm((f) => ({ ...f, durationSeconds: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("bpm")}</legend>
                <input type="number" min={1} className="input input-bordered w-full text-sm"
                  value={form.bpm}
                  onChange={(e) => setForm((f) => ({ ...f, bpm: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("audioUrl")} *</legend>
                <input className="input input-bordered w-full text-sm" value={form.audioUrl}
                  onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("price")}</legend>
                <input type="number" min={0} step={0.01} className="input input-bordered w-full text-sm"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("albumId")}</legend>
                <input type="number" min={1} className="input input-bordered w-full text-sm"
                  value={form.albumId}
                  onChange={(e) => setForm((f) => ({ ...f, albumId: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("coverImageUrl")}</legend>
                <input className="input input-bordered w-full text-sm" value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))} placeholder="https://..." />
              </fieldset>
            </div>

            {/* Artists */}
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
                      type="number"
                      min={1}
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
                      <option value="feat">{t("featRole")}</option>
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

            {/* Genres */}
            <div>
              <span className="text-sm font-medium">{t("genres")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {allGenres.map((g) => (
                  <label key={g.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-info"
                      checked={form.genreIds.includes(g.id)}
                      onChange={() => toggleGenre(g.id)}
                    />
                    <span className="text-xs">{g.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
