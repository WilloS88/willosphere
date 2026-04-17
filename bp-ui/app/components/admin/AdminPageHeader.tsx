import { type ReactNode } from "react";

type Props = {
  icon:      ReactNode;
  title:     string;
  children?: ReactNode;   // action buttons
};

export function AdminPageHeader({ icon, title, children }: Props) {
  return (
    <header className="min-h-12 sm:h-14 bg-base-100 border-b border-base-300 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-sm shrink-0">
      <div className="font-semibold flex items-center gap-2 text-sm sm:text-base">
        {icon}
        {title}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </header>
  );
}
