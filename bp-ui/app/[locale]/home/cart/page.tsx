"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Minus, Plus, ShoppingCart, Trash2, Zap } from "lucide-react";
import { SectionLabel, VHSButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { removeItem, updateQuantity, clearCart } from "@/lib/features/cart/cartSlice";
import { useToast } from "@/app/context/ToastContext";
import { useConfirm } from "@/app/hooks/useConfirm";

export default function CartPage() {
  const t          = useTranslations("Store");
  const { isDark } = useTheme();
  const { locale } = useParams<{ locale: string }>();
  const dispatch   = useAppDispatch();
  const items      = useAppSelector((s) => s.cart.items);
  const toast      = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const handleClear = async () => {
    const ok = await confirm({
      title:        t("clearAll"),
      message:      t("cartEmpty"),
      confirmLabel: t("clearAll"),
      variant:      "danger",
    });
    if (ok) {
      dispatch(clearCart());
      toast.info(t("toastCartCleared"));
    }
  };

  const total     = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const mutedCls  = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls   = isDark
    ? "bg-vhs-card border-royalblue/20"
    : "bg-white/80 border-[#a89888]/40";
  const dividerCls = isDark ? "border-royalblue/20" : "border-[#a89888]/30";

  if(items.length === 0)
  {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShoppingCart size={48} className="opacity-20" />
        <SectionLabel>{t("cartTitle")}</SectionLabel>
        <p className={`text-xs tracking-widest uppercase ${mutedCls}`}>{t("cartEmpty")}</p>
        <p className={`text-xs ${mutedCls}`}>{t("cartEmptyHint")}</p>
        <Link
          href={`/${locale}/home/merch`}
          className={`mt-2 border rounded-sm px-4 py-2 text-xs font-bold tracking-widest transition-all no-underline uppercase ${
            isDark ? "border-royalblue/40 text-vhs-light hover:border-fear/40" : "border-[#a89888] text-[#524a44] hover:border-[#c4234e]"
          }`}
        >
          {t("goToShop")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <SectionLabel className="mb-1">{t("cartTitle")}</SectionLabel>
          <div className={`text-xs tracking-widest ${mutedCls}`}>
            {items.length} items
          </div>
        </div>
        <button
          onClick={handleClear}
          className={`cursor-pointer rounded-sm border px-3 py-1.5 text-xs tracking-wider transition-opacity hover:opacity-70 uppercase ${
            isDark
              ? "border-royalblue/30 text-vhs-muted"
              : "border-[#a89888]/40 text-[#635b53]"
          }`}
        >
          {t("clearAll")}
        </button>
      </div>

      <div className={`divide-y rounded border ${cardCls} ${dividerCls} mb-4`}>
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 px-4 py-3"
          >
            {/* Type badge */}
            <span
              className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] font-bold tracking-wider ${
                item.type === "physical"
                  ? isDark
                    ? "border-fearyellow/30 text-fearyellow"
                    : "border-amber-400/40 text-amber-600"
                  : isDark
                    ? "border-vhs-cyan/30 text-vhs-cyan"
                    : "border-sky-400/40 text-sky-600"
              }`}
            >
              {item.type === "physical" ? "PHY" : "DIG"}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div
                className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
              >
                {item.name}
              </div>
              <div className={`text-xs ${mutedCls}`}>{item.artistName}</div>
            </div>

            {/* Quantity */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() =>
                  dispatch(
                    updateQuantity({
                      productId: item.productId,
                      quantity: item.quantity - 1,
                    }),
                  )
                }
                className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border hover:opacity-70 ${
                  isDark
                    ? "border-royalblue/30 text-vhs-muted"
                    : "border-[#a89888]/40 text-[#635b53]"
                }`}
              >
                <Minus size={10} />
              </button>
              <span
                className={`w-6 text-center text-xs font-bold ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
              >
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  dispatch(
                    updateQuantity({
                      productId: item.productId,
                      quantity: item.quantity + 1,
                    }),
                  )
                }
                className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border hover:opacity-70 ${
                  isDark
                    ? "border-royalblue/30 text-vhs-muted"
                    : "border-[#a89888]/40 text-[#635b53]"
                }`}
              >
                <Plus size={10} />
              </button>
            </div>

            {/* Price */}
            <div className="text-fear w-20 shrink-0 text-right text-xs font-bold">
              {(item.price * item.quantity).toFixed(2)} CZK
            </div>

            {/* Remove */}
            <button
              onClick={() => { dispatch(removeItem(item.productId)); toast.info(t("toastItemRemoved")); }}
              className={`hover:text-fear shrink-0 cursor-pointer transition-colors ${mutedCls}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div
        className={`rounded border px-4 py-4 ${cardCls} flex items-center justify-between`}
      >
        <div>
          <div className={`mb-1 text-xs tracking-widest uppercase ${mutedCls}`}>
            {t("total")}
          </div>
          <div className="text-fear text-xl font-bold">
            {total.toFixed(2)} CZK
          </div>
        </div>
        <Link href={`/${locale}/home/checkout`}>
          <VHSButton variant="primary" className="px-6 py-2.5">
            <Zap size={12} />
            {t("proceedToCheckout")}
          </VHSButton>
        </Link>
      </div>
      {confirmDialog}
    </div>
  );
}
