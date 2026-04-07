"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PageShell from "@/app/components/layout/PageShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import { getRoleRedirect } from "@/lib/auth";
import { parseAxiosError } from "@/lib/axios";

function SignupContent() {
  const t           = useTranslations("Registration");
  const { locale }  = useParams<{ locale: string }>();
  const router      = useRouter();
  const { signup }  = useAuth();
  const { isDark }  = useTheme();

  const schema = z.object({
    displayName: z
      .string()
      .min(3, t("displayNameValidation"))
      .max(30, t("displayNameValidation"))
      .regex(/^[a-zA-Z0-9-]+$/, t("displayNameValidation")),
    email: z.string().email(t("emailValidation")),
    password: z
      .string()
      .min(8, t("passwordValidation"))
      .regex(/[0-9]/, t("passwordValidation"))
      .regex(/[a-z]/, t("passwordValidation"))
      .regex(/[A-Z]/, t("passwordValidation")),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsMustMatch"),
    path: ["confirmPassword"],
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const user = await signup({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      router.push(getRoleRedirect(user, locale));
    } catch (error) {
      const msg = parseAxiosError(error);
      // Try to map backend field errors
      if (msg.toLowerCase().includes("email")) {
        setError("email", { message: msg });
      } else if (msg.toLowerCase().includes("password")) {
        setError("password", { message: msg });
      } else {
        setServerError(msg);
      }
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-sm tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] placeholder:text-[#635b53] focus:border-[#c4234e]"
  }`;
  const inputErrCls = `${inputCls} ${isDark ? "!border-fear" : "!border-[#c4234e]"}`;
  const labelCls = `block text-[11px] tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`;
  const fieldErrCls = `mt-1 text-[11px] tracking-wider ${isDark ? "text-fear" : "text-[#c4234e]"}`;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
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
          {t("createAnAccount")}
        </h1>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className={labelCls}>{t("displayedName")}</label>
            <input
              type="text"
              className={errors.displayName ? inputErrCls : inputCls}
              placeholder={t("typeDisplayedName")}
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className={fieldErrCls}>{errors.displayName.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>{t("email")}</label>
            <input
              type="email"
              className={errors.email ? inputErrCls : inputCls}
              placeholder={t("typeEmail")}
              autoComplete="username"
              {...register("email")}
            />
            {errors.email && (
              <p className={fieldErrCls}>{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>{t("password")}</label>
            <input
              type="password"
              className={errors.password ? inputErrCls : inputCls}
              placeholder={t("typePassword")}
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className={fieldErrCls}>{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>{t("confirmPassword")}</label>
            <input
              type="password"
              className={errors.confirmPassword ? inputErrCls : inputCls}
              placeholder={t("typeConfirmPassword")}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className={fieldErrCls}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider">
              {serverError}
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
          className={`my-5 flex items-center gap-3 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
        >
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#a89888]/30"}`}
          />
          <span className="text-[11px] tracking-[2px]">
            {t("or").toUpperCase()}
          </span>
          <div
            className={`h-px flex-1 ${isDark ? "bg-royalblue/30" : "bg-[#a89888]/30"}`}
          />
        </div>

        <div className="text-center text-sm tracking-wider">
          <span className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>
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
