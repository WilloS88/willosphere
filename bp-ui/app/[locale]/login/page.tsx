"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { getRoleRedirect } from "@/lib/auth";

export default function LoginPage() {
  const t                               = useTranslations("Login");
  const { locale }                      = useParams<{ locale: string }>();
  const router                          = useRouter();
  const { login }                       = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState({
    email:    "",
    password: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await login(formState);
      router.push(getRoleRedirect(user, locale));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed. Try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-200 flex min-h-screen items-center justify-center">
      <div className="card bg-base-100 w-full max-w-md shadow-xl">
        <div className="card-body">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"
          >
            <ArrowLeft size={16} />
            {t("home")}
          </Link>
          <h1 className="mb-6 mt-2 text-center text-2xl font-bold">
            {t("header")}
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="form-control">
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">{t("email")}</span>
                </label>
              </div>
              <div className="">
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder={`${t("emailExample")}`}
                  autoComplete="username"
                  value={formState.email}
                  required
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">{t("password")}</span>
                </label>
              </div>
              <input
                type="password"
                className="input input-bordered w-full"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formState.password}
                required
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
              />
            </div>

            {errorMessage ? (
              <div className="alert alert-error text-sm">{errorMessage}</div>
            ) : null}

            <button className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : t("login")}
            </button>
          </form>

          <div className="divider">{t("or").toUpperCase()}</div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <div>{t("dontHaveAnAccount")}</div>
            <Link href={`/${locale}/signup`} className="link link-primary ml-1">
              {t("signup")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}