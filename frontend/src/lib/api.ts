const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ??
      (typeof data === "string" ? data : res.statusText);
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<import("@/types").AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      apiFetch<import("@/types").AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  notes: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const q = searchParams.toString();
      return apiFetch<import("@/types").NotesListResponse>(
        `/notes${q ? `?${q}` : ""}`
      );
    },
    get: (id: string) =>
      apiFetch<import("@/types").Note>(`/notes/${id}`),
    create: (data: import("@/types").CreateNoteInput) =>
      apiFetch<import("@/types").Note>("/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import("@/types").UpdateNoteInput) =>
      apiFetch<import("@/types").Note>(`/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/notes/${id}`, { method: "DELETE" }),
    summarize: (id: string) =>
      apiFetch<import("@/types").Note>(`/notes/${id}/summarize`, {
        method: "POST",
      }),
    generateTags: (id: string) =>
      apiFetch<import("@/types").Note>(`/notes/${id}/tags`, {
        method: "POST",
      }),
  },
};
