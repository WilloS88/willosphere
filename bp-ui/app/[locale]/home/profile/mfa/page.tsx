"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";

type EnrollmentStep = "idle" | "qr" | "confirm" | "done";

function MfaCodeInput({
  value,
  onChange,
  isDark,
}: {
  value:    string;
  onChange: (v: string) => void;
  isDark:   boolean;
}) {
  const handleChange = (idx: number, char: string, refs: (HTMLInputElement | null)[]) => {
    if(!/^\d?$/.test(char))
      return;

    const arr = value.split("");
    arr[idx] = char;
    const next = arr.join("").slice(0, 6);
    onChange(next);

    if(char && idx < 5)
      refs[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent, refs: (HTMLInputElement | null)[]) => {
    if(e.key === "Backspace" && !value[idx] && idx > 0) {
      refs[idx - 1]?.focus();
    }
  };

  const refs: (HTMLInputElement | null)[] = [];

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value, refs)}
          onKeyDown={(e) => handleKeyDown(i, e, refs)}
          onPaste={
            i === 0
              ? (e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  onChange(pasted);
                }
              : undefined
          }
          className={`w-10 h-12 text-center text-lg font-bold rounded-sm border outline-none transition-all font-vcr tracking-widest ${
            isDark
              ? "bg-darkblue/60 border-royalblue/30 text-vhs-white focus:border-fear"
              : "bg-[#ede7db]/80 border-[#a89888]/40 text-[#2a2520] focus:border-[#c4234e]"
          }`}
        />
      ))}
    </div>
  );
}

