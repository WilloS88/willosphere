"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mic2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { parseAxiosError } from "@/lib/axios";
import type { ArtistDto } from "@/app/types/user";
import api from "@/lib/axios";

function CreateArtistContent() {
  const t                   = useTranslations("Artist");
  const { locale }          = useParams<{ locale: string }>();
  const router              = useRouter();
  const { isDark }          = useTheme();
  const { refreshSession }  = useAuth();

  const [form, setForm] = useState({
    bio:            "",
    bannerImageUrl: "",
    artistSince:    "",
  });
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post<ArtistDto>(API_ENDPOINTS.artists.become, {
        bio:            form.bio || undefined,
        bannerImageUrl: form.bannerImageUrl || undefined,
        artistSince:    form.artistSince || undefined,
      });
      await refreshSession();
      router.push(`/${locale}/artist`);
    } catch (err) {
      setError(parseAxiosError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-xs tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-xs tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-44px)] items-center justify-center px-4 py-8">
        <div
          className={`w-full max-w-lg rounded border p-6 sm:p-8 ${
            isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"
          }`}
        >
          <Link
            href={`/${locale}`}
            className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${
              isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
            }`}
          >
            <ArrowLeft size={12} /> {t("back")}
          </Link>

          <div className={`mb-2 flex items-center justify-center gap-2 text-xs font-bold tracking-[3px] ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
            <Mic2 size={14} />
            {t("forExistingUsers")}
          </div>

          <h1
            className={`mb-6 text-center text-xl font-bold tracking-[3px] sm:text-2xl ${
              isDark ? "text-fearyellow" : "text-[#c4234e]"
            }`}
          >
            {t("createArtistProfile")}
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className={labelCls}>{t("bio")}</label>
              <textarea
                className={`${inputCls} min-h-[100px] resize-y`}
                placeholder={t("bioPlaceholder")}
                value={form.bio}
                onChange={set("bio")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("artistSince")}</label>
              <input
                type="date"
                className={inputCls}
                value={form.artistSince}
                onChange={set("artistSince")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("bannerImageUrl")}</label>
              <input
                type="url"
                className={inputCls}
                placeholder="https://..."
                value={form.bannerImageUrl}
                onChange={set("bannerImageUrl")}
              />
            </div>

            {error && (
              <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${
                isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"
              }`}
            >
              {submitting ? t("creating") : t("createArtistProfile")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function CreateArtistPage() {
  return (
    <PageShell>
      <CreateArtistContent />
    </PageShell>
  );
}
