"use client";

import { memo, useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShoppingCart, X, Music, Disc3, Package, Zap, Check } from "lucide-react";
import { CardGrid, PageHeader, SectionLabel, VHSButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useToast } from "@/app/context/ToastContext";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addItem } from "@/lib/features/cart/cartSlice";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { ProductDto } from "@/app/types/product";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

// ── Skeleton card
const SkeletonCard = memo(function SkeletonCard({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "bg-royalblue/10" : "bg-[#a89888]/20";
  return (
    <div className={`rounded border animate-pulse ${isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#a89888]/40"}`}>
      <div className={`h-36 w-full ${bg} rounded-t`} />
      <div className="p-3 space-y-2">
        <div className={`h-3 w-2/3 rounded ${bg}`} />
        <div className={`h-2 w-1/2 rounded ${bg}`} />
        <div className={`h-7 w-full rounded ${bg}`} />
      </div>
    </div>
  );
});

// ── Product card
const ProductCard = memo(function ProductCard({
  product, isDark, inCart, onAdd, onDetail,
}: {
  product: ProductDto; isDark: boolean; inCart: boolean;
  onAdd: (p: ProductDto) => void; onDetail: (p: ProductDto) => void;
}) {
  const t         = useTranslations("Store");
  const borderCls = isDark
    ? "bg-vhs-card border-royalblue/20 hover:border-fear/40"
    : "bg-white/80 border-[#a89888]/40 hover:border-[#c4234e]/30";
  const mutedCls  = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const titleCls  = isDark ? "text-vhs-white" : "text-[#2a2520]";
  const typeBadge = product.type === "physical"
    ? "bg-fearyellow/20 text-fearyellow border-fearyellow/30"
    : "bg-vhs-cyan/20 text-vhs-cyan border-vhs-cyan/30";

  return (
    <div
      className={`rounded border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${borderCls}`}
      onClick={() => onDetail(product)}
    >
      <div className={`relative flex h-36 items-center justify-center rounded-t ${isDark ? "bg-royalblue/10" : "bg-[#f0ebe3]"}`}>
        <div className="flex flex-col items-center gap-1 opacity-30">
          <Package size={32} />
          <span className="text-xs tracking-widest font-vcr">{t("product")}</span>
        </div>
        <span className={`absolute top-2 left-2 border rounded-sm px-1.5 py-0.5 text-[11px] font-bold tracking-wider ${typeBadge}`}>
          {product.type === "physical" ? t("physical") : t("digital")}
        </span>
        <span className="absolute top-2 right-2 bg-fear text-white px-1.5 py-0.5 rounded-sm text-xs font-bold">
          {product.price === 0 ? t("free") : `${product.price} CZK`}
        </span>
      </div>

      <div className="px-3 pt-2 pb-3 space-y-1.5">
        <div className={`font-bold text-xs tracking-wider truncate ${titleCls}`}>{product.name}</div>
        <div className={`text-xs tracking-wide truncate ${mutedCls}`}>{product.artist.displayName}</div>
        {(product.track ?? product.album) && (
          <div className={`flex items-center gap-1 text-xs ${mutedCls}`}>
            {product.track  ? <><Music size={9} /><span className="truncate">{product.track.title}</span></> : null}
            {product.album  ? <><Disc3 size={9} /><span className="truncate">{product.album.title}</span></> : null}
          </div>
        )}
        <VHSButton
          variant={inCart ? "success" : "primary"}
          className="w-full mt-1"
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
        >
          {inCart ? <Check size={11} /> : <ShoppingCart size={11} />}
          {inCart ? t("inCart") : t("addToCart")}
        </VHSButton>
      </div>
    </div>
  );
});

// ── Detail modal
const ProductModal = memo(function ProductModal({
  product, isDark, inCart, onAdd, onClose,
}: {
  product: ProductDto; isDark: boolean; inCart: boolean;
  onAdd: (p: ProductDto) => void; onClose: () => void;
}) {
  const t        = useTranslations("Store");
  const mutedCls = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls  = isDark
    ? "bg-vhs-card/95 border-royalblue/30 text-vhs-white"
    : "bg-white border-[#a89888]/60 text-[#2a2520]";

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded border shadow-2xl p-6 ${cardCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={`absolute top-3 right-3 p-1 rounded-sm hover:opacity-70 ${mutedCls}`}>
          <X size={16} />
        </button>

        <SectionLabel className="mb-1">{t("productDetail")}</SectionLabel>
        <h2 className="text-lg font-bold tracking-wider mb-1">{product.name}</h2>
        <div className={`text-xs tracking-widest mb-4 ${mutedCls}`}>{product.artist.displayName}</div>

        <div className="flex gap-2 mb-4">
          <span className={`border rounded-sm px-2 py-1 text-xs font-bold tracking-wider ${
            product.type === "physical" ? "border-fearyellow/40 text-fearyellow" : "border-vhs-cyan/40 text-vhs-cyan"
          }`}>
            {product.type === "physical" ? t("physical") : t("digital")}
          </span>
          <span className="border border-fear/40 text-fear rounded-sm px-2 py-1 text-xs font-bold">
            {product.price === 0 ? t("free") : `${product.price} CZK`}
          </span>
        </div>

        {product.description && (
          <p className={`text-xs leading-relaxed mb-4 ${mutedCls}`}>{product.description}</p>
        )}
        {product.track && (
          <div className={`flex items-center gap-2 text-xs mb-2 ${mutedCls}`}>
            <Music size={12} />
            <span>{t("linkedTrack")}: <strong>{product.track.title}</strong></span>
          </div>
        )}
        {product.album && (
          <div className={`flex items-center gap-2 text-xs mb-4 ${mutedCls}`}>
            <Disc3 size={12} />
            <span>{t("linkedAlbum")}: <strong>{product.album.title}</strong></span>
          </div>
        )}

        <VHSButton variant={inCart ? "success" : "primary"} className="w-full mt-2" onClick={() => onAdd(product)}>
          {inCart ? <Check size={12} /> : <ShoppingCart size={12} />}
          {inCart ? t("inCart") : t("addToCart")}
        </VHSButton>
      </div>
    </div>
  );
});

// ── Page
export default function MerchPage() {
  const t          = useTranslations("Store");
  const { isDark } = useTheme();
  const toast      = useToast();
  const dispatch   = useAppDispatch();
  const cartItems  = useAppSelector((s) => s.cart.items);

  const [products, setProducts]           = useState<ProductDto[]>([]);
  const [total, setTotal]                 = useState(0);
  const [typeFilter, setTypeFilter]       = useState<"all" | "physical" | "digital">("all");
  const [detailProduct, setDetailProduct] = useState<ProductDto | null>(null);
  const [isPending, startTransition]      = useTransition();

  const cartSet = new Set(cartItems.map((i) => i.productId));

  const fetchProducts = useCallback((type: "all" | "physical" | "digital") => {
    startTransition(async () => {
      const params = new URLSearchParams({ limit: "40" });
      if(type !== "all")
        params.set("type", type);

      const { data } = await api.get<PaginatedResponse<ProductDto>>(
        `${API_ENDPOINTS.products.list}?${params}`,
      );
      setProducts(data.data);
      setTotal(data.total);
    });
  }, []);

  useEffect(() => { fetchProducts("all"); }, [fetchProducts]);

  const handleTypeFilter = (type: "all" | "physical" | "digital") => {
    setTypeFilter(type);
    fetchProducts(type);
  };

  const handleAdd = useCallback((product: ProductDto) => {
    dispatch(addItem({
      productId:  product.id,
      name:       product.name,
      price:      product.price,
      artistName: product.artist.displayName,
      type:       product.type,
    }));
    toast.success(`${product.name} – ${t("addedToCart")}`);
    setDetailProduct(null);
  }, [dispatch, toast, t]);

  const mutedCls = isDark ? "text-vhs-muted" : "text-[#635b53]";

  const filterBtn = (type: "all" | "physical" | "digital", label: string) => (
    <button
      key={type}
      onClick={() => handleTypeFilter(type)}
      className={`px-3 py-1 rounded-sm text-xs font-bold tracking-widest transition-all border cursor-pointer uppercase ${
        typeFilter === type
          ? isDark ? "bg-fear border-fear text-white" : "bg-[#c4234e] border-[#c4234e] text-white"
          : isDark ? "border-royalblue/30 text-vhs-muted hover:border-fear/40" : "border-[#a89888]/40 text-[#635b53] hover:border-[#c4234e]/30"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title={t("merchShop")} count={total} />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className={`text-xs tracking-widest uppercase ${mutedCls}`}>{t("filterByType")}:</span>
        {filterBtn("all",      t("allTypes"))}
        {filterBtn("physical", t("physical"))}
        {filterBtn("digital",  t("digital"))}
      </div>

      {isPending ? (
        <CardGrid minWidth={180}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
        </CardGrid>
      ) : products.length === 0 ? (
        <div className={`py-20 text-center text-xs tracking-widest uppercase ${mutedCls}`}>
          <Zap size={24} className="mx-auto mb-3 opacity-30" />
          {t("noProductsFound")}
        </div>
      ) : (
        <CardGrid minWidth={180}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isDark={isDark}
              inCart={cartSet.has(p.id)}
              onAdd={handleAdd}
              onDetail={setDetailProduct}
            />
          ))}
        </CardGrid>
      )}

      {detailProduct && (
        <ProductModal
          product={detailProduct}
          isDark={isDark}
          inCart={cartSet.has(detailProduct.id)}
          onAdd={handleAdd}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </>
  );
}
