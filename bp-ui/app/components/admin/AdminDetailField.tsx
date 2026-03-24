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
        <div className="mb-1 text-xs font-semibold text-gray-600">{label}:</div>
        <div className="rounded border bg-slate-50 p-2 text-xs leading-relaxed text-gray-700">
          {value ?? <span className="text-gray-400">—</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <span className="font-semibold text-gray-600">{label}: </span>
      <span>{value ?? <span className="text-gray-400">—</span>}</span>
    </div>
  );
}
