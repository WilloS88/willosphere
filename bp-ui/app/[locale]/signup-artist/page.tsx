"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mic2, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import api, { parseAxiosError } from "@/lib/axios";
import type { AuthUser } from "@/lib/auth";

function SignupArtistContent() {
  const t                 = useTranslations("SignupArtist");
  const tA                = useTranslations("Artist");
  const { locale }        = useParams<{ locale: string }>();
  const router            = useRouter();
  const { isDark }        = useTheme();
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
  const [error, setError]           = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    if (form.password !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const { data: emailCheck } = await api.get<{ available: boolean }>(
        API_ENDPOINTS.auth.checkEmail,
        { params: { email: form.email.trim() } },
      );
      if (!emailCheck.available) {
        setEmailError(t("emailAlreadyExists"));
        setSubmitting(false);
        return;
      }
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

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-xs tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const labelCls        = `block text-xs tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;
  const sectionHeadCls  = `flex items-center gap-2 mb-4 text-xs font-bold tracking-[2px] ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`;
  const dividerCls      = `my-6 border-t ${isDark ? "border-royalblue/20" : "border-[#a89888]/30"}`;

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-44px)] items-center justify-center px-4 py-10">
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
              isDark ? "text-vhs-muted" : "text-[#635b53]"
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
                className={emailError
                  ? `${inputCls} ${isDark ? "!border-fear" : "!border-[#c4234e]"}`
                  : inputCls}
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => { setEmailError(null); set("email")(e); }}
              />
              {emailError && (
                <p className={`mt-1 text-xs tracking-wider ${isDark ? "text-fear" : "text-[#c4234e]"}`}>
                  {emailError}
                </p>
              )}
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
              className={`mt-2 w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${
                isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"
              }`}
            >
              {submitting ? t("submitting") : t("submit")}
            </button>

            <p
              className={`text-center text-xs tracking-wider ${
                isDark ? "text-vhs-muted" : "text-[#635b53]"
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
