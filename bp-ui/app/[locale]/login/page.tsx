"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import React, { useState, useRef, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PageShell from "@/app/components/layout/PageShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import { getRoleRedirect } from "@/lib/auth";
import { parseAxiosError } from "@/lib/axios";

function MfaCodeInput({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if(!/^\d?$/.test(char))
      return;

    const arr = value.split("");
    arr[idx] = char;
    const next = arr.join("").slice(0, 6);
    onChange(next);

    if(char && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if(e.key === "Backspace" && !value[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`font-vcr h-12 w-10 rounded-sm border text-center text-lg font-bold tracking-widest transition-all outline-none ${
            isDark
              ? "bg-darkblue/60 border-royalblue/30 text-vhs-white focus:border-fear"
              : "border-[#a89888]/40 bg-[#ede7db]/80 text-[#2a2520] focus:border-[#c4234e]"
          }`}
        />
      ))}
    </div>
  );
}

function LoginContent() {
  const t                       = useTranslations("Login");
  const { locale }              = useParams<{ locale: string }>();
  const router                  = useRouter();
  const { login, verifyLogin }  = useAuth();
  const { isDark }              = useTheme();

  const schema = z.object({
    email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  // MFA challenge state
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode]               = useState("");
  const [mfaSubmitting, setMfaSubmitting]    = useState(false);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const result = await login(data);

      if (result.mfaRequired) {
        setMfaChallengeId(result.challengeId);
        setMfaCode("");
      } else {
        router.push(getRoleRedirect(result.user, locale));
      }
    } catch (error) {
      setServerError(parseAxiosError(error));
    }
  };

  const handleMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mfaCode.length !== 6 || !mfaChallengeId) return;

    setServerError(null);
    setMfaSubmitting(true);
    try {
      const user = await verifyLogin({
        challengeId: mfaChallengeId,
        code: mfaCode,
      });
      router.push(getRoleRedirect(user, locale));
    } catch (error) {
      setServerError(parseAxiosError(error));
      setMfaCode("");
    } finally {
      setMfaSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaChallengeId(null);
    setMfaCode("");
    setServerError(null);
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-sm tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const inputErrCls = `${inputCls} ${isDark ? "!border-fear" : "!border-[#c4234e]"}`;
  const fieldErrCls = `mt-1 text-[11px] tracking-wider ${isDark ? "text-fear" : "text-[#c4234e]"}`;

  if(mfaChallengeId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className={`w-full max-w-md rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"}`}
        >
          <button
            onClick={handleBackToLogin}
            className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-[2px] cursor-pointer bg-transparent border-none ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"}`}
          >
            <ArrowLeft size={12} /> {t("home")}
          </button>

          <div className="flex flex-col items-center mb-6">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isDark ? "bg-fear/10" : "bg-[#c4234e]/10"}`}
            >
              <ShieldCheck
                size={24}
                className={isDark ? "text-fear" : "text-[#c4234e]"}
              />
            </div>
            <h1
              className={`text-center text-xl font-bold tracking-[3px] sm:text-2xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
            >
              {t("mfaTitle")}
            </h1>
            <p
              className={`mt-2 text-center text-xs tracking-[1.5px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {t("mfaDescription")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleMfaSubmit}>
            <MfaCodeInput value={mfaCode} onChange={setMfaCode} isDark={isDark} />

            {serverError && (
              <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider text-center">
                {serverError}
              </div>
            )}

            <button
              className={`w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
              disabled={mfaSubmitting || mfaCode.length !== 6}
            >
              {mfaSubmitting ? "..." : t("mfaVerify")}
            </button>
          </form>

          <p
            className={`mt-4 text-center text-[9px] tracking-[1.5px] ${isDark ? "text-vhs-muted/60" : "text-[#635b53]/60"}`}
          >
            {t("mfaExpiry")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className={`w-full max-w-md rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"}`}
      >
        <Link
          href={`/${locale}`}
          className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"}`}
        >
          <ArrowLeft size={12} /> {t("home")}
        </Link>
        <h1
          className={`mb-6 text-center text-xl font-bold tracking-[3px] sm:text-2xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
        >
          {t("header")}
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              className={`mb-1.5 block text-xs tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {t("email")}
            </label>
            <input
              type="email"
              className={errors.email ? inputErrCls : inputCls}
              placeholder={t("emailExample")}
              autoComplete="username"
              {...register("email")}
            />
            {errors.email && (
              <p className={fieldErrCls}>{errors.email.message}</p>
            )}
          </div>
          <div>
            <label
              className={`mb-1.5 block text-xs tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {t("password")}
            </label>
            <input
              type="password"
              className={errors.password ? inputErrCls : inputCls}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className={fieldErrCls}>{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider">
              {serverError}
            </div>
          )}

          <button
            className={`w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : t("login")}
          </button>
        </form>

        <div
          className={`my-5 flex items-center gap-3 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
        >
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#a89888]/30"}`}
          />
          <span className="text-xs tracking-[2px]">
            {t("or").toUpperCase()}
          </span>
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#a89888]/30"}`}
          />
        </div>

        <div className="text-center text-xs tracking-wider">
          <span className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>
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
