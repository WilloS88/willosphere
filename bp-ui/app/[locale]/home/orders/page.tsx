"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { PurchaseDto } from "@/app/types/order";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

export default function OrdersPage() {
  const t          = useTranslations("Store");
  const { isDark } = useTheme();

  const [orders, setOrders]     = useState<PurchaseDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get<PaginatedResponse<PurchaseDto>>(`${API_ENDPOINTS.purchases.list}?limit=50`)
      .then(({ data }) => setOrders(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const mutedCls   = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls    = isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#a89888]/40";
  const dividerCls = isDark ? "divide-royalblue/20" : "divide-[#a89888]/30";

  return (
    <div className="max-w-2xl mx-auto">
      <SectionLabel className="mb-1">{t("ordersTitle")}</SectionLabel>
      <h1 className={`text-xl font-bold tracking-widest mb-6 ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>
        {t("ordersTitle")}
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
        </div>
      ) : orders.length === 0 ? (
        <div className={`py-20 text-center ${mutedCls}`}>
          <Package size={32} className="mx-auto mb-3 opacity-20" />
          <div className="text-xs tracking-widest">{t("noOrders")}</div>
          <div className="text-xs mt-1">{t("ordersHint")}</div>
        </div>
      ) : (
        <div className={`rounded border divide-y ${cardCls} ${dividerCls}`}>
          {orders.map((order) => (
            <div key={order.id}>
              {/* Order header row */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggle(order.id)}
              >
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <div className={`text-[11px] tracking-widest mb-0.5 ${mutedCls}`}>{t("orderDate")}</div>
                    <div className={`text-xs font-bold ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                      {new Date(order.purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[11px] tracking-widest mb-0.5 ${mutedCls}`}>{t("orderTotal")}</div>
                    <div className="text-xs font-bold text-fear">
                      {order.totalPrice} {order.currencyCode}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[11px] tracking-widest mb-0.5 ${mutedCls}`}>{t("orderItems")}</div>
                    <div className={`text-xs font-bold ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                      {order.items.length}
                    </div>
                  </div>
                </div>
                <div className={mutedCls}>
                  {expanded.has(order.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Expanded items */}
              {expanded.has(order.id) && (
                <div className={`px-4 pb-3 ${isDark ? "bg-royalblue/5" : "bg-[#faf8f5]"}`}>
                  <div className="space-y-1.5 pt-1">
                    {order.items.map((item) => (
                      <div
                        key={item.productId}
                        className={`flex items-center justify-between text-xs py-1.5 px-3 rounded ${
                          isDark ? "bg-royalblue/10" : "bg-white/70"
                        }`}
                      >
                        <div>
                          <span className={`font-bold ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                            {item.name}
                          </span>
                          <span className={`ml-2 ${mutedCls}`}>— {item.artist.displayName}</span>
                        </div>
                        <span className="font-bold text-fear">{item.price} CZK</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
