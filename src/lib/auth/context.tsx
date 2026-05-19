"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, LoginInput, RegisterInput } from "@/types";
import { getItem, setItem, removeItem, KEYS } from "@/lib/storage";
import {
  loginUser,
  registerUser,
  seedDatabaseIfNeeded,
  getUserById,
} from "@/lib/data/store";
import { apiClient } from "@/lib/api/client";
import { isRemoteBackend } from "@/lib/config";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<string | null>;
  register: (input: RegisterInput) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      await seedDatabaseIfNeeded();

      if (isRemoteBackend()) {
        try {
          const { user: remoteUser } = await apiClient.auth.me();
          setUser(remoteUser);
        } catch {
          setUser(null);
        }
      } else {
        const session = getItem<{ userId: string }>(KEYS.session);
        if (session?.userId) {
          const u = await getUserById(session.userId);
          setUser(u);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const login = useCallback(
    async (input: LoginInput): Promise<string | null> => {
      const result = await loginUser(input.username, input.password);
      if ("error" in result) return result.error;
      setUser(result.user);
      if (!isRemoteBackend()) {
        setItem(KEYS.session, { userId: result.user.id });
      }
      router.push("/feed");
      return null;
    },
    [router]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<string | null> => {
      const result = await registerUser(
        input.username,
        input.password,
        input.displayName
      );
      if ("error" in result) return result.error;
      setUser(result.user);
      if (!isRemoteBackend()) {
        setItem(KEYS.session, { userId: result.user.id });
      }
      router.push("/feed");
      return null;
    },
    [router]
  );

  const logout = useCallback(async () => {
    if (isRemoteBackend()) {
      await apiClient.auth.logout().catch(() => {});
    }
    setUser(null);
    removeItem(KEYS.session);
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    if (isRemoteBackend()) {
      const { user: remoteUser } = await apiClient.auth.me();
      setUser(remoteUser);
      return;
    }
    const session = getItem<{ userId: string }>(KEYS.session);
    if (session?.userId) {
      const u = await getUserById(session.userId);
      setUser(u);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
