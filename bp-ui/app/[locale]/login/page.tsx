"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { getRoleRedirect } from "@/lib/auth";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const { locale }                      = useParams<{ locale: string }>();
  const tLogin                          = useTranslations("Login");
  const router                          = useRouter();
  const { login }                       = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState({
    email: "",
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
          <h1 className="mb-6 text-center text-2xl font-bold">
            {tLogin("header")}
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="form-control">
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
              </div>
              <div className="">
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder={`${tLogin("emailExample")}`}
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
                  <span className="label-text">{tLogin("password")}</span>
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
              {isSubmitting ? "Logging in..." : tLogin("login")}
            </button>
          </form>

          <div className="divider">{tLogin("or").toUpperCase()}</div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <div>{tLogin("dontHaveAnAccount")}</div>
            <Link href={`/${locale}/signup`} className="link link-primary ml-1">
              {tLogin("signup")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}