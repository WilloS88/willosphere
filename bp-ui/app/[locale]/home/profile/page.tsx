"use client";

import Link from "next/link";
import React, { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import {
  PageHeader,
  Badge,
  SectionLabel,
} from "@/app/components/ui/elastic-slider/StoreUI";
import { ImageCropModal } from "@/app/components/ui/ImageCropModal";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";

export default function ProfilePage() {
  const t                         = useTranslations("Store");
  const { locale }                = useParams<{ locale: string }>();
  const { session, refreshSession } = useAuth();
  const { isDark }                = useTheme();
  const user                      = session?.user;
  const avatarInputRef            = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile]   = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCropFile(file);
  };

  const uploadCroppedAvatar = async (blob: Blob, filename: string) => {
    setCropFile(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", new File([blob], filename, { type: blob.type }));
      const res = await fetch("/api/avatars/upload", { method: "POST", body: formData });
      if(!res.ok)
        throw new Error("Upload failed");

      const { key } = await res.json() as { key: string };
      await api.patch(API_ENDPOINTS.auth.me, { profileImageUrl: key });
      await refreshSession();
    } catch {
      // silent — avatar update is non-critical
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          onSave={(blob, filename) => void uploadCroppedAvatar(blob, filename)}
          onClose={() => setCropFile(null)}
        />
      )}
      <PageHeader title={t("nav_profile")} />

      <div
        className={`max-w-2xl rounded border p-5 sm:p-8 ${
          isDark
            ? "bg-vhs-card border-royalblue/20"
            : "border-[#a89888]/40 bg-white/80"
        }`}
      >
        {/* Avatar + name */}
        <div className="mb-6 flex items-center gap-4">
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="group relative shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0 disabled:opacity-60"
            title="Change profile picture"
          >
            <div className="from-fear to-vhs-purple border-fear/40 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl overflow-hidden">
              {uploading ? (
                <VHSSpinner className="text-white" />
              ) : (user as any)?.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(user as any).profileImageUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={16} className="text-white" />
            </div>
          </button>
          <div>
            <div
              className={`text-base font-bold tracking-[2px] sm:text-lg ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
            >
              {user?.displayName ?? t("guestUser")}
            </div>
            <div
              className={`text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {user?.email ?? "not@logged.in"}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {user?.roles?.map((r, i) => (
                <Badge key={i} variant="cyan" className="text-[11px]">
                  {typeof r === "string"
                    ? r.toUpperCase()
                    : r.role.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`space-y-3 border-t pt-4 ${isDark ? "border-royalblue/20" : "border-[#a89888]/20"}`}
        >
          <SectionLabel>{t("accountInfo")}</SectionLabel>

          {[
            [t("idLabel"), user?.id ?? "—"],
            [t("emailLabel"), user?.email ?? "—"],
            [t("displayNameLabel"), user?.displayName ?? "—"],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs ${
                isDark ? "bg-royalblue/10" : "bg-[#ede7db]/60"
              }`}
            >
              <span className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>
                {label}
              </span>
              <span className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>

        <div
          className={`mt-4 space-y-3 border-t pt-4 ${isDark ? "border-royalblue/20" : "border-[#a89888]/20"}`}
        >
          <SectionLabel>{t("securitySection")}</SectionLabel>

          <Link
            href={`/${locale}/home/profile/mfa`}
            className={`flex items-center justify-between rounded px-3 py-2.5 text-xs no-underline transition-all ${
              isDark
                ? "bg-royalblue/10 hover:bg-royalblue/20 text-vhs-white"
                : "bg-[#ede7db]/60 hover:bg-[#ede7db] text-[#2a2520]"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className={isDark ? "text-fear" : "text-[#c4234e]"} />
              <span className="tracking-wider">{t("mfaLabel")}</span>
            </div>
            <span className={`flex items-center gap-1 text-xs tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
              {t("mfaManage")}
              <ArrowRight size={12} />
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
