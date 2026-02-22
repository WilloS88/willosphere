'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { getRoleRedirect } from "@/lib/auth";


export default function SignupPage() {
  const t             = useTranslations("Registration");
  const { locale }    = useParams<{ locale: string }>();
  const router        = useRouter();
  const { signup }    = useAuth();

  const [formState, setFormState] = useState({
    displayName:      "",
    email:            "",
    password:         "",
    confirmPassword:  "",
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if(formState.password !== formState.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signup({
        email:        formState.email,
        password:     formState.password,
        displayName:  formState.displayName,
      });
      router.push(getRoleRedirect(user, locale));
    } catch(error) {
      const message =
        error instanceof Error ? error.message : "Signup failed. Try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"
          >
            <ArrowLeft size={16} />
            {t("home")}
          </Link>
          <h1 className="text-2xl font-bold text-center mb-6">
            {t("createAnAccount")}
          </h1>

          <form className="mb-5 space-y-4" onSubmit={handleSubmit}>
            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{t("displayedName")}</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder={`${t("typeDisplayedName")}`}
                  value={formState.displayName}
                  required
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      displayName: event.target.value,
                    }))
                  }
                />
              </fieldset>
            </div>

            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{t("email")}</legend>
                <input
                  type="email"
                  className="input w-full"
                  autoComplete="username"
                  placeholder={`${t("typeEmail")}`}
                  value={formState.email}
                  required
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </fieldset>
            </div>

            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{t("password")}</legend>
                <input
                  type="password"
                  className="input w-full"
                  autoComplete="new-password"
                  placeholder={`${t('typePassword')}`}
                  value={formState.password}
                  required
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />
              </fieldset>
            </div>

            <div className="form-control">
             <fieldset className="fieldset">
                <legend className="fieldset-legend">{t("confirmPassword")}</legend>
                <input
                  type="password"
                  className="input w-full"
                  autoComplete="new-password"
                  placeholder={`${t('typeConfirmPassword')}`}
                  value={formState.confirmPassword}
                  required
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </fieldset>
            </div>

            {errorMessage
              ? (<div className="alert alert-error text-sm">{errorMessage}</div>)
              : null}

            <button className="btn btn-secondary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : t("signup")}
            </button>
          </form>

          <div className="divider">{t("or").toUpperCase()}</div>
          <div className="flex items-center justify-center text-center text-sm gap-2">
            <div>
              {t("alreadyHaveAnAccount")}
            </div>
            <Link
              href={`/${locale}/login`}
              className="link link-primary ml-1"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}