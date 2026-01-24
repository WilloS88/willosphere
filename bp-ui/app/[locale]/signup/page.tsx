'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { getRoleRedirect } from "@/lib/auth";


export default function SignupPage() {
  const { locale }    = useParams<{ locale: string }>();
  const router        = useRouter();
  const tRegistration = useTranslations('Registration');
  const { signup }    = useAuth();

  const [formState, setFormState] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
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
        email: formState.email,
        password: formState.password,
        displayName: formState.displayName,
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
          <h1 className="text-2xl font-bold text-center mb-6">
            {tRegistration('createAnAccount')}
          </h1>

          <form className="mb-5 space-y-4" onSubmit={handleSubmit}>
            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{tRegistration("displayedName")}</legend>
                <input 
                  type="text" 
                  className="input w-full"
                  placeholder={`${tRegistration('typeDisplayedName')}`}
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
                <legend className="fieldset-legend">{tRegistration("email")}</legend>
                <input 
                  type="email"
                  className="input w-full"
                  autoComplete="username"
                  placeholder={`${tRegistration('typeEmail')}`}
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
                <legend className="fieldset-legend">{tRegistration("password")}</legend>
                <input 
                  type="password" 
                  className="input w-full"
                  autoComplete="new-password"
                  placeholder={`${tRegistration('typePassword')}`}
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
                <legend className="fieldset-legend">{tRegistration("confirmPassword")}</legend>
                <input 
                  type="password" 
                  className="input w-full"
                  autoComplete="new-password"
                  placeholder={`${tRegistration('typeConfirmPassword')}`}
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
              {isSubmitting ? "Creating account..." : tRegistration("signup")}
            </button>
          </form>

          <div className="divider">{tRegistration("or").toUpperCase()}</div>
          <div className="flex items-center justify-center text-center text-sm gap-2">
            <div>
              {tRegistration("alreadyHaveAnAccount")}
            </div>
            <Link
              href={`/${locale}/login`}
              className="link link-primary ml-1"
            >
              {tRegistration("login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}