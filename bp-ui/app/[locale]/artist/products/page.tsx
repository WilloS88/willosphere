"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Disc3, Music, Package, Pencil, Plus, Trash2 } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { ProductDto } from "@/app/types/product";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function ProductsContent() {
  const t           = useTranslations("Artist");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useTheme();
  const { session } = useAuth();
  const userId      = session?.user?.id ?? null;

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    if(!userId) {
      setLoading(false);
      return;
    }

    api.get<PaginatedResponse<ProductDto>>(`${API_ENDPOINTS.products.list}?artistId=${userId}&limit=50`)
      .then(({ data }) => setProducts(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  const remove = async (id: number, name: string) => {
    if(!confirm(`Delete "${name}"?`))
      return;

    try {
      await api.delete(API_ENDPOINTS.products.detail(id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Cannot delete product");
    }
  };

  const mutedCls = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls  = isDark
    ? "bg-vhs-card/60 border-royalblue/20"
    : "border-[#a89888]/30 bg-white/70";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <SectionLabel className="mb-1">{t("myProducts")}</SectionLabel>
            <h1
              className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
            >
              {t("products")}
            </h1>
          </div>
          <Link
            href={`/${locale}/artist/products/new`}
            className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-bold tracking-[2px] no-underline transition-all ${
              isDark
                ? "border-fear/40 bg-fear/10 text-fear hover:bg-fear/20"
                : "border-[#c4234e]/40 bg-[#c4234e]/5 text-[#c4234e] hover:bg-[#c4234e]/10"
            }`}
          >
            <Plus size={12} /> {t("addProduct")}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span
              className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}
            />
          </div>
        ) : products.length === 0 ? (
          <div className={`rounded border p-10 text-center ${cardCls}`}>
            <Package
              size={32}
              className={`mx-auto mb-3 opacity-30 ${mutedCls}`}
            />
            <div className={`text-xs tracking-widest ${mutedCls}`}>
              {t("noProducts")}
            </div>
            <Link
              href={`/${locale}/artist/products/new`}
              className={`mt-4 inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-xs font-bold tracking-widest no-underline ${
                isDark
                  ? "border-royalblue/30 text-vhs-light hover:border-fear/40"
                  : "border-[#a89888] text-[#524a44]"
              }`}
            >
              <Plus size={11} /> {t("createProduct")}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-4 rounded border px-4 py-3 ${cardCls}`}
              >
                {/* Type badge */}
                <span
                  className={`shrink-0 rounded-sm border px-2 py-0.5 text-[11px] font-bold tracking-wider ${
                    product.type === "physical"
                      ? isDark
                        ? "border-fearyellow/40 text-fearyellow"
                        : "border-amber-400/40 text-amber-600"
                      : isDark
                        ? "border-vhs-cyan/40 text-vhs-cyan"
                        : "border-sky-400/40 text-sky-600"
                  }`}
                >
                  {product.type.toUpperCase()}
                </span>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                  >
                    {product.name}
                  </div>
                  <div
                    className={`flex items-center gap-3 text-xs ${mutedCls}`}
                  >
                    {product.track && (
                      <span className="flex items-center gap-1">
                        <Music size={9} />
                        {product.track.title}
                      </span>
                    )}
                    {product.album && (
                      <span className="flex items-center gap-1">
                        <Disc3 size={9} />
                        {product.album.title}
                      </span>
                    )}
                    {!product.track && !product.album && (
                      <span>No linked item</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-fear shrink-0 text-xs font-bold">
                  {product.price === 0 ? "FREE" : `${product.price} CZK`}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/${locale}/artist/products/${product.id}/edit`}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-opacity hover:opacity-70 ${
                      isDark
                        ? "border-royalblue/30 text-vhs-muted"
                        : "border-[#a89888]/40 text-[#635b53]"
                    }`}
                  >
                    <Pencil size={12} />
                  </Link>
                  <button
                    onClick={() => remove(product.id, product.name)}
                    className={`hover:border-fear/40 hover:text-fear flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border transition-all ${
                      isDark
                        ? "border-royalblue/30 text-vhs-muted"
                        : "border-[#a89888]/40 text-[#635b53]"
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ArtistProductsPage() {
  return (
    <PageShell>
      <ProductsContent />
    </PageShell>
  );
}
