"use client";

import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "use-intl";

export type DialogMode = "create" | "edit" | "view";

type DialogProps = {
  open:             boolean;
  mode?:            DialogMode;
  title?:           React.ReactNode;
  children:         React.ReactNode;
  onCloseAction:    () => void;
  onSave?:          () => void | Promise<void>;
  onEdit?:          () => void;
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
   onSave,
   onEdit,
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
  const canSave           = !!onSave && shouldRenderSave && !disableSave && !saving;

  const handleSave = async () => {
    if(!onSave || !canSave)
      return;

    try {
      setSaving(true);
      await onSave();
      if(closeAfterSave)
        onCloseAction();
    } finally {
      setSaving(false);
    }
  };

  const defaultActions = (
    <>
      {isView && onEdit ? (
        <>
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            {t("edit")}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCloseAction}>
            {t("close")}
          </button>
        </>
      ) : (
        <>
          {shouldRenderSave && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              {saving ? <span className="loading loading-spinner loading-sm" /> : null}
              {t("save")}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onCloseAction}>
            {t("close")}
          </button>
        </>
      )}
    </>
  );

  return (
    <dialog className="modal modal-open">
      <div className={`modal-box bg-slate-200 ${maxWidthClass}`}>
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 mb-4">
            {title ? <h3 className="font-bold text-lg">{title}</h3> : <div />}

            {showCloseButton && (
              <button
                type="button"
                className="cursor-pointer"
                aria-label="Close dialog"
                onClick={onCloseAction}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div>{children}</div>

        <div className="modal-action">{actions ?? defaultActions}</div>
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
