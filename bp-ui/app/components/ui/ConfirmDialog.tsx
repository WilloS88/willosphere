"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/lib/hooks";

interface ConfirmDialogProps {
  open:       boolean;
  title:      string;
  message:    string;
  confirmLabel?: string;
  cancelLabel?:  string;
  onConfirmAction:  () => void;
  onCancelAction:   () => void;
  variant?:   "danger" | "default";
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel  = "Cancel",
  onConfirmAction,
  onCancelAction,
  variant = "danger",
}: ConfirmDialogProps) {
  const { isDark } = useTheme();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelAction();
    },
    [onCancelAction],
  );

  useEffect(() => {
    if(!open)
      return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if(!open)
    return null;

  const confirmBtnCls =
    variant === "danger"
      ? isDark
        ? "bg-fear text-white hover:brightness-110"
        : "bg-[#c4234e] text-white hover:brightness-110"
      : isDark
        ? "bg-vhs-cyan text-darkblue hover:brightness-110"
        : "bg-[#0094a8] text-white hover:brightness-110";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancelAction}
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`relative z-10 w-full max-w-sm rounded border p-5 font-vcr animate-slide-up ${
          isDark
            ? "bg-vhs-card border-royalblue/30"
            : "bg-white border-[#a89888]/40"
        }`}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3
            id="confirm-dialog-title"
            className={`text-sm font-bold tracking-[2px] ${
              isDark ? "text-vhs-white" : "text-[#2a2520]"
            }`}
          >
            {title}
          </h3>
          <button
            aria-label="Close"
            onClick={onCancelAction}
            className={`cursor-pointer opacity-50 hover:opacity-100 transition-opacity ${
              isDark ? "text-vhs-muted" : "text-[#635b53]"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p
          className={`mb-5 text-xs tracking-wider leading-relaxed ${
            isDark ? "text-vhs-muted" : "text-[#635b53]"
          }`}
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelAction}
            className={`cursor-pointer rounded-sm border px-4 py-2 text-xs font-bold tracking-[2px] transition-all ${
              isDark
                ? "border-royalblue/30 text-vhs-muted hover:text-vhs-white"
                : "border-[#a89888]/40 text-[#635b53] hover:text-[#2a2520]"
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirmAction}
            className={`cursor-pointer rounded-sm px-4 py-2 text-xs font-bold tracking-[2px] transition-all ${confirmBtnCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
