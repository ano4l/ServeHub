import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./constants";
import type { BookingStatus, ProviderStatus, UserRole } from "./constants";
import type { User } from "@/store/auth.store";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  async (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("Missing refresh token");
        }
        const { data } = await axios.post<AuthApiResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const normalized = normalizeAuthPayload(data);
        localStorage.setItem("access_token", normalized.accessToken);
        localStorage.setItem("refresh_token", normalized.refreshToken);
        original.headers.Authorization = `Bearer ${normalized.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

type ApiResult<T> = Promise<{ data: T }>;

interface AuthApiResponse {
  userId: number;
  providerId: number | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  emailVerified: boolean;
  accessToken: string;
  refreshToken: string;
}

interface BackendProvider {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  city: string;
  bio: string;
  serviceRadiusKm: number;
  verificationStatus: ProviderStatus;
  averageRating: number | null;
  reviewCount: number;
  completionRate: number | null;
  responseTimeMinutes: number | null;
  profileImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface BackendBooking {
  id: number;
  status: BookingStatus;
  customerId: number;
  customerName: string;
  providerId: number;
  providerName: string;
  serviceOfferingId: number;
  serviceName: string;
  scheduledFor: string;
  address: string;
  notes?: string | null;
  quotedPrice?: number | string | null;
  cancelledReason?: string | null;
  createdAt: string | null;
}

interface BackendChatMessage {
  id: number;
  bookingId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
}

interface BackendWalletBalance {
  available: number;
  pending: number;
  totalEarnings: number;
  thisMonth: number;
}

interface BackendAuditLog {
  id: number;
  actorName: string;
  action: string;
  entityType: string;
  entityId: number | null;
  detail: string;
  createdAt: string;
}

interface BackendAnalytics {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  pendingVerifications: number;
  openDisputes: number;
  totalReviews: number;
  revenue: number;
  completionRate: number;
}

export interface ProviderListItem {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  category: string;
  bio?: string;
  tags: string[];
  availableNow: boolean;
  city: string;
  serviceRadiusKm: number;
  verificationStatus: ProviderStatus;
}

export interface BookingListItem {
  id: string;
  reference: string;
  status: BookingStatus;
  provider: { id: string; name: string; avatar?: string };
  customer: { id: string; name: string; avatar?: string };
  service: string;
  serviceOfferingId: string;
  scheduledAt: string;
  address: string;
  notes?: string;
  price?: number;
  cancelledReason?: string;
  createdAt: string;
  bookingType: "AT_CUSTOMER";
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  sentAt: string;
  read: boolean;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "User";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function normalizeAuthPayload(payload: AuthApiResponse) {
  const { firstName, lastName } = splitFullName(payload.fullName || payload.email);
  const user: User = {
    id: String(payload.userId),
    email: payload.email,
    fullName: payload.fullName || payload.email,
    firstName,
    lastName,
    phone: payload.phoneNumber ?? undefined,
    roles: [payload.role],
    activeRole: payload.role,
    emailVerified: payload.emailVerified,
    phoneVerified: false,
    createdAt: new Date().toISOString(),
  };

  return {
    user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

function toProviderListItem(provider: BackendProvider): ProviderListItem {
  return {
    id: String(provider.id),
    name: provider.fullName,
    avatar: provider.profileImageUrl ?? undefined,
    rating: Number(provider.averageRating ?? 0),
    reviewCount: provider.reviewCount,
    verified: provider.verificationStatus === "VERIFIED",
    category: "General services",
    bio: provider.bio,
    tags: [provider.city, "ServeHub"].filter(Boolean),
    availableNow: provider.verificationStatus === "VERIFIED",
    city: provider.city,
    serviceRadiusKm: provider.serviceRadiusKm,
    verificationStatus: provider.verificationStatus,
  };
}

function toBookingListItem(booking: BackendBooking): BookingListItem {
  return {
    id: String(booking.id),
    reference: `BK-${booking.id}`,
    status: booking.status,
    provider: { id: String(booking.providerId), name: booking.providerName },
    customer: { id: String(booking.customerId), name: booking.customerName },
    service: booking.serviceName,
    serviceOfferingId: String(booking.serviceOfferingId),
    scheduledAt: booking.scheduledFor,
    address: booking.address,
    notes: booking.notes ?? undefined,
    price: booking.quotedPrice == null ? undefined : Number(booking.quotedPrice),
    cancelledReason: booking.cancelledReason ?? undefined,
    createdAt: booking.createdAt ?? booking.scheduledFor,
    bookingType: "AT_CUSTOMER",
  };
}

function toChatMessageItem(message: BackendChatMessage): ChatMessageItem {
  return {
    id: String(message.id),
    senderId: String(message.senderId),
    senderName: message.senderName,
    content: message.content,
    sentAt: message.sentAt,
    read: true,
  };
}

export default api;

export const authApi = {
  async login(email: string, password: string): ApiResult<ReturnType<typeof normalizeAuthPayload>> {
    const { data } = await api.post<AuthApiResponse>("/auth/login", { email, password });
    return { data: normalizeAuthPayload(data) };
  },
  async register(data: RegisterPayload): ApiResult<ReturnType<typeof normalizeAuthPayload>> {
    const { firstName, lastName, phone, ...rest } = data;
    const payload = {
      ...rest,
      fullName: `${firstName} ${lastName}`.trim(),
      phoneNumber: phone,
    };
    const response = await api.post<AuthApiResponse>("/auth/register", payload);
    return { data: normalizeAuthPayload(response.data) };
  },
  async refresh(refreshToken: string): ApiResult<ReturnType<typeof normalizeAuthPayload>> {
    const { data } = await api.post<AuthApiResponse>("/auth/refresh", { refreshToken });
    return { data: normalizeAuthPayload(data) };
  },
  async logout(): ApiResult<{ success: true }> {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return { data: { success: true } };
  },
  resetPassword: (email: string) => api.post("/auth/forgot-password", { email }),
};

export const providersApi = {
  async getAll(params?: ProviderSearchParams): ApiResult<{ content: ProviderListItem[] }> {
    const { data } = await api.get<{ content?: BackendProvider[] }>("/providers", { params });
    return { data: { content: (data.content ?? []).map(toProviderListItem) } };
  },
  getById: (id: string) => api.get(`/providers/${id}`),
  getProfile: () => api.get("/providers/me"),
  update: (data: Partial<ProviderProfile>) => api.put("/providers/me", data),
  uploadDoc: (file: FormData) => api.post("/providers/me/documents", file, { headers: { "Content-Type": "multipart/form-data" } }),
  getOfferings: (providerId: string) => api.get(`/providers/${providerId}/offerings`),
};

export const catalogApi = {
  getCategories: () => api.get("/categories"),
  getServices: (categoryId?: string) => api.get("/catalog/services", { params: { category: categoryId } }),
  getOfferings: (params?: object) => api.get("/offerings", { params }),
  createOffering: (data: object) => api.post("/offerings", data),
  updateOffering: (id: string, data: object) => api.put(`/offerings/${id}`, data),
  deleteOffering: (id: string) => api.delete(`/offerings/${id}`),
};

export const bookingsApi = {
  async getAll(params?: BookingFilterParams): ApiResult<{ content: BookingListItem[] }> {
    void params;
    const { data } = await api.get<BackendBooking[]>("/bookings");
    return { data: { content: data.map(toBookingListItem) } };
  },
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: CreateBookingPayload) => api.post("/bookings", data),
  accept: (id: string) => api.post(`/bookings/${id}/accept`),
  decline: (id: string, reason: string) => api.post(`/bookings/${id}/decline`, { reason }),
  start: (id: string) => api.post(`/bookings/${id}/start`),
  complete: (id: string, data?: object) => api.post(`/bookings/${id}/complete`, data),
  cancel: (id: string, reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  reschedule: (id: string, data: object) => api.post(`/bookings/${id}/reschedule`, data),
  getEvents: (id: string) => api.get(`/bookings/${id}/events`),
};

export const messagesApi = {
  async getThread(bookingId: string, params?: object): ApiResult<{ content: ChatMessageItem[] }> {
    const { data } = await api.get<{ content?: BackendChatMessage[] }>(`/bookings/${bookingId}/messages`, { params });
    return { data: { content: (data.content ?? []).map(toChatMessageItem) } };
  },
  async send(bookingId: string, content: string): ApiResult<ChatMessageItem> {
    const { data } = await api.post<BackendChatMessage>(`/bookings/${bookingId}/messages`, { content });
    return { data: toChatMessageItem(data) };
  },
};

export const reviewsApi = {
  getForProvider: (providerId: string) => api.get(`/providers/${providerId}/reviews`),
  create: (bookingId: string, data: ReviewPayload) => api.post(`/bookings/${bookingId}/review`, data),
  getByBooking: (bookingId: string) => api.get(`/bookings/${bookingId}/review`),
};

export const disputesApi = {
  getAll: (params?: object) => api.get("/disputes", { params }),
  getById: (id: string) => api.get(`/disputes/${id}`),
  create: (bookingId: string, data: object) => api.post("/disputes", { bookingId, ...data }),
  update: (id: string, data: object) => api.put(`/disputes/${id}`, data),
  resolve: (id: string, data: object) => api.post(`/disputes/${id}/resolve`, data),
};

export const notificationsApi = {
  getAll: (params?: object) => api.get("/notifications", { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  getPrefs: () => api.get("/notifications/preferences"),
  updatePrefs: (data: object) => api.put("/notifications/preferences", data),
};

export const adminApi = {
  getUsers: (params?: object) => api.get("/admin/users", { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: object) => api.put(`/admin/users/${id}`, data),
  getVerificationQueue: () => api.get("/admin/verifications"),
  approveProvider: (id: string) => api.post(`/admin/verifications/${id}/approve`),
  rejectProvider: (id: string, reason: string) => api.post(`/admin/verifications/${id}/reject`, { reason }),
  getDisputes: (params?: object) => api.get("/admin/disputes", { params }),
  getBookings: (params?: object) => api.get("/admin/bookings", { params }),
  async getAuditLogs(params?: object): ApiResult<{ content: { id: string; type: string; description: string; timestamp: string; severity: "low" | "medium" | "high" }[] }> {
    const { data } = await api.get<{ content?: BackendAuditLog[] }>("/admin/audit-logs", { params });
    return {
      data: {
        content: (data.content ?? []).map((entry) => ({
          id: String(entry.id),
          type: entry.action,
          description: entry.detail,
          timestamp: entry.createdAt,
          severity: entry.action.includes("REJECT") ? "high" : entry.action.includes("APPROVE") ? "medium" : "low",
        })),
      },
    };
  },
  async getAnalytics(): ApiResult<{
    totalUsers: number;
    totalProviders: number;
    totalBookings: number;
    pendingVerifications: number;
    openDisputes: number;
    revenue: number;
    avgRating: number;
    completionRate: number;
  }> {
    const { data } = await api.get<BackendAnalytics>("/admin/analytics");
    return {
      data: {
        totalUsers: data.totalUsers,
        totalProviders: data.totalProviders,
        totalBookings: data.totalBookings,
        pendingVerifications: data.pendingVerifications,
        openDisputes: data.openDisputes,
        revenue: data.revenue,
        avgRating: 0,
        completionRate: data.completionRate,
      },
    };
  },
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data: object) => api.post("/admin/categories", data),
  updateCategory: (id: string, data: object) => api.put(`/admin/categories/${id}`, data),
};

export const walletApi = {
  async getBalance(): ApiResult<BackendWalletBalance> {
    const { data } = await api.get<BackendWalletBalance>("/wallet/balance");
    return { data };
  },
  getTransactions: (params?: object) => api.get("/wallet/transactions", { params }),
  getPayouts: (params?: object) => api.get("/wallet/payouts", { params }),
  requestPayout: (amount: number) => api.post("/wallet/payouts", { amount }),
};

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
}

export interface ProviderSearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  categoryId?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  availableToday?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

export interface ProviderProfile {
  bio: string;
  experience: string;
  languages: string[];
  serviceRadius: number;
  baseLat: number;
  baseLng: number;
  baseAddress: string;
  workingHours: Record<string, { start: string; end: string; enabled: boolean }>;
}

export interface BookingFilterParams {
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateBookingPayload {
  offeringId: string;
  scheduledAt: string;
  address?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  photos?: string[];
  bookingType: "AT_PROVIDER" | "AT_CUSTOMER";
}

export interface ReviewPayload {
  rating: number;
  qualityRating: number;
  punctualityRating: number;
  professionalismRating: number;
  comment: string;
  photos?: string[];
}
