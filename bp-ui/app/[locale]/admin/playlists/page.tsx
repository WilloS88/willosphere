"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { ListMusic, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { PlaylistDto } from "@/app/types/playlist";
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

type PlaylistForm = {
  title:           string;
  isPublic:        boolean;
  isCollaborative: boolean;
};

function formFromPlaylist(p: PlaylistDto): PlaylistForm {
  return { title: p.title, isPublic: p.isPublic, isCollaborative: p.isCollaborative };
}

export default function AdminPlaylistsPage() {
  const t = useTranslations("Admin");

  const [playlists, setPlaylists]   = useState<PlaylistDto[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [sortBy, setSortBy]         = useState<string | undefined>();
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [filters, setFilters]       = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen]       = useState(false);
  const [dialogMode, setDialogMode]       = useState<"edit" | "view">("view");
  const [selected, setSelected]           = useState<PlaylistDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm]                   = useState<PlaylistForm>({ title: "", isPublic: false, isCollaborative: false });

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
      const { data } = await api.get<PaginatedResponse<PlaylistDto>>(`${API_ENDPOINTS.adminPlaylists.list}?${params}`);
      setPlaylists(data.data);
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

  const fetchDetail = async (id: number): Promise<PlaylistDto> => {
    const { data } = await api.get<PlaylistDto>(API_ENDPOINTS.adminPlaylists.detail(id));
    return data;
  };

  const openView = async (playlist: PlaylistDto) => {
    setDialogMode("view");
    setSelected(null);
    setDialogOpen(true);
    setDetailLoading(true);
    try {
      const data = await fetchDetail(playlist.id);
      setSelected(data);
      setForm(formFromPlaylist(data));
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (playlist?: PlaylistDto) => {
    const base = playlist ?? selected;
    if(!base)
      return;

    setDialogMode("edit");

    if(!selected || selected.id !== base.id) {
      setDetailLoading(true);
      try {
        const data = await fetchDetail(base.id);
        setSelected(data);
        setForm(formFromPlaylist(data));
      } finally {
        setDetailLoading(false);
      }
    } else {
      setForm(formFromPlaylist(selected));
    }
  };

  const save = async () => {
    if(dialogMode === "edit" && selected) {
      await api.patch(API_ENDPOINTS.adminPlaylists.detail(selected.id), {
        title:           form.title,
        isPublic:        form.isPublic,
        isCollaborative: form.isCollaborative,
      });
    }
    await reload();
    setDialogOpen(false);
  };

  const remove = async (playlist: PlaylistDto) => {
    if(!confirm(`${t("deletePlaylistQuestion")} "${playlist.title}"?`))
      return;

    await api.delete(API_ENDPOINTS.adminPlaylists.detail(playlist.id));
    await reload();

    if(selected?.id === playlist.id) {
      setDialogOpen(false);
      setSelected(null);
    }
  };

  const columns = [
    { label: t("id"),              sortKey: "id" },
    { label: t("title"),           sortKey: "title", filter: { type: "text" as const } },
    { label: t("owner"),           sortKey: "userId" },
    { label: t("isPublic") },
    { label: t("isCollaborative") },
    { label: t("trackCount") },
    { label: t("operations"),      align: "center" as const },
  ];

  const dialogTitle = dialogMode === "edit" ? t("editPlaylist") : t("detailPlaylist");

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader icon={<ListMusic size={18} />} title={t("playlists")}>
        <button
          className="btn btn-soft btn-square"
          onClick={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}
          disabled={loading || refreshing}
        >
          {refreshing ? <span className="loading loading-spinner loading-sm" /> : <RotateCcw size={18} />}
        </button>
      </AdminPageHeader>

      <main className="pt-2 flex-1 overflow-auto">
        <AdminDataTable
          columns={columns}
          loading={loading}
          empty={playlists.length === 0 && !loading}
          emptyText={t("noPlaylists")}
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
          {playlists.map((playlist) => (
            <tr
              key={playlist.id}
              className="hover:bg-stone-200 transition-colors cursor-pointer"
              onClick={() => void openView(playlist)}
            >
              <td>{playlist.id}</td>
              <td className="font-medium max-w-[200px] truncate">{playlist.title}</td>
              <td>{playlist.userId}</td>
              <td>
                <span className={`badge badge-xs ${playlist.isPublic ? "badge-success" : "badge-ghost"}`}>
                  {playlist.isPublic ? "✓" : "✗"}
                </span>
              </td>
              <td>
                <span className={`badge badge-xs ${playlist.isCollaborative ? "badge-warning" : "badge-ghost"}`}>
                  {playlist.isCollaborative ? "✓" : "✗"}
                </span>
              </td>
              <td>{playlist.trackCount}</td>
              <td className="text-center">
                <button className="btn btn-xs btn-info mr-1" onClick={(e) => { e.stopPropagation(); void openEdit(playlist); }}>
                  <Pencil size={14} color="#fff" />
                </button>
                <button className="btn btn-xs btn-error" onClick={(e) => { e.stopPropagation(); void remove(playlist); }}>
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
        onSave={dialogMode === "edit" ? save : undefined}
        onEdit={dialogMode === "view" ? () => void openEdit() : undefined}
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : dialogMode === "view" && selected ? (
          <div className="space-y-3 text-sm">
            <AdminDetailField label={t("id")}              value={selected.id} />
            <AdminDetailField label={t("title")}           value={selected.title} />
            <AdminDetailField label={t("owner")}           value={selected.userId} />
            <AdminDetailField label={t("isPublic")}        value={selected.isPublic ? "✓" : "✗"} />
            <AdminDetailField label={t("isCollaborative")} value={selected.isCollaborative ? "✓" : "✗"} />
            <AdminDetailField label={t("trackCount")}      value={selected.trackCount} />
            {selected.tracks && selected.tracks.length > 0 && (
              <div>
                <div className="font-semibold text-gray-600 mb-1">{t("tracks")}:</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selected.tracks.map((pt) => (
                    <div key={pt.track.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="text-gray-400 w-5 text-right">{pt.position}.</span>
                      <span className="font-medium">{pt.track.title}</span>
                      <span className="text-gray-400">— {pt.track.artists.map((a) => a.displayName).join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-4">
            <fieldset className="fieldset">
              <legend className="text-sm font-medium">{t("title")}</legend>
              <input
                className="input input-bordered w-full text-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </fieldset>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-info"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                />
                <span className="text-sm">{t("isPublic")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-warning"
                  checked={form.isCollaborative}
                  onChange={(e) => setForm((f) => ({ ...f, isCollaborative: e.target.checked }))}
                />
                <span className="text-sm">{t("isCollaborative")}</span>
              </label>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
