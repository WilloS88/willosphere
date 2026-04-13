"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HandCoins, Sparkles } from "lucide-react";
import { SectionLabel, VHSButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useToast } from "@/app/context/ToastContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import api from "@/lib/axios";

const PRESETS = [49, 99, 149, 249, 499];

type DonateForm = { amount: number };

export default function DonatePage() {
  const t          = useTranslations("Store");
  const { isDark } = useTheme();
  const toast      = useToast();

  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState<number | null>(null);
  const [myTotal, setMyTotal]       = useState<{ total: number; count: number } | null>(null);

  const schema = z.object({
    amount: z
      .number({ invalid_type_error: t("donateRequiredError") })
      .min(1, t("donateMinError"))
      .max(100000, t("donateMaxError")),
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DonateForm>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0 },
  });

  useEffect(() => {
    api
      .get<{ total: number; count: number }>(API_ENDPOINTS.donations.myTotal)
      .then(({ data }) => setMyTotal(data))
      .catch(() => {});
  }, []);

  const selectPreset = (amount: number) => {
    setSelected(amount);
    setValue("amount", amount, { shouldValidate: true });
  };

  const onSubmit = async (data: DonateForm) => {
    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.donations.create, { amount: data.amount });
      toast.success(t("donateSuccess"));
      reset();
      setSelected(null);
      // Refresh total
      const res = await api.get<{ total: number; count: number }>(API_ENDPOINTS.donations.myTotal);
      setMyTotal(res.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t("donateError"));
    } finally {
      setLoading(false);
    }
  };

  const mutedCls = isDark ? "text-vhs-muted" : "text-[#635b53]";
  const cardCls  = isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#a89888]/40";
  const accentCls = isDark ? "text-fearyellow" : "text-[#c4234e]";

  return (
    <div className="max-w-lg mx-auto">
      <SectionLabel className="mb-1">{t("donateTitle")}</SectionLabel>
      <h1 className={`text-xl font-bold tracking-widest mb-2 ${accentCls}`}>
        <HandCoins size={18} className="inline mr-2" />
        {t("donateTitle")}
      </h1>
      <p className={`text-xs tracking-wider mb-6 ${mutedCls}`}>
        {t("donateSubtitle")}
      </p>

      {/* User total */}
      {myTotal && myTotal.count > 0 && (
        <div className={`rounded border px-4 py-3 mb-4 flex items-center justify-between ${cardCls}`}>
          <span className={`text-xs tracking-widest ${mutedCls}`}>{t("donateTotal")}</span>
          <span className={`text-lg font-bold ${accentCls}`}>
            {myTotal.total.toLocaleString()} {t("donateCurrency")}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Preset amounts */}
        <div className={`text-xs tracking-widest mb-3 ${mutedCls}`}>
          {t("donatePresetLabel")}
        </div>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => selectPreset(amount)}
              className={`rounded border px-2 py-3 text-center transition-all cursor-pointer ${
                selected === amount
                  ? isDark
                    ? "bg-fear/20 border-fear text-fearyellow"
                    : "bg-[#c4234e]/10 border-[#c4234e] text-[#c4234e]"
                  : isDark
                    ? "bg-vhs-card border-royalblue/20 text-vhs-white hover:border-fear/40"
                    : "bg-white/80 border-[#a89888]/40 text-[#2a2520] hover:border-[#c4234e]/40"
              }`}
            >
              <div className="text-sm font-bold">{amount}</div>
              <div className={`text-[10px] ${mutedCls}`}>{t("donateCurrency")}</div>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className={`text-xs tracking-widest mb-2 ${mutedCls}`}>
          {t("donateCustomLabel")}
        </div>
        <div className={`rounded border mb-1 ${cardCls}`}>
          <input
            type="number"
            step="1"
            min="1"
            max="100000"
            placeholder={t("donateCustomPlaceholder")}
            className={`w-full bg-transparent border-none outline-none px-4 py-3 text-sm font-bold tracking-wider ${
              isDark ? "text-vhs-white placeholder:text-vhs-muted" : "text-[#2a2520] placeholder:text-[#635b53]"
            }`}
            {...register("amount", { valueAsNumber: true })}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelected(PRESETS.includes(val) ? val : null);
              setValue("amount", val, { shouldValidate: true });
            }}
          />
        </div>
        {errors.amount && (
          <div className="text-error text-xs mb-3">{errors.amount.message}</div>
        )}

        {/* Submit */}
        <div className="mt-4">
          <VHSButton
            variant="primary"
            className="w-full py-3"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Sparkles size={14} />
                {t("donateButton")}
              </>
            )}
          </VHSButton>
        </div>
      </form>
    </div>
  );
}
