"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

interface Props {
  file: File;
  aspect?: number;
  onSave: (blob: Blob, filename: string) => void;
  onClose: () => void;
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
    width,
    height,
  );
}

async function cropToBlob(image: HTMLImageElement, crop: PixelCrop, mimeType: string): Promise<Blob> {
  const canvas  = document.createElement("canvas");
  const scaleX  = image.naturalWidth  / image.width;
  const scaleY  = image.naturalHeight / image.height;
  canvas.width  = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    crop.x  * scaleX,
    crop.y  * scaleY,
    crop.width  * scaleX,
    crop.height * scaleY,
    0, 0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Canvas is empty")),
      mimeType,
      0.92,
    ),
  );
}

export function ImageCropModal({ file, aspect = 1, onSave, onClose }: Props) {
  const t           = useTranslations("Common");
  const { isDark }  = useStoreTheme();
  const imgRef      = useRef<HTMLImageElement>(null);
  const [src]       = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [applying, setApplying] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }, [aspect]);

  const handleApply = async () => {
    if (!imgRef.current || !completedCrop) return;
    setApplying(true);
    try {
      const blob = await cropToBlob(imgRef.current, completedCrop, file.type);
      onSave(blob, file.name);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`flex w-full max-w-lg flex-col rounded border shadow-2xl ${
          isDark
            ? "bg-vhs-surface border-royalblue/30"
            : "border-[#c4b8a8]/40 bg-white"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`}>
          <span className={`text-[11px] font-bold tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
            {t("cropImage")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-colors ${
              isDark
                ? "border-royalblue/30 text-vhs-muted hover:border-fear/40 hover:text-fear"
                : "border-[#c4b8a8]/40 text-[#8a8578] hover:border-[#c4234e]/40 hover:text-[#c4234e]"
            }`}
          >
            <X size={12} />
          </button>
        </div>

        {/* Crop area */}
        <div className="flex max-h-[60vh] items-center justify-center overflow-auto p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[55vh] max-w-full object-contain"
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className={`flex gap-3 border-t px-4 py-3 ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-sm border py-2 text-[11px] font-bold tracking-[2px] transition-all ${
              isDark
                ? "border-royalblue/30 text-vhs-muted hover:text-vhs-white"
                : "border-[#c4b8a8] text-[#8a8578] hover:text-[#2a2520]"
            }`}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={!completedCrop || applying}
            className={`flex flex-1 items-center justify-center gap-2 rounded-sm py-2 text-[11px] font-bold tracking-[2px] text-white transition-all hover:brightness-110 disabled:opacity-50 ${
              isDark ? "bg-fear" : "bg-[#c4234e]"
            }`}
          >
            <Check size={13} />
            {applying ? t("processing") : t("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
