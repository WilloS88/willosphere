"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { ListMusic, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { PlaylistDto } from "@/app/types/playlist";
import type { UserDTO } from "@/app/types/user";
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

type PlaylistForm = {
  title:           string;
  isPublic:        boolean;
  isCollaborative: boolean;
  userId:          number;
};

function formFromPlaylist(p: PlaylistDto): PlaylistForm {
  return { title: p.title, isPublic: p.isPublic, isCollaborative: p.isCollaborative, userId: p.userId };
}

export default function AdminPlaylistsPage() {
  const t     = useTranslations("Admin");
  const toast = useToast();

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
  const [form, setForm]                   = useState<PlaylistForm>({ title: "", isPublic: false, isCollaborative: false, userId: 0 });
  const [allUsers, setAllUsers]           = useState<UserDTO[]>([]);

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

  useEffect(() => {
    api.get<PaginatedResponse<UserDTO>>(`${API_ENDPOINTS.admin.users}?limit=1000`)
      .then(({ data }) => setAllUsers(data.data))
      .catch(() => {});
  }, []);

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
    setDialogOpen(true);

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
    try {
      if(dialogMode === "edit" && selected) {
        await api.patch(API_ENDPOINTS.adminPlaylists.detail(selected.id), {
          title:           form.title,
          isPublic:        form.isPublic,
          isCollaborative: form.isCollaborative,
          userId:          form.userId,
        });
      }
      await reload();
      setDialogOpen(false);
      toast.success(t("toastSaved"));
    } catch (err) {
      toast.error(parseAxiosError(err));
    }
  };

  const remove = async (playlist: PlaylistDto) => {
    if(!confirm(`${t("deletePlaylistQuestion")} "${playlist.title}"?`))
      return;

    try {
      await api.delete(API_ENDPOINTS.adminPlaylists.detail(playlist.id));
      await reload();
      if(selected?.id === playlist.id) {
        setDialogOpen(false);
        setSelected(null);
      }
      toast.success(t("toastDeleted"));
    } catch (err) {
      toast.error(parseAxiosError(err));
    }
  };

  const columns = [
    { label: t("id"),              sortKey: "id", hiddenOnMobile: true },
    { label: t("title"),           sortKey: "title", filter: { type: "text" as const } },
    { label: t("owner"),           sortKey: "userId" },
    { label: t("isPublic") },
    { label: t("isCollaborative"), hiddenOnMobile: true },
    { label: t("trackCount"),      hiddenOnMobile: true },
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
          {refreshing ? <AdminSpinner size="sm" /> : <RotateCcw size={18} />}
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
              className="hover:bg-base-200 transition-colors cursor-pointer"
              onClick={() => void openView(playlist)}
            >
              <td className="hidden sm:table-cell">{playlist.id}</td>
              <td className="font-medium max-w-[200px] truncate">{playlist.title}</td>
              <td>{playlist.ownerDisplayName ?? playlist.userId}</td>
              <td>
                <span className={`badge badge-xs ${playlist.isPublic ? "badge-success" : "badge-ghost"}`}>
                  {playlist.isPublic ? "✓" : "✗"}
                </span>
              </td>
              <td className="hidden sm:table-cell">
                <span className={`badge badge-xs ${playlist.isCollaborative ? "badge-warning" : "badge-ghost"}`}>
                  {playlist.isCollaborative ? "✓" : "✗"}
                </span>
              </td>
              <td className="hidden sm:table-cell">{playlist.trackCount}</td>
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
            <AdminSpinner />
          </div>
        ) : dialogMode === "view" && selected ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 rounded-lg bg-base-300/50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-info/15 text-info">
                <ListMusic size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base truncate">{selected.title}</div>
                <div className="text-xs text-base-content/60">{selected.ownerDisplayName ?? `userId ${selected.userId}`}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selected.isPublic && <span className="badge badge-sm badge-info">Public</span>}
                  {!selected.isPublic && <span className="badge badge-sm bg-base-content/20 text-base-content/80">Private</span>}
                  {selected.isCollaborative && <span className="badge badge-sm badge-warning">Collaborative</span>}
                </div>
              </div>
              <div className="text-xs text-base-content/40 self-start">#{selected.id}</div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <AdminDetailField label={t("trackCount")} value={selected.trackCount} block />
              <AdminDetailField label={t("owner")} value={selected.ownerDisplayName ?? selected.userId} block />
            </div>

            {/* Tracklist */}
            {selected.tracks && selected.tracks.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold text-base-content/70">{t("tracks")}:</div>
                <div className="rounded border border-base-300 bg-base-200 p-2 text-xs leading-relaxed max-h-48 overflow-y-auto space-y-1">
                  {selected.tracks.map((pt) => (
                    <div key={pt.track.id} className="flex items-center gap-2 text-base-content">
                      <span className="text-base-content/40 w-5 text-right">{pt.position}.</span>
                      <span className="font-medium">{pt.track.title}</span>
                      <span className="text-base-content/40">— {pt.track.artists.map((a) => a.displayName).join(", ")}</span>
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
            <fieldset className="fieldset">
              <legend className="text-sm font-medium">{t("owner")}</legend>
              <select
                className="select select-bordered w-full text-sm"
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: Number(e.target.value) }))}
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                ))}
              </select>
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
