"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Package, RotateCcw } from "lucide-react";
import type { PurchaseDto } from "@/app/types/order";
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
    { label: t("purchaseDate"), sortKey: "purchaseDate",  filter: { type: "text" as const, placeholder: "YYYY-MM-DD" }, filterKey: "from" },
    { label: t("totalPrice"),   sortKey: "totalPrice" },
    { label: t("currency") },
    { label: t("itemCount") },
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
          {refreshing ? <span className="loading loading-spinner loading-sm" /> : <RotateCcw size={18} />}
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
          onSortChange={handleSortChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={handlePageChange}
        >
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-stone-200 transition-colors cursor-pointer"
              onClick={() => void openView(order)}
            >
              <td>{order.id}</td>
              <td>{order.userId}</td>
              <td>{new Date(order.purchaseDate).toLocaleString()}</td>
              <td className="font-medium">{order.totalPrice} {order.currencyCode}</td>
              <td>{order.currencyCode}</td>
              <td>{order.items.length}</td>
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
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : selected ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <AdminDetailField label={t("id")}           value={selected.id} />
              <AdminDetailField label={t("owner")}        value={`userId: ${selected.userId}`} />
              <AdminDetailField label={t("purchaseDate")} value={new Date(selected.purchaseDate).toLocaleString()} />
              <AdminDetailField label={t("totalPrice")}   value={`${selected.totalPrice} ${selected.currencyCode}`} />
            </div>

            <div>
              <div className="font-semibold text-gray-600 mb-2">
                {t("orderItems")} ({selected.items.length})
              </div>
              <div className="overflow-x-auto">
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
                        <td className="text-gray-500">{item.artist.displayName}</td>
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
