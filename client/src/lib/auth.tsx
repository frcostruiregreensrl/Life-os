import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "./queryClient";

interface PublicUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextValue {
  user: PublicUser | null | undefined;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: (data) => queryClient.setQueryData(["/api/auth/me"], data),
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", { email, password, name });
      return res.json();
    },
    onSuccess: (data) => queryClient.setQueryData(["/api/auth/me"], data),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => queryClient.setQueryData(["/api/auth/me"], null),
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: async (email, password) => {
          await loginMutation.mutateAsync({ email, password });
        },
        register: async (email, password, name) => {
          await registerMutation.mutateAsync({ email, password, name });
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
      }}
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
