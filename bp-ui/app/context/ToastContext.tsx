"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers              = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback((message: string, type: ToastType) => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => dismiss(id), 3200);
    timers.current.set(id, timer);
  }, [dismiss]);

  const api: ToastContextValue = {
    success: (msg) => push(msg, "success"),
    error:   (msg) => push(msg, "error"),
    info:    (msg) => push(msg, "info"),
  };

  const COLOR: Record<ToastType, string> = {
    success: "border-vhs-green   text-vhs-green",
    error:   "border-fear        text-fear",
    info:    "border-vhs-cyan    text-vhs-cyan",
  };

  const BG = "bg-[#0b0f2d]/95 backdrop-blur-sm border font-vcr text-xs tracking-wider";

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast container */}
      <div className="pointer-events-none fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-sm px-4 py-3 shadow-lg
              animate-slide-up ${BG} ${COLOR[t.type]}`}
            style={{ minWidth: 220, maxWidth: 340 }}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if(!ctx)
    throw new Error("useToast must be used inside ToastProvider");

  return ctx;
}
