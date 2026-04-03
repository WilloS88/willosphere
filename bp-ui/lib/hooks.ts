import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";
import { toggleTheme } from "./features/theme/themeSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);

export function useTheme() {
  const mode     = useAppSelector((s) => s.theme.mode);
  const dispatch = useAppDispatch();

  const toggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  return { theme: mode, toggle, isDark: mode === "dark" } as const;
}
