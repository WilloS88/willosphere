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
  email:        string;
  password:     string;
};

type VerifyLoginPayload = {
  challengeId:  string;
  code:         string;
};

type MfaEnrollResult = {
  otpAuthUrl:   string;
  secret:       string;
};

type LoginResultOk = {
  mfaRequired:  false;
  user:         AuthUser;
};

type LoginResultMfa = {
  mfaRequired:  true;
  challengeId:  string;
};

type LoginResult = LoginResultOk | LoginResultMfa;

type AuthContextValue = {
  session:         AuthSession | null;
  isHydrated:      boolean;
  signup:          (payload: SignupPayload) => Promise<AuthUser>;
  login:           (payload: LoginPayload) => Promise<LoginResult>;
  verifyLogin:     (payload: VerifyLoginPayload) => Promise<AuthUser>;
  logout:          () => Promise<void>;
  refreshSession:  () => Promise<AuthUser>;
  mfaEnroll:       () => Promise<MfaEnrollResult>;
  mfaConfirm:      (code: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    api.get<AuthUser>(API_ENDPOINTS.auth.me)
      .then(({ data }) => setSession({ user: data }))
      .catch(() => {})
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

  const login = useCallback(
    async (payload: LoginPayload): Promise<LoginResult> => {
      try {
        const { data } = await api.post<
          { user: AuthUser } | { challengeId: string }
        >(API_ENDPOINTS.auth.login, payload);

        if("challengeId" in data) {
          return { mfaRequired: true, challengeId: data.challengeId };
        }

        setSession({ user: data.user });
        return { mfaRequired: false, user: data.user };
      } catch (err) {
        throw new Error(parseAxiosError(err));
      }
    },
    [],
  );

  const verifyLogin = useCallback(
    async (payload: VerifyLoginPayload): Promise<AuthUser> => {
      try {
        const { data } = await api.post<{ user: AuthUser }>(
          API_ENDPOINTS.auth.verifyLogin,
          payload,
        );
        setSession({ user: data.user });
        return data.user;
      } catch (err) {
        throw new Error(parseAxiosError(err));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post(API_ENDPOINTS.auth.logout).catch(() => {});
    setSession(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthUser> => {
    const { data } = await api.get<AuthUser>(API_ENDPOINTS.auth.me);
    setSession({ user: data });

    return data;
  }, []);

  const mfaEnroll = useCallback(async (): Promise<MfaEnrollResult> => {
    try {
      const { data } = await api.post<MfaEnrollResult>(
        API_ENDPOINTS.mfa.enroll,
      );
      return data;
    } catch (err) {
      throw new Error(parseAxiosError(err));
    }
  }, []);

  const mfaConfirm = useCallback(async (code: string): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.mfa.confirm, { code });
    } catch (err) {
      throw new Error(parseAxiosError(err));
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      isHydrated,
      signup,
      login,
      verifyLogin,
      logout,
      refreshSession,
      mfaEnroll,
      mfaConfirm,
    }),
    [
      session,
      isHydrated,
      signup,
      login,
      verifyLogin,
      logout,
      refreshSession,
      mfaEnroll,
      mfaConfirm,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if(!context)
    throw new Error("useAuth must be used within an AuthProvider");

  return context;
};
