"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AuthSession, AuthUser } from "@/lib/auth";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import api, { parseAxiosError } from "@/lib/axios";

type SignupPayload = {
  email:        string;
  password:     string;
  displayName:  string;
};

type LoginPayload = {
  email:    string;
  password: string;
};

type AuthContextValue = {
  session:    AuthSession | null;
  isHydrated: boolean;
  signup:     (payload: SignupPayload) => Promise<AuthUser>;
  login:      (payload: LoginPayload) => Promise<AuthUser>;
  logout:     () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  /* Hydrate session from httpOnly cookie via /api/auth/me */
  useEffect(() => {
    api.get<AuthUser>(API_ENDPOINTS.auth.me)
      .then(({ data }) => setSession({ user: data }))
      .catch(() => {/* not logged in */})
      .finally(() => setIsHydrated(true));
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    try {
      const { data } = await api.post<{ user: AuthUser }>(API_ENDPOINTS.auth.signup, payload);
      setSession({ user: data.user });
      return data.user;
    } catch(err) {
      throw new Error(parseAxiosError(err));
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const { data } = await api.post<{ user: AuthUser }>(API_ENDPOINTS.auth.login, payload);
      setSession({ user: data.user });
      return data.user;
    } catch(err) {
      throw new Error(parseAxiosError(err));
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post(API_ENDPOINTS.auth.logout).catch(() => {/* ignore */});
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isHydrated, signup, login, logout }),
    [session, isHydrated, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if(!context)
    throw new Error("useAuth must be used within an AuthProvider");

  return context;
};
