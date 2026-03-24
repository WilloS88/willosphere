import { type ReactNode } from "react";

type Props = {
  icon:      ReactNode;
  title:     string;
  children?: ReactNode;   // action buttons
};

export function AdminPageHeader({ icon, title, children }: Props) {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 rounded-sm shrink-0">
      <div className="font-semibold flex items-center gap-2">
        {icon}
        {title}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </header>
  );
}
