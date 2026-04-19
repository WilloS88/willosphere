"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, Zap } from "lucide-react";
import { SectionLabel, VHSButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useToast } from "@/app/context/ToastContext";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearCart } from "@/lib/features/cart/cartSlice";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import api from "@/lib/axios";

export default function CheckoutPage() {
  const t          = useTranslations("Store");
  const { isDark } = useTheme();
  const { locale } = useParams<{ locale: string }>();
  const router     = useRouter();
  const toast      = useToast();
  const dispatch   = useAppDispatch();
  const items      = useAppSelector((s) => s.cart.items);

  const [loading, setLoading] = useState(false);

  const total    = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const mutedCls = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls  = isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#a89888]/40";

  // Expand items with quantity (one productId entry per unit)
  const orderItems = items.flatMap((i) =>
    Array.from({ length: i.quantity }, () => ({ productId: i.productId })),
  );

  const placeOrder = async () => {
    if(orderItems.length === 0)
      return;

    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.purchases.create, { items: orderItems });
      dispatch(clearCart());
      toast.success(t("orderSuccess"));
      router.push(`/${locale}/home/orders`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("orderError"));
    } finally {
      setLoading(false);
    }
  };

  if(items.length === 0) {
    router.replace(`/${locale}/home/cart`);
    return null;
  }

  return (
    <div className="max-w-lg mx-auto">
      <SectionLabel className="mb-1">{t("checkoutTitle")}</SectionLabel>
      <h1 className={`text-xl font-bold tracking-widest mb-6 uppercase ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>
        {t("orderSummary")}
      </h1>

      {/* Items list */}
      <div className={`rounded border mb-4 divide-y ${cardCls} ${isDark ? "divide-royalblue/20" : "divide-[#a89888]/30"}`}>
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className={`text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                {item.name}
              </div>
              <div className={`text-xs ${mutedCls}`}>
                {item.artistName}
                {item.quantity > 1 && <span className="ml-2">× {item.quantity}</span>}
              </div>
            </div>
            <div className="text-xs font-bold text-fear">
              {(item.price * item.quantity).toFixed(2)} CZK
            </div>
          </div>
        ))}
      </div>

      {/* Total + button */}
      <div className={`rounded border px-4 py-4 ${cardCls}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-xs tracking-widest uppercase ${mutedCls}`}>{t("total")}</div>
          <div className="text-2xl font-bold text-fear">{total.toFixed(2)} CZK</div>
        </div>
        <VHSButton
          variant="primary"
          className="w-full py-3"
          onClick={placeOrder}
          disabled={loading}
        >
          {loading
            ? <VHSSpinner size="sm" className="text-current" />
            : <><CheckCircle size={14} />{t("placeOrder")}</>
          }
        </VHSButton>
      </div>
    </div>
  );
}
