import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || res.statusText);
  }
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfNotOk(res);
  return res;
}

export function getQueryFn<T>(options: { on401: "returnNull" | "throw" }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, { credentials: "include" });
    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }
    await throwIfNotOk(res);
    return res.json();
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
