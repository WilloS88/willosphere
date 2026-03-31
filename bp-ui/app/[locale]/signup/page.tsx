"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useState, useRef, type FormEvent } from "react";
import PageShell from "@/app/components/layout/PageShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { getRoleRedirect } from "@/lib/auth";

function SignupContent() {
  const t           = useTranslations("Registration");
  const { locale }  = useParams<{ locale: string }>();
  const router      = useRouter();
  const { signup }  = useAuth();
  const { isDark }  = useStoreTheme();

  const [formState, setFormState] = useState({
    displayName:      "",
    email:            "",
    password:         "",
    confirmPassword:  "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmRef                      = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (formState.password !== formState.confirmPassword) {
      setErrorMessage(t("passwordsMustMatch"));
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await signup({
        email: formState.email,
        password: formState.password,
        displayName: formState.displayName,
      });
      router.push(getRoleRedirect(user, locale));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Signup failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-sm tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-[11px] tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div
        className={`w-full max-w-md rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/80"}`}
      >
        <Link
          href={`/${locale}`}
          className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#8a8578] hover:text-[#c4234e]"}`}
        >
          <ArrowLeft size={12} /> {t("home")}
        </Link>
        <h1
          className={`mb-6 text-center text-xl font-bold tracking-[3px] sm:text-2xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
        >
          {t("createAnAccount")}
        </h1>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className={labelCls}>{t("displayedName")}</label>
            <input
              type="text"
              className={inputCls}
              placeholder={t("typeDisplayedName")}
              value={formState.displayName}
              required
              onChange={(e) =>
                setFormState((p) => ({ ...p, displayName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>{t("email")}</label>
            <input
              type="email"
              className={inputCls}
              placeholder={t("typeEmail")}
              autoComplete="username"
              value={formState.email}
              required
              onChange={(e) =>
                setFormState((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>{t("password")}</label>
            <input
              type="password"
              className={inputCls}
              placeholder={t("typePassword")}
              autoComplete="new-password"
              value={formState.password}
              required
              onChange={(e) =>
                setFormState((p) => ({ ...p, password: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>{t("confirmPassword")}</label>
            <input
              ref={confirmRef}
              type="password"
              className={inputCls}
              placeholder={t("typeConfirmPassword")}
              autoComplete="new-password"
              value={formState.confirmPassword}
              required
              onChange={(e) =>
                setFormState((p) => ({ ...p, confirmPassword: e.target.value }))
              }
            />
          </div>

          {errorMessage && (
            <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider">
              {errorMessage}
            </div>
          )}

          <button
            className={`mt-2 w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${isDark ? "bg-vhs-purple text-white" : "bg-[#7040c0] text-white"}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : t("signup")}
          </button>
        </form>

        <div
          className={`my-5 flex items-center gap-3 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
        >
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#c4b8a8]/30"}`}
          />
          <span className="text-[11px] tracking-[2px]">
            {t("or").toUpperCase()}
          </span>
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#c4b8a8]/30"}`}
          />
        </div>

        <div className="text-center text-sm tracking-wider">
          <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
            {t("alreadyHaveAnAccount")}{" "}
          </span>
          <Link
            href={`/${locale}/login`}
            className={`font-bold no-underline ${isDark ? "text-fear" : "text-[#c4234e]"}`}
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <PageShell>
      <SignupContent />
    </PageShell>
  );
}
