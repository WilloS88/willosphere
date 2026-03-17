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

const AUTH_STORAGE_KEY  = process.env.AUTH_STORAGE_KEY!;

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
  logout:     () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseErrorMessage = async (response: Response) => {
  if(response.ok) {
    return null;
  }

  const data = await response.json().catch(() => null);
  const message = data?.message;

  if(Array.isArray(message)) {
    return message.join(", ");
  }

  if(typeof message === "string") {
    return message;
  }

  return `Request failed (${response.status})`;
};

const saveSession = (session: AuthSession | null) => {
  if(typeof window === "undefined") {
    return;
  }

  if(!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

const loadSession = () => {
  if(typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if(!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSession();
    if(stored) {
      setSession(stored);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if(!isHydrated) {
      return;
    }
    saveSession(session);
  }, [session, isHydrated]);

  const signup = useCallback(async (payload: SignupPayload) => {
    const response = await fetch(API_ENDPOINTS.auth.signup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const errorMessage = await parseErrorMessage(response);
    if(errorMessage) {
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as AuthSession;
    setSession(data);
    return data.user;
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const errorMessage = await parseErrorMessage(response);
    if(errorMessage) {
      console.log(API_ENDPOINTS.auth.login);
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as AuthSession;
    setSession(data);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isHydrated,
      signup,
      login,
      logout,
    }),
    [session, isHydrated, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if(!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
