"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import PageShell from "@/app/components/layout/PageShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { getRoleRedirect } from "@/lib/auth";

function LoginContent() {
  const t           = useTranslations("Login");
  const { locale }  = useParams<{ locale: string }>();
  const router      = useRouter();
  const { login }   = useAuth();
  const { isDark }  = useStoreTheme();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState]       = useState({ email: "", password: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const user = await login(formState);
      router.push(getRoleRedirect(user, locale));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-[11px] tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className={`w-full max-w-md rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/80"}`}
      >
        <Link
          href={`/${locale}`}
          className={`mb-4 inline-flex items-center gap-1.5 text-[10px] tracking-[2px] no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#8a8578] hover:text-[#c4234e]"}`}
        >
          <ArrowLeft size={12} /> {t("home")}
        </Link>
        <h1
          className={`mb-6 text-center text-xl font-bold tracking-[3px] sm:text-2xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
        >
          {t("header")}
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className={`mb-1.5 block text-[9px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
            >
              {t("email")}
            </label>
            <input
              type="email"
              className={inputCls}
              placeholder={t("emailExample")}
              autoComplete="username"
              value={formState.email}
              required
              onChange={(e) =>
                setFormState((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className={`mb-1.5 block text-[9px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
            >
              {t("password")}
            </label>
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              autoComplete="current-password"
              value={formState.password}
              required
              onChange={(e) =>
                setFormState((p) => ({ ...p, password: e.target.value }))
              }
            />
          </div>

          {errorMessage && (
            <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-[10px] tracking-wider">
              {errorMessage}
            </div>
          )}

          <button
            className={`w-full cursor-pointer rounded-sm py-2.5 text-[11px] font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : t("login")}
          </button>
        </form>

        <div
          className={`my-5 flex items-center gap-3 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
        >
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#c4b8a8]/30"}`}
          />
          <span className="text-[9px] tracking-[2px]">
            {t("or").toUpperCase()}
          </span>
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#c4b8a8]/30"}`}
          />
        </div>

        <div className="text-center text-[11px] tracking-wider">
          <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
            {t("dontHaveAnAccount")}{" "}
          </span>
          <Link
            href={`/${locale}/signup`}
            className={`font-bold no-underline ${isDark ? "text-fear" : "text-[#c4234e]"}`}
          >
            {t("signup")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageShell>
      <LoginContent />
    </PageShell>
  );
}
