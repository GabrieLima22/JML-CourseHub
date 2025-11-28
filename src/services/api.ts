const DEFAULT_BASE_URL = "http://localhost:3001";

const sanitizeBaseUrl = (value?: string) => {
  if (!value || !value.trim()) return DEFAULT_BASE_URL;
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const API_BASE_URL = sanitizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL as string | undefined
);

type ApiErrorPayload = {
  message?: string;
  code?: string;
  status?: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
  path?: string;
  method?: string;
};

export type ApiFailureResponse = {
  success: false;
  error?: ApiErrorPayload;
  message?: string;
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

const toUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiSuccessResponse<T>> {
  const isFormData = init.body instanceof FormData;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...init.headers,
  };

  if (init.body && !isFormData) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const response = await fetch(toUrl(path), {
    ...init,
    headers,
  });

  const json = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !json) {
    const message = json?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (json.success === false) {
    const message =
      json.error?.message ??
      json.message ??
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return json;
}

export async function apiGet<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init: RequestInit = {}
): Promise<ApiSuccessResponse<T>> {
  const isFormData = body instanceof FormData;
  return apiRequest<T>(path, {
    ...init,
    method: "POST",
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    headers: {
      ...init.headers,
      ...(isFormData || !body
        ? {}
        : {
            "Content-Type": "application/json",
          }),
    },
  });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init: RequestInit = {}
): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, {
    ...init,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...init.headers,
      "Content-Type": "application/json",
    },
  });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init: RequestInit = {}
): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, {
    ...init,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...init.headers,
      "Content-Type": "application/json",
    },
  });
}

export async function apiDelete<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiSuccessResponse<T>> {
  return apiRequest<T>(path, {
    ...init,
    method: "DELETE",
  });
}

export type UploadPdfPayload = {
  file: {
    id: string | null;
    name: string;
    filename: string;
    size: number;
    url: string;
  };
  courseId: string | null;
  storedInDatabase: boolean;
  extractedData?: {
    title: string;
    empresa?: string;
    tipo?: string;
    segmento?: string;
    categoria?: string;
    modalidade?: string[];
    area?: string;
    summary?: string;
    description?: string;
    duration_hours?: number;
    level?: string;
    tags?: string[];
    target_audience?: string[];
    deliverables?: string[];
    confidence?: number;
    objetivos?: string[];
    publico_alvo?: string[];
  } | null;
  processingSuccess?: boolean;
  error?: string | null;
  createdCourseId?: string | null;
};

export function uploadPdf(file: File, courseId?: string | null) {
  const formData = new FormData();
  formData.append("file", file);
  if (courseId) {
    formData.append("courseId", courseId);
  }

  return apiPost<UploadPdfPayload>("/api/upload/pdf", formData);
}

export const api = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  put: apiPut,
  delete: apiDelete,
  uploadPdf,
};

export type { ApiResponse };

export const adminApi = {
  createCourse: (payload: any) => apiPost('/api/courses', payload),
  updateCourse: (id: string, payload: any) => apiPatch(`/api/courses/${id}`, payload),
  setCourseStatus: (id: string, status: 'draft'|'published'|'archived') => apiPost(`/api/courses/${id}/status`, { status }),
  deleteCourse: (id: string) => apiDelete(`/api/courses/${id}`)
};
