"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Music2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { GenreDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  AdminDataTable,
  AdminPageHeader,
  Dialog,
} from "@/app/components/admin";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

export default function AdminGenresPage() {
  const t = useTranslations("Admin");

  const [genres, setGenres]       = useState<GenreDto[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState<string | undefined>();
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [filters, setFilters]     = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen]   = useState(false);
  const [dialogMode, setDialogMode]   = useState<"create" | "edit" | "view">("view");
  const [selected, setSelected]       = useState<GenreDto | null>(null);
  const [form, setForm]               = useState({ name: "" });

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

      const { data } = await api.get<PaginatedResponse<GenreDto>>(
        `${API_ENDPOINTS.adminGenres.list}?${params}`,
      );
      setGenres(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, undefined, "asc", {}); }, [load]);

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

  const openCreate = () => {
    setForm({ name: "" });
    setSelected(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openView = (genre: GenreDto) => {
    setSelected(genre);
    setForm({ name: genre.name });
    setDialogMode("view");
    setDialogOpen(true);
  };

  const openEdit = (genre?: GenreDto) => {
    const base = genre ?? selected;
    if (!base)
      return;

    setSelected(base);
    setForm({ name: base.name });
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const save = async () => {
    if (dialogMode === "create") {
      await api.post(API_ENDPOINTS.adminGenres.list, { name: form.name });
    } else if (dialogMode === "edit" && selected) {
      await api.patch(API_ENDPOINTS.adminGenres.detail(selected.id), { name: form.name });
    }
    await reload();
    setDialogOpen(false);
  };

  const remove = async (genre: GenreDto) => {
    if (!confirm(`${t("deleteGenreQuestion")} "${genre.name}"?`))
      return;

    await api.delete(API_ENDPOINTS.adminGenres.detail(genre.id));
    await reload();
    if(selected?.id === genre.id) {
      setDialogOpen(false);
      setSelected(null);
    }
  };

  const columns = [
    { label: t("id"),        sortKey: "id" },
    { label: t("genreName"), sortKey: "name", filter: { type: "text" as const } },
    { label: t("memberSince"), sortKey: "createdAt" },
    { label: t("operations"), align: "center" as const },
  ];

  const dialogTitle =
    dialogMode === "create"
      ? t("newGenre") : dialogMode === "edit"
        ? t("editGenre") : t("detailGenre");

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader icon={<Music2 size={18} />} title={t("genres")}>
        <button className="btn btn-sm btn-info text-white" onClick={openCreate}>
          <Plus size={18} /> {t("newGenre")}
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
          empty={genres.length === 0 && !loading}
          emptyText={t("noGenres")}
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
          {genres.map((genre) => (
            <tr
              key={genre.id}
              className="hover:bg-stone-200 transition-colors cursor-pointer"
              onClick={() => openView(genre)}
            >
              <td>{genre.id}</td>
              <td className="font-medium">{genre.name}</td>
              <td>{new Date(genre.createdAt).toLocaleDateString()}</td>
              <td className="text-center">
                <button
                  className="btn btn-xs btn-info mr-1"
                  onClick={(e) => { e.stopPropagation(); openEdit(genre); }}
                >
                  <Pencil size={14} color="#fff" />
                </button>
                <button
                  className="btn btn-xs btn-error"
                  onClick={(e) => { e.stopPropagation(); void remove(genre); }}
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
        onEdit={dialogMode === "view" ? () => openEdit() : undefined}
      >
        {dialogMode === "view" && selected ? (
          <div className="space-y-3">
            <div className="text-sm"><span className="font-semibold text-gray-600">{t("id")}: </span>{selected.id}</div>
            <div className="text-sm"><span className="font-semibold text-gray-600">{t("genreName")}: </span>{selected.name}</div>
            <div className="text-sm"><span className="font-semibold text-gray-600">{t("memberSince")}: </span>{new Date(selected.createdAt).toLocaleDateString()}</div>
          </div>
        ) : (
          <form className="space-y-3">
            <fieldset className="fieldset">
              <legend className="text-sm font-medium">{t("genreName")}</legend>
              <input
                className="input input-bordered w-full text-sm"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder={t("genreName")}
              />
            </fieldset>
          </form>
        )}
      </Dialog>
    </div>
  );
}
