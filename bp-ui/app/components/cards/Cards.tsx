"use client";

import { useState } from "react";
import { Play, Download, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Album, MerchItem } from "@/lib/store-data";
import { usePlayer } from "@/app/context/PlayerContext";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { MerchCover } from "@/app/components/covers/Covers";
import { PriceBadge, VHSButton, LikeButton, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import TiltedCard from "@/app/components/ui/react-bits/TiltedCard";

export function AlbumCard({ album, index }: { album: Album; index: number }) {
  const t                                     = useTranslations("Store");
  const [hovered, setHovered]                 = useState(false);
  const { playTrack, likedItems, toggleLike } = usePlayer();
  const { isDark }                            = useStoreTheme();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded overflow-hidden transition-all duration-250 animate-slide-up border hover:-translate-y-0.5 hover:shadow-lg ${
        isDark
          ? "bg-vhs-card border-royalblue/20"
          : "bg-white/80 border-[#c4b8a8]/40"
      }`}
      style={{
        animationDelay: `${index * 0.05}s`,
        borderColor: hovered ? `${album.color}${isDark ? "44" : "55"}` : undefined,
        boxShadow: hovered ? `0 8px 24px ${album.color}${isDark ? "15" : "20"}` : undefined,
      }}
    >
      <div className="relative">
        <TiltedCard
          containerHeight="180px"
          containerWidth="100%"
          imageHeight="160px"
          imageWidth="160px"
          rotateAmplitude={10}
          scaleOnHover={1.05}
          showMobileWarning={false}
          showTooltip={true}
          captionText={`${album.artist} // ${album.year}`}
          displayOverlayContent={true}
          overlayContent={
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); playTrack(index); }}
                className="w-10 h-10 rounded-full bg-fear/90 border-2 border-white cursor-pointer flex items-center justify-center text-white shadow-[0_0_16px_rgba(237,44,94,0.5)] hover:scale-110 transition-transform z-20"
              >
                <Play size={16} />
              </button>
            </div>
          }
          imageSrc={`data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="${album.color}" stop-opacity="0.6"/>
                  <stop offset="50%" stop-color="#253078"/>
                  <stop offset="100%" stop-color="#0b0f2d"/>
                </linearGradient>
              </defs>
              <rect width="300" height="300" fill="url(#g)" rx="12"/>
              <text x="150" y="145" text-anchor="middle" fill="white" font-size="14" font-family="monospace" opacity="0.7">${album.title}</text>
              <text x="150" y="170" text-anchor="middle" fill="${album.color}" font-size="10" font-family="monospace" opacity="0.5">${album.artist}</text>
              <circle cx="150" cy="80" r="30" fill="none" stroke="${album.color}" stroke-opacity="0.3"/>
              <circle cx="150" cy="80" r="20" fill="none" stroke="${album.color}" stroke-opacity="0.2"/>
            </svg>`
          )}`}
          altText={album.title}
        />

        <div className="absolute top-3 right-3 z-10">
          <PriceBadge price={album.price} />
        </div>
      </div>

      <div className="px-3 pt-1 pb-3">
        <div className={`text-xs font-bold tracking-wider mb-0.5 truncate ${
          isDark ? "text-vhs-white" : "text-[#2a2520]"
        }`}>
          {album.title}
        </div>
        <div className={`text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
          {album.artist} // {album.year}
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          <VHSButton variant={album.price === 0 ? "success" : "primary"}>
            {album.price === 0 ? <Download size={11} /> : <ShoppingCart size={11} />}
            {album.price === 0 ? t("download") : t("buyNow")}
          </VHSButton>
          <LikeButton itemId={album.id} liked={likedItems.has(album.id)} onToggle={toggleLike} />
        </div>
      </div>
    </div>
  );
}

export function MerchCard({ item, index }: { item: MerchItem; index: number }) {
  const t                           = useTranslations("Store");
  const [hovered, setHovered]       = useState(false);
  const { likedItems, toggleLike }  = usePlayer();
  const { isDark }                  = useStoreTheme();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded overflow-hidden transition-all duration-250 animate-slide-up border hover:-translate-y-0.5 ${
        isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#c4b8a8]/40"
      }`}
      style={{ animationDelay: `${index * 0.06}s`, borderColor: hovered ? (isDark ? "rgba(244,229,38,0.27)" : "rgba(196,168,0,0.3)") : undefined }}
    >
      <div className="p-2.5 pb-0">
        <MerchCover item={item} index={index} />
        <div className="relative -top-5 float-right mr-1.5">
          <Badge variant="yellow">${item.price.toFixed(2)}</Badge>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className={`text-xs font-bold tracking-wider mb-0.5 ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>{item.title}</div>
        <div className={`text-[11px] tracking-wider mb-2.5 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>{t("by")} {item.artist}</div>
        <div className="flex gap-1.5">
          <VHSButton variant="yellow"><ShoppingCart size={11} /> {t("addToCart")}</VHSButton>
          <LikeButton itemId={item.id} liked={likedItems.has(item.id)} onToggle={toggleLike} />
        </div>
      </div>
    </div>
  );
}
