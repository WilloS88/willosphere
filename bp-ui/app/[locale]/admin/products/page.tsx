"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Barcode, Package, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { ProductDto } from "@/app/types/product";
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

type ProductForm = {
  name:        string;
  type:        "physical" | "digital";
  description: string;
  price:       string;
  artistId:    string;
  trackId:     string;
  albumId:     string;
};

const emptyForm = (): ProductForm => ({
  name:        "",
  type:        "digital",
  description: "",
  price:       "",
  artistId:    "",
  trackId:     "",
  albumId:     "",
});

function formFromProduct(p: ProductDto): ProductForm {
  return {
    name:        p.name,
    type:        p.type,
    description: p.description ?? "",
    price:       String(p.price),
    artistId:    String(p.artist.artistId),
    trackId:     p.track  ? String(p.track.id)  : "",
    albumId:     p.album  ? String(p.album.id)  : "",
  };
}

export default function AdminProductsPage() {
  const t                           = useTranslations("Admin");
  const toast                       = useToast();

  const [products, setProducts]     = useState<ProductDto[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [sortBy, setSortBy]         = useState<string | undefined>();
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [filters, setFilters]       = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen]       = useState(false);
  const [dialogMode, setDialogMode]       = useState<"create" | "edit" | "view">("view");
  const [selected, setSelected]           = useState<ProductDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm]                   = useState<ProductForm>(emptyForm());
  const [saveError, setSaveError]         = useState<string | null>(null);

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
      const { data } = await api.get<PaginatedResponse<ProductDto>>(
        `${API_ENDPOINTS.adminProducts.list}?${params}`,
      );
      setProducts(data.data);
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

  const openCreate = () => {
    setForm(emptyForm());
    setSelected(null);
    setSaveError(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openView = async (product: ProductDto) => {
    setDialogMode("view");
    setSelected(null);
    setDialogOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await api.get<ProductDto>(API_ENDPOINTS.adminProducts.detail(product.id));
      setSelected(data);
      setForm(formFromProduct(data));
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (product?: ProductDto) => {
    const base = product ?? selected;
    if(!base)
      return;

    setSaveError(null);
    setDialogMode("edit");
    setDialogOpen(true);

    if(!selected || selected.id !== base.id) {
      setDetailLoading(true);
      try {
        const { data } = await api.get<ProductDto>(API_ENDPOINTS.adminProducts.detail(base.id));
        setSelected(data);
        setForm(formFromProduct(data));
      } finally {
        setDetailLoading(false);
      }
    } else {
      setForm(formFromProduct(selected));
    }
  };

  const buildPayload = () => ({
    name:        form.name,
    type:        form.type,
    description: form.description || undefined,
    price:       parseFloat(form.price),
    artistId:    parseInt(form.artistId, 10),
    trackId:     form.trackId  ? parseInt(form.trackId, 10)  : undefined,
    albumId:     form.albumId  ? parseInt(form.albumId, 10)  : undefined,
  });

  const save = async () => {
    setSaveError(null);
    try {
      if (dialogMode === "create") {
        await api.post(API_ENDPOINTS.adminProducts.list, buildPayload());
      } else if (dialogMode === "edit" && selected) {
        await api.patch(API_ENDPOINTS.adminProducts.detail(selected.id), buildPayload());
      }
      await reload();
      setDialogOpen(false);
      toast.success(t("toastSaved"));
    } catch (err) {
      const msg = parseAxiosError(err);
      setSaveError(msg);
      toast.error(msg);
    }
  };

  const remove = async (product: ProductDto) => {
    if(!confirm(`${t("deleteProductQuestion")} "${product.name}"?`))
      return;

    try {
      await api.delete(API_ENDPOINTS.adminProducts.detail(product.id));
      await reload();
      if (selected?.id === product.id) { setDialogOpen(false); setSelected(null); }
      toast.success(t("toastDeleted"));
    } catch (err) {
      toast.error(parseAxiosError(err));
    }
  };

  const columns = [
    { label: t("id"),          sortKey: "id" },
    { label: t("productName"), sortKey: "name",   filter: { type: "text" as const } },
    { label: t("productType"),                    filter: { type: "enum" as const, options: [{ value: "digital", label: t("digital") }, { value: "physical", label: t("physical") }] }, filterKey: "type" },
    { label: t("price"),       sortKey: "price" },
    { label: t("artists"),                        filter: { type: "text" as const, placeholder: "ID" }, filterKey: "artistId" },
    { label: "Track / Album" },
    { label: t("operations"),  align: "center" as const },
  ];

  const typeBadge = (type: "physical" | "digital") => (
    <span className={`badge badge-xs ${type === "physical" ? "badge-warning" : "badge-info"}`}>
      {t(type)}
    </span>
  );

  const dialogTitle =
    dialogMode === "create" ? t("newProduct") :
    dialogMode === "edit"   ? t("editProduct") :
    t("detailProduct");

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader
        icon={<Barcode size={18} />}
        title={t("products")}
      >
        <button className="btn btn-sm btn-info text-white" onClick={openCreate}>
          <Plus size={18} /> {t("newProduct")}
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
          empty={products.length === 0 && !loading}
          emptyText={t("noProducts")}
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
          {products.map((product) => (
            <tr
              key={product.id}
              className="hover:bg-base-200 transition-colors cursor-pointer"
              onClick={() => void openView(product)}
            >
              <td>{product.id}</td>
              <td className="font-medium max-w-[180px] truncate">{product.name}</td>
              <td>{typeBadge(product.type)}</td>
              <td>{product.price} CZK</td>
              <td className="text-sm">{product.artist.displayName}</td>
              <td className="text-xs text-gray-500">
                {product.track ? `T: ${product.track.title}` : ""}
                {product.track && product.album ? " / " : ""}
                {product.album ? `A: ${product.album.title}` : ""}
                {!product.track && !product.album ? "—" : ""}
              </td>
              <td className="text-center">
                <button className="btn btn-xs btn-info mr-1" onClick={(e) => { e.stopPropagation(); void openEdit(product); }}>
                  <Pencil size={14} color="#fff" />
                </button>
                <button className="btn btn-xs btn-error" onClick={(e) => { e.stopPropagation(); void remove(product); }}>
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
        maxWidthClass="max-w-xl"
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
                <Package size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base truncate">{selected.name}</div>
                <div className="text-xs text-base-content/60 truncate">{selected.artist.displayName}</div>
                <div className="mt-1.5">{typeBadge(selected.type)}</div>
              </div>
              <div className="text-xs text-base-content/40 self-start">#{selected.id}</div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <AdminDetailField label={t("price")} value={`${selected.price} CZK`} block />
              <AdminDetailField label={t("createdAt")} value={new Date(selected.createdAt).toLocaleString()} block />
              {selected.track && (
                <AdminDetailField label={t("linkedTrack")} value={`#${selected.track.id} – ${selected.track.title}`} block />
              )}
              {selected.album && (
                <AdminDetailField label={t("linkedAlbum")} value={`#${selected.album.id} – ${selected.album.title}`} block />
              )}
            </div>

            {/* Description */}
            {selected.description && (
              <AdminDetailField label={t("productDescription")} value={selected.description} block />
            )}
          </div>
        ) : (
          <form className="space-y-3">
            {saveError && (
              <div className="alert alert-error text-sm py-2">{saveError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("productName")} *</legend>
                <input className="input input-bordered w-full text-sm" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("productType")} *</legend>
                <select className="select select-bordered w-full text-sm" value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "physical" | "digital" }))}>
                  <option value="digital">{t("digital")}</option>
                  <option value="physical">{t("physical")}</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("price")} *</legend>
                <input type="number" min={0} step={0.01} className="input input-bordered w-full text-sm" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset col-span-2">
                <legend className="text-sm font-medium">{t("productDescription")}</legend>
                <textarea className="textarea textarea-bordered w-full text-sm" rows={2} value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("artistId")} *</legend>
                <input type="number" min={1} className="input input-bordered w-full text-sm" value={form.artistId}
                  onChange={(e) => setForm((f) => ({ ...f, artistId: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("linkedTrack")}</legend>
                <input type="number" min={1} className="input input-bordered w-full text-sm" value={form.trackId}
                  onChange={(e) => setForm((f) => ({ ...f, trackId: e.target.value }))} placeholder="ID" />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="text-sm font-medium">{t("linkedAlbum")}</legend>
                <input type="number" min={1} className="input input-bordered w-full text-sm" value={form.albumId}
                  onChange={(e) => setForm((f) => ({ ...f, albumId: e.target.value }))} placeholder="ID" />
              </fieldset>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
