"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { parseAxiosError } from "@/lib/axios";
import type { ArtistDto } from "@/app/types/user";
import api from "@/lib/axios";

function ProfileContent() {
  const t             = useTranslations("Artist");
  const { locale }    = useParams<{ locale: string }>();
  const { isDark }    = useTheme();
  const { session }   = useAuth();
  const user          = session?.user;

  const [profile, setProfile]         = useState<ArtistDto | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  const [form, setForm] = useState({
    bio:            "",
    bannerImageUrl: "",
    artistSince:    "",
  });

  useEffect(() => {
    if (!user?.id)
      return;

    api.get<ArtistDto>(API_ENDPOINTS.artists.detail(user.id))
      .then(({ data }) => {
        setProfile(data);
        setForm({
          bio:            data.bio ?? "",
          bannerImageUrl: data.bannerImageUrl ?? "",
          artistSince:    data.artistSince ?? "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { data } = await api.patch<ArtistDto>(API_ENDPOINTS.artists.me, {
        bio:            form.bio || null,
        bannerImageUrl: form.bannerImageUrl || null,
        artistSince:    form.artistSince || null,
      });
      setProfile(data);
      setSuccessMsg(t("changesSaved"));
    } catch (err) {
      setErrorMsg(parseAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-xs tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const disabledCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-xs tracking-wider font-vcr ${
    isDark
      ? "bg-darkblue/30 border-royalblue/15 text-vhs-muted"
      : "bg-[#ede7db]/40 border-[#a89888]/20 text-[#635b53]"
  }`;
  const labelCls = `block text-xs tracking-[2px] mb-1.5 uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;

  return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/${locale}/home/artist`}
          className={`mb-6 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline uppercase ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"}`}
        >
          <ArrowLeft size={12} /> {t("backToDashboard")}
        </Link>

        <div
          className={`rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"}`}
        >
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="from-fear to-vhs-purple border-fear/40 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br text-2xl font-bold text-white">
              {user?.displayName?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1
                className={`text-xl font-bold tracking-[3px] ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
              >
                {user?.displayName ?? "ARTIST"}
              </h1>
              <div className="mt-1 flex gap-1.5">
                {user?.roles?.map((r, i) => {
                  const role = typeof r === "string" ? r : r.role;
                  const roleKey = `role${role.charAt(0).toUpperCase()}${role.slice(1).toLowerCase()}` as const;
                  return (
                    <Badge key={i} variant="cyan" className="text-[11px]">
                      {t.has(roleKey) ? t(roleKey).toUpperCase() : role.toUpperCase()}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={`border-t pt-5 ${isDark ? "border-royalblue/20" : "border-[#a89888]/20"}`}
          >
            <SectionLabel className="mb-4">{t("editProfile")}</SectionLabel>

            {loading ? (
              <div className="flex justify-center py-8">
                <VHSSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{t("displayName")}</label>
                  <input
                    type="text"
                    className={disabledCls}
                    defaultValue={user?.displayName ?? ""}
                    disabled
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("email")}</label>
                  <input
                    type="email"
                    className={disabledCls}
                    defaultValue={user?.email ?? ""}
                    disabled
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("bio")}</label>
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-y`}
                    placeholder={t("bioPlaceholder")}
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("artistSince")}</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.artistSince}
                    onChange={(e) => setForm((p) => ({ ...p, artistSince: e.target.value }))}
                  />
                </div>

                {successMsg && (
                  <div
                    className={`rounded border p-2 text-xs tracking-wider ${isDark ? "border-vhs-green/30 bg-vhs-green/10 text-vhs-green" : "border-green-300 bg-green-50 text-green-700"}`}
                  >
                    {successMsg}
                  </div>
                )}

                {errorMsg && (
                  <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 uppercase ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
                >
                  {saving ? t("saving") : t("saveChanges")}
                </button>

                {profile && (
                  <div
                    className={`mt-4 border-t pt-4 text-xs tracking-wider uppercase ${isDark ? "border-royalblue/20 text-vhs-muted" : "border-[#a89888]/20 text-[#635b53]"}`}
                  >
                    {t("memberSince")}: {new Date(profile.memberSince).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
  );
}

export default function ArtistProfilePage() {
  return <ProfileContent />;
}
