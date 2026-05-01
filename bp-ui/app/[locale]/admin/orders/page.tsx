"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Package, RotateCcw, ShoppingCart } from "lucide-react";
import type { PurchaseDto } from "@/app/types/order";
import type { PaginatedResponse } from "@/app/types/pagination";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import {
  AdminDataTable,
  AdminPageHeader,
  AdminDetailField,
  AdminSpinner,
  Dialog,
} from "@/app/components/admin";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const t = useTranslations("Admin");

  const [orders, setOrders]         = useState<PurchaseDto[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [sortBy, setSortBy]         = useState<string | undefined>();
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [filters, setFilters]       = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen]       = useState(false);
  const [selected, setSelected]           = useState<PurchaseDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      const { data } = await api.get<PaginatedResponse<PurchaseDto>>(
        `${API_ENDPOINTS.purchases.list}?${params}`,
      );
      setOrders(data.data);
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

  const openView = async (order: PurchaseDto) => {
    setDialogOpen(true);
    setSelected(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get<PurchaseDto>(API_ENDPOINTS.purchases.detail(order.id));
      setSelected(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { label: t("id"),           sortKey: "id" },
    { label: t("owner"),                                  filter: { type: "text" as const, placeholder: "ID" },         filterKey: "userId" },
    { label: t("purchaseDate"), sortKey: "purchaseDate",  filter: { type: "date" as const }, filterKey: "from", hiddenOnMobile: true },
    { label: t("totalPrice"),   sortKey: "totalPrice" },
    { label: t("currency"),     hiddenOnMobile: true },
    { label: t("itemCount"),    hiddenOnMobile: true },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AdminPageHeader
        icon={<Package size={18} />}
        title={t("orders")}
      >
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
          empty={orders.length === 0 && !loading}
          emptyText={t("noOrders")}
          footer={<span>{t("total")}: {total}</span>}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChangeAction={handleSortChange}
          filters={filters}
          onFilterChangeAction={handleFilterChange}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChangeAction={handlePageChange}
        >
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-base-200 transition-colors cursor-pointer"
              onClick={() => void openView(order)}
            >
              <td>{order.id}</td>
              <td>{order.userId}</td>
              <td className="hidden sm:table-cell">{new Date(order.purchaseDate).toLocaleString()}</td>
              <td className="font-medium">{order.totalPrice} {order.currencyCode}</td>
              <td className="hidden sm:table-cell">{order.currencyCode}</td>
              <td className="hidden sm:table-cell">{order.items.length}</td>
            </tr>
          ))}
        </AdminDataTable>
      </main>

      <Dialog
        open={dialogOpen}
        mode="view"
        title={t("detailOrder")}
        onCloseAction={() => setDialogOpen(false)}
        maxWidthClass="max-w-2xl"
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <AdminSpinner />
          </div>
        ) : selected ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 rounded-lg bg-base-300/50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-info/15 text-info">
                <ShoppingCart size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base">Order #{selected.id}</div>
                <div className="text-xs text-base-content/60">userId: {selected.userId}</div>
                <div className="mt-1.5">
                  <span className="badge badge-sm badge-info">{selected.totalPrice} {selected.currencyCode}</span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <AdminDetailField label={t("purchaseDate")} value={new Date(selected.purchaseDate).toLocaleString()} block />
              <AdminDetailField label={t("totalPrice")} value={`${selected.totalPrice} ${selected.currencyCode}`} block />
            </div>

            {/* Items table */}
            <div>
              <div className="mb-1 text-xs font-semibold text-base-content/70">
                {t("orderItems")} ({selected.items.length})
              </div>
              <div className="overflow-x-auto rounded border border-base-300">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200 text-xs">
                      <th>{t("productName")}</th>
                      <th>{t("artists")}</th>
                      <th>{t("price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item) => (
                      <tr key={item.productId} className="text-xs">
                        <td className="font-medium">{item.name}</td>
                        <td className="text-base-content/60">{item.artist.displayName}</td>
                        <td>{item.price} {selected.currencyCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
