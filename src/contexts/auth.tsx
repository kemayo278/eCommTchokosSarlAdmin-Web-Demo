"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axiosClient, { setAuthToken, getStoredToken } from "@/lib/api/axiosClient";
import { widgetSession, i18nLang, trackExternalReferrer } from "@/lib/session";
import type { LoginResponse, User } from "@/types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  patchUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    i18nLang.init();
    trackExternalReferrer();

    const token = getStoredToken();

    if (!token) {
      setLoading(false);
      return;
    }

    setAuthToken(token);
    axiosClient
      .get<{ user: User } | User>("/v1/user")
      .then(({ data }) => {
        const u = "user" in data ? data.user : data;
        setUser(u);
        widgetSession.set({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          phone: u.phone,
        });
      })
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const { data } = await axiosClient.post<LoginResponse>("/v1/login", {
      email,
      password,
    });
    setAuthToken(data.token, rememberMe);
    setUser(data.user);
    widgetSession.set({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      avatar: data.user.avatar,
      phone: data.user.phone,
    });
  }, []);

  const logout = useCallback(() => {
    axiosClient.post("/v1/logout").catch(() => {});
    if (user) widgetSession.clear(user.id);
    setAuthToken(null);
    setUser(null);
  }, [user]);

  const patchUser = useCallback((patch: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, patchUser }),
    [user, loading, login, logout, patchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
