"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mic2, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { parseAxiosError } from "@/lib/axios";
import type { AuthUser } from "@/lib/auth";
import api from "@/lib/axios";

function SignupArtistContent() {
  const t                 = useTranslations("SignupArtist");
  const tA                = useTranslations("Artist");
  const { locale }        = useParams<{ locale: string }>();
  const router            = useRouter();
  const { isDark }        = useStoreTheme();
  const { login }         = useAuth();

  const [form, setForm] = useState({
    email:          "",
    password:       "",
    confirmPassword:"",
    displayName:    "",
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

    if (form.password !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await api.post<{ user: AuthUser }>(API_ENDPOINTS.auth.signupArtist, {
        email:          form.email.trim(),
        password:       form.password,
        displayName:    form.displayName.trim(),
        bio:            form.bio || undefined,
        bannerImageUrl: form.bannerImageUrl || undefined,
        artistSince:    form.artistSince || undefined,
      });
      /* Log in to hydrate session & get cookies */
      await login({ email: form.email.trim(), password: form.password });
      router.push(`/${locale}/artist`);
    } catch (err) {
      setError(parseAxiosError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-[11px] tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;
  const labelCls        = `block text-[11px] tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`;
  const sectionHeadCls  = `flex items-center gap-2 mb-4 text-xs font-bold tracking-[2px] ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`;
  const dividerCls      = `my-6 border-t ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/30"}`;

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-44px)] items-center justify-center px-4 py-10">
        <div
          className={`w-full max-w-lg rounded border p-6 sm:p-8 ${
            isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/80"
          }`}
        >
          <Link
            href={`/${locale}`}
            className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${
              isDark ? "text-vhs-muted hover:text-fear" : "text-[#8a8578] hover:text-[#c4234e]"
            }`}
          >
            <ArrowLeft size={12} /> {tA("back")}
          </Link>

          <h1
            className={`mb-1 text-center text-xl font-bold tracking-[3px] sm:text-2xl ${
              isDark ? "text-fearyellow" : "text-[#c4234e]"
            }`}
          >
            {t("title")}
          </h1>
          <p
            className={`mb-6 text-center text-xs tracking-wider ${
              isDark ? "text-vhs-muted" : "text-[#8a8578]"
            }`}
          >
            {t("subtitle")}
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* ── Account section ── */}
            <div className={sectionHeadCls}>
              <User size={14} />
              {t("sectionAccount")}
            </div>

            <div>
              <label className={labelCls}>{t("email")}</label>
              <input
                type="email"
                autoComplete="email"
                required
                className={inputCls}
                placeholder="you@email.com"
                value={form.email}
                onChange={set("email")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("displayName")}</label>
              <input
                type="text"
                autoComplete="username"
                required
                className={inputCls}
                placeholder={t("displayNamePlaceholder")}
                value={form.displayName}
                onChange={set("displayName")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("password")}</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={3}
                className={inputCls}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("confirmPassword")}</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                className={inputCls}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />
            </div>

            {/* ── Artist section ── */}
            <div className={dividerCls} />

            <div className={sectionHeadCls}>
              <Mic2 size={14} />
              {t("sectionArtist")}
            </div>

            <div>
              <label className={labelCls}>{tA("bio")}</label>
              <textarea
                className={`${inputCls} min-h-[80px] resize-y`}
                placeholder={tA("bioPlaceholder")}
                value={form.bio}
                onChange={set("bio")}
              />
            </div>

            <div>
              <label className={labelCls}>{tA("artistSince")}</label>
              <input
                type="date"
                className={inputCls}
                value={form.artistSince}
                onChange={set("artistSince")}
              />
            </div>

            {/* ── Error & submit ── */}
            {error && (
              <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 w-full cursor-pointer rounded-sm py-2.5 text-[11px] font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${
                isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"
              }`}
            >
              {submitting ? t("submitting") : t("submit")}
            </button>

            <p
              className={`text-center text-xs tracking-wider ${
                isDark ? "text-vhs-muted" : "text-[#8a8578]"
              }`}
            >
              {t("alreadyHaveAccount")}{" "}
              <Link
                href={`/${locale}/login`}
                className={`underline ${isDark ? "text-vhs-cyan hover:text-fearyellow" : "text-[#c4234e]"}`}
              >
                {t("login")}
              </Link>
              {" · "}
              <Link
                href={`/${locale}/signup`}
                className={`underline ${isDark ? "text-vhs-cyan hover:text-fearyellow" : "text-[#c4234e]"}`}
              >
                {t("signupAsListener")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default function SignupArtistPage() {
  return (
    <PageShell>
      <SignupArtistContent />
    </PageShell>
  );
}
