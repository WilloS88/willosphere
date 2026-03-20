"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

const GENRES = [
  "Hip Hop",
  "Rock",
  "Electronic",
  "Pop",
  "Jazz",
  "Metal",
  "Synthwave",
  "Lo-Fi",
];

function CreateArtistContent() {
  const t           = useTranslations("Artist");
  const { locale }  = useParams<{ locale: string }>();
  const router      = useRouter();
  const { isDark }  = useStoreTheme();

  const [formState, setFormState] = useState({
    bio:             "",
    profileImageUrl: "",
    artistSince:      "",
    genres: [] as string[],
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGenre = (genre: string) => {
    setFormState((p) => ({
      ...p,
      genres: p.genres.includes(genre)
        ? p.genres.filter((g) => g !== genre)
        : [...p.genres, genre],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      router.push(`/${locale}/artist`);
    } catch {
      setErrorMessage(t("createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-[11px] tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-[9px] tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`;

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-44px)] items-center justify-center px-4 py-8">
        <div
          className={`w-full max-w-2xl rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/80"}`}
        >
          <Link
            href={`/${locale}`}
            className={`mb-4 inline-flex items-center gap-1.5 text-[10px] tracking-[2px] no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#8a8578] hover:text-[#c4234e]"}`}
          >
            <ArrowLeft size={12} /> {t("back")}
          </Link>
          <h1
            className={`mb-6 text-center text-xl font-bold tracking-[3px] sm:text-2xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
          >
            {t("createArtistProfile")}
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className={labelCls}>{t("artistBio")}</label>
              <textarea
                className={`${inputCls} min-h-[100px] resize-y`}
                placeholder={t("bioPlaceholder")}
                value={formState.bio}
                required
                onChange={(e) =>
                  setFormState((p) => ({ ...p, bio: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>{t("profileImageUrl")}</label>
              <input
                type="url"
                className={inputCls}
                placeholder={t("imageUrlPlaceholder")}
                value={formState.profileImageUrl}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    profileImageUrl: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>{t("artistSince")}</label>
              <input
                type="date"
                className={inputCls}
                value={formState.artistSince}
                required
                onChange={(e) =>
                  setFormState((p) => ({ ...p, artistSince: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={labelCls}>{t("genres")}</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`cursor-pointer rounded-sm border px-3 py-1.5 text-[10px] font-bold tracking-wider transition-all ${
                      formState.genres.includes(genre)
                        ? "bg-fear border-fear text-white"
                        : isDark
                          ? "border-royalblue/30 text-vhs-light hover:border-fear/40 bg-transparent"
                          : "border-[#c4b8a8]/40 bg-transparent text-[#6b6560] hover:border-[#c4234e]/30"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="text-fear bg-fear/10 border-fear/20 rounded border p-2 text-[10px] tracking-wider">
                {errorMessage}
              </div>
            )}

            <button
              className={`mt-2 w-full cursor-pointer rounded-sm py-2.5 text-[11px] font-bold tracking-[2px] transition-all hover:brightness-110 disabled:opacity-50 ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("creating") : t("createArtistProfile")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function CreateArtistPage() {
  return (
    <PageShell>
      <CreateArtistContent />
    </PageShell>
  );
}
