"use client";

import { X, Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { AdminSpinner } from "./AdminSpinner";

export type DialogMode = "create" | "edit" | "view";

type DialogProps = {
  open:             boolean;
  mode?:            DialogMode;
  title?:           React.ReactNode;
  children:         React.ReactNode;
  onCloseAction:    () => void;
  onSaveAction?:          () => void | Promise<void>;
  onEditAction?:          () => void;
  maxWidthClass?:   string;
  closeOnBackdrop?: boolean;
  closeOnEsc?:      boolean;
  showCloseButton?: boolean;
  hideSave?:        boolean;
  disableSave?:     boolean;
  closeAfterSave?:  boolean;
  actions?:       React.ReactNode;
};

export function Dialog({
   open,
   mode            = "edit",
   title,
   children,
   onCloseAction,
   onSaveAction,
   onEditAction,
   maxWidthClass    = "max-w-lg",
   closeOnBackdrop  = true,
   closeOnEsc       = true,
   showCloseButton  = true,
   hideSave         = false,
   disableSave      = false,
   closeAfterSave   = false,
   actions,
}: DialogProps) {
  const t                   = useTranslations("Admin");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if(!open || !closeOnEsc)
      return;

    const onKeyDown = (e: KeyboardEvent) => {
      if(e.key === "Escape")
        onCloseAction();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEsc, onCloseAction]);

  if(!open)
    return null;

  const isView            = mode === "view";
  const shouldRenderSave  = !hideSave && (!isView);
  const canSave           = !!onSaveAction && shouldRenderSave && !disableSave && !saving;

  const handleSave = async () => {
    if(!onSaveAction || !canSave)
      return;

    try {
      setSaving(true);
      await onSaveAction();
      if(closeAfterSave)
        onCloseAction();
    } finally {
      setSaving(false);
    }
  };

  /* Footer: action button (edit/save) LEFT, close RIGHT — always */
  const defaultActions = (
    <>
      {isView && onEditAction && (
        <button type="button" className="btn btn-warning btn-sm" onClick={onEditAction}>
          <Pencil size={14} />
          {t("edit")}
        </button>
      )}
      {shouldRenderSave && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving && <AdminSpinner size="xs" />}
          {t("save")}
        </button>
      )}
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCloseAction}>
        {t("close")}
      </button>
    </>
  );

  return (
    <dialog className="modal modal-open">
      <div className={`modal-box bg-base-200 w-[95vw] sm:w-auto ${maxWidthClass} p-0`}>
        {/* Header — title only + close X */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-base-300 border-b border-base-content/10">
            {title && <h3 className="font-bold text-base">{title}</h3>}

            {showCloseButton && (
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-xs"
                aria-label="Close dialog"
                onClick={onCloseAction}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-base-content/10 bg-base-300/50">
          {actions ?? defaultActions}
        </div>
      </div>

      <form
        method="dialog"
        className="modal-backdrop"
        onClick={closeOnBackdrop ? onCloseAction : undefined}
      >
        <button aria-label="Close" />
      </form>
    </dialog>
  );
}
