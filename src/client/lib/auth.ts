import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@client/lib/api";
import type { AuthUser, Credentials } from "@shared/types";

const ME_KEY = ["auth", "me"] as const;

/**
 * Current authenticated user. `data === null` means definitively logged out
 * (server returned 401); `undefined` while loading.
 */
export function useAuthUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        return await api.get<AuthUser>("/api/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: Credentials) =>
      api.post<AuthUser>("/api/auth/signup", creds),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: Credentials) =>
      api.post<AuthUser>("/api/auth/login", creds),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}