function CopyButton({ text, isDark, labelCopy, labelCopied }: { text: string; isDark: boolean; labelCopy: string; labelCopied: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs tracking-[1px] cursor-pointer border transition-all ${
        isDark
          ? "border-royalblue/30 text-vhs-muted hover:text-fear hover:border-fear/40 bg-transparent"
          : "border-[#a89888]/40 text-[#635b53] hover:text-[#c4234e] hover:border-[#c4234e]/40 bg-transparent"
      }`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? labelCopied : labelCopy}
    </button>
  );
}

function MfaSetupContent() {
  const t           = useTranslations("Mfa");
  const { locale }  = useParams<{ locale: string }>();
  const router      = useRouter();
  const { mfaEnroll, mfaConfirm, session } = useAuth();
  const { isDark }  = useTheme();

  const [step, setStep]                 = useState<EnrollmentStep>("idle");
  const [otpauthUrl, setOtpauthUrl]     = useState("");
  const [secret, setSecret]             = useState("");
  const [code, setCode]                 = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [mfaEnabled, setMfaEnabled]     = useState<boolean | null>(null);

  useEffect(() => {
    api.get<{ enabled: boolean }>(API_ENDPOINTS.mfa.status)
      .then(({ data }) => setMfaEnabled(data.enabled))
      .catch(() => setMfaEnabled(false));
  }, []);

  const handleStartEnroll = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await mfaEnroll();
      setOtpauthUrl(result.otpAuthUrl);
      setSecret(result.secret);
      setStep("qr");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) return;

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await mfaConfirm(code);
      setStep("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Verification failed");
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  // QR code via public API
  const qrImageUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    : "";

  const cardCls = `w-full max-w-lg rounded border p-6 sm:p-8 ${
    isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#a89888]/30 bg-white/80"
  }`;

  const btnPrimaryCls = `w-full cursor-pointer rounded-sm py-2.5 text-xs font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 uppercase ${
    isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"
  }`;

  const headingCls = `text-center text-xl font-bold tracking-[3px] sm:text-2xl uppercase ${
    isDark ? "text-fearyellow" : "text-[#c4234e]"
  }`;

  const mutedCls = `text-xs tracking-[1.5px] ${
    isDark ? "text-vhs-muted" : "text-[#635b53]"
  }`;

  if (mfaEnabled === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className={`${cardCls} flex items-center justify-center`}>
          <span className={`text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
            ...
          </span>
        </div>
      </div>
    );
  }

  if (mfaEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className={cardCls}>
          <Link
            href={`/${locale}/home/profile`}
            className={`mb-6 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${
              isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
            }`}
          >
            <ArrowLeft size={12} /> PROFILE
          </Link>

          <div className="flex flex-col items-center">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                isDark ? "bg-green-500/10" : "bg-green-600/10"
              }`}
            >
              <ShieldCheck size={28} className={isDark ? "text-green-400" : "text-green-600"} />
            </div>
            <h1 className={`${headingCls} mb-3`}>{t("activeTitle")}</h1>
            <p className={`${mutedCls} text-center mb-6 max-w-sm`}>
              {t("activeDesc")}
            </p>
            <Link
              href={`/${locale}/home/profile`}
              className={`${btnPrimaryCls} text-center no-underline block`}
            >
              {t("backToProfile")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className={cardCls}>
        {/* Back link */}
        <Link
          href={`/${locale}/home/profile`}
          className={`mb-6 inline-flex items-center gap-1.5 text-xs tracking-[2px] no-underline ${
            isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          <ArrowLeft size={12} /> PROFILE
        </Link>

        {/* ── STEP: Idle (start enrollment) ── */}
        {step === "idle" && (
          <div className="flex flex-col items-center">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                isDark ? "bg-royalblue/10" : "bg-[#7040c0]/10"
              }`}
            >
              <ShieldAlert
                size={28}
                className={isDark ? "text-royalblue" : "text-[#7040c0]"}
              />
            </div>
            <h1 className={`${headingCls} mb-3`}>{t("setupTitle")}</h1>
            <p className={`${mutedCls} text-center mb-6 max-w-sm`}>
              {t("setupDesc")}
            </p>

            {errorMessage && (
              <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider mb-4 w-full text-center">
                {errorMessage}
              </div>
            )}

            <button
              className={btnPrimaryCls}
              onClick={handleStartEnroll}
              disabled={isLoading}
            >
              {isLoading ? "..." : t("enableBtn")}
            </button>
          </div>
        )}

        {/* ── STEP: QR Code display ── */}
        {step === "qr" && (
          <div className="flex flex-col items-center">
            <h1 className={`${headingCls} mb-2`}>{t("scanTitle")}</h1>
            <p className={`${mutedCls} text-center mb-5`}>
              {t("scanDesc")}
            </p>

            {/* QR Code */}
            <div
              className={`mb-4 rounded-lg p-4 ${
                isDark ? "bg-white" : "bg-white border border-[#a89888]/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt={t("qrAlt")}
                width={200}
                height={200}
                className="block"
              />
            </div>

            {/* Manual secret */}
            <div className="w-full mb-5">
              <p className={`${mutedCls} mb-1.5 text-center`}>
                {t("manualEntry")}
              </p>
              <div
                className={`flex items-center justify-between gap-2 rounded px-3 py-2 ${
                  isDark
                    ? "bg-darkblue/60 border border-royalblue/20"
                    : "bg-[#ede7db]/80 border border-[#a89888]/30"
                }`}
              >
                <code
                  className={`text-xs font-mono tracking-widest break-all ${
                    isDark ? "text-fearyellow" : "text-[#2a2520]"
                  }`}
                >
                  {secret}
                </code>
                <CopyButton text={secret} isDark={isDark} labelCopy={t("copy")} labelCopied={t("copied")} />
              </div>
            </div>

            <button
              className={btnPrimaryCls}
              onClick={() => {
                setStep("confirm");
                setCode("");
                setErrorMessage(null);
              }}
            >
              {t("nextBtn")}
            </button>
          </div>
        )}

        {/* ── STEP: Confirm with TOTP code ── */}
        {step === "confirm" && (
          <div className="flex flex-col items-center">
            <h1 className={`${headingCls} mb-2`}>{t("verifyTitle")}</h1>
            <p className={`${mutedCls} text-center mb-5`}>
              {t("verifyDesc")}
            </p>

            <form className="w-full space-y-5" onSubmit={handleConfirm}>
              <MfaCodeInput value={code} onChange={setCode} isDark={isDark} />

              {errorMessage && (
                <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-xs tracking-wider text-center">
                  {errorMessage}
                </div>
              )}

              <button
                className={btnPrimaryCls}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "..." : t("confirmBtn")}
              </button>
            </form>

            <button
              onClick={() => { setStep("qr"); setErrorMessage(null); }}
              className={`mt-3 text-xs tracking-[1.5px] cursor-pointer bg-transparent border-none ${
                isDark ? "text-vhs-muted hover:text-fear" : "text-[#635b53] hover:text-[#c4234e]"
              }`}
            >
              {t("backToQr")}
            </button>
          </div>
        )}

        {/* ── STEP: Done ── */}
        {step === "done" && (
          <div className="flex flex-col items-center">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                isDark ? "bg-green-500/10" : "bg-green-600/10"
              }`}
            >
              <ShieldCheck
                size={28}
                className={isDark ? "text-green-400" : "text-green-600"}
              />
            </div>
            <h1 className={`${headingCls} mb-3`}>{t("doneTitle")}</h1>
            <p className={`${mutedCls} text-center mb-6 max-w-sm`}>
              {t("doneDesc")}
            </p>

            <Link
              href={`/${locale}/home/profile`}
              className={`${btnPrimaryCls} text-center no-underline block`}
            >
              {t("backToProfile")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MfaSetupPage() {
  return (
    <PageShell>
      <MfaSetupContent />
    </PageShell>
  );
}