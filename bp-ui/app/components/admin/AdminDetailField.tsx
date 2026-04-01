import { type ReactNode } from "react";

type Props = {
  label:      string;
  value?:     ReactNode;
  block?:     boolean;
  className?: string;
};

export function AdminDetailField({ label, value, block = false, className }: Props) {
  if (block) {
    return (
      <div className={className}>
        <div className="mb-1 text-xs font-semibold text-base-content/70">{label}:</div>
        <div className="rounded border border-base-300 bg-base-200 p-2 text-xs leading-relaxed text-base-content">
          {value ?? <span className="text-base-content/40">—</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <span className="font-semibold text-base-content/70">{label}: </span>
      <span>{value ?? <span className="text-base-content/40">—</span>}</span>
    </div>
  );
}
