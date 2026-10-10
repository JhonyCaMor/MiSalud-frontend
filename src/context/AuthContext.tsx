import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "@/lib/client";
import type { AuthUserSanitized, LoginDto, LoginResponse } from "@/lib/contracts";

interface AuthState {
  user: AuthUserSanitized | null;
  token: string | null;
  login: (dto: LoginDto) => Promise<AuthUserSanitized>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
  initialToken,
}: {
  children: ReactNode;
  initialUser?: AuthUserSanitized | null;
  initialToken?: string | null;
}) {
  const [user, setUser] = useState<AuthUserSanitized | null>(() =>
    initialUser ?? null,
  );
  const [token, setTokenState] = useState<string | null>(() =>
    initialToken === undefined ? getToken() : initialToken,
  );

  const login = useCallback(async (dto: LoginDto) => {
    const res = await api.post<LoginResponse>("/auth/login", dto);
    setToken(res.accessToken);
    setTokenState(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, login, logout }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}