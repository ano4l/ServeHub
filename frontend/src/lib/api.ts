import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./constants";
import type { BookingStatus, ProviderStatus, UserRole } from "./constants";
import { useAuthStore, type User } from "@/store/auth.store";
import { EXPLORE_FEED_FIXTURES } from "@/lib/explore-feed-fixtures";
import { HOME_SERVICE_FIXTURES } from "@/lib/app-home-fixtures";
import { DEMO_CUSTOMER_PROFILE_FIXTURE } from "@/lib/demo-profile-fixtures";
import {
  createDemoBooking,
  getDemoBooking,
  getDemoBookingEvents,
  getDemoBookings,
  getDemoMessages,
  sendDemoMessage,
  updateDemoBookingStatus,
  rescheduleDemoBooking,
  type DemoCreateBookingPayload,
} from "@/lib/demo-booking-store";

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
  async (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("Missing refresh token");
        }

        const { data } = await axios.post<AuthApiResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );
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
  },
);

type ApiResult<T> = Promise<{ data: T }>;

export const DEMO_MODE = true;

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
  category?: string | null;
  distanceKm?: number | null;
  startingPrice?: number | string | null;
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

interface BackendServiceOffering {
  id: number;
  providerId: number;
  providerName: string;
  category: string;
  serviceName: string;
  pricingType: string;
  price: number | string;
  estimatedDurationMinutes: number;
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

interface BackendCustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
}

interface BackendCustomerAddress {
  id: number;
  label: string;
  value: string;
  note?: string | null;
  defaultAddress: boolean;
}

interface BackendSavedPaymentMethod {
  id: number;
  brand: string;
  last4: string;
  holderName: string;
  expiry: string;
  defaultMethod: boolean;
}

interface BackendSocialComment {
  id: number;
  offeringId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

interface BackendSocialFeedPost {
  id: number;
  providerId: number;
  providerName: string;
  providerAvatarUrl?: string | null;
  category: string;
  serviceName: string;
  caption: string;
  city: string;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  likes: number;
  comments: number;
  reposts: number;
  likedByViewer: boolean;
  repostedByViewer: boolean;
  commentPreview: BackendSocialComment[];
}

interface BackendSocialReaction {
  offeringId: number;
  type: "LIKE" | "REPOST";
  active: boolean;
  likes: number;
  reposts: number;
  comments: number;
}

export interface ProviderListItem {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  distanceKm?: number;
  startingPrice?: number;
  verified: boolean;
  category: string;
  responseTime?: string;
  completionRate?: number;
  bio?: string;
  tags: string[];
  availableNow: boolean;
  city: string;
  serviceRadiusKm: number;
  verificationStatus: ProviderStatus;
}

export interface ProviderProfileItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  city: string;
  bio: string;
  serviceRadiusKm: number;
  verificationStatus: ProviderStatus;
  averageRating: number;
  reviewCount: number;
  completionRate: number;
  responseTimeMinutes?: number;
  profileImageUrl?: string;
  latitude?: number;
  longitude?: number;
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
  providerPhone?: string;
  providerEmail?: string;
  serviceCategory?: string;
  imageUrl?: string;
  providerRating?: number;
  providerReviewCount?: number;
  estimatedDuration?: string;
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

export interface ServiceOfferingItem {
  id: string;
  providerId: string;
  providerName: string;
  category: string;
  serviceName: string;
  pricingType: string;
  price: number;
  estimatedDurationMinutes: number;
}

export interface CustomerProfileItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export interface CustomerAddressItem {
  id: string;
  label: string;
  value: string;
  note?: string;
  defaultAddress: boolean;
}

export interface SavedPaymentMethodItem {
  id: string;
  brand: string;
  last4: string;
  holderName: string;
  expiry: string;
  defaultMethod: boolean;
}

export interface SocialCommentItem {
  id: string;
  offeringId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SocialFeedPostItem {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string;
  category: string;
  serviceName: string;
  caption: string;
  city: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  likes: number;
  comments: number;
  reposts: number;
  likedByViewer: boolean;
  repostedByViewer: boolean;
  commentPreview: SocialCommentItem[];
  imageUrl?: string;
}

export interface SocialReactionToggleItem {
  offeringId: string;
  type: "LIKE" | "REPOST";
  active: boolean;
  likes: number;
  reposts: number;
  comments: number;
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
    distanceKm: provider.distanceKm == null ? undefined : Number(provider.distanceKm),
    startingPrice: provider.startingPrice == null ? undefined : Number(provider.startingPrice),
    verified: provider.verificationStatus === "VERIFIED",
    category: provider.category ?? "General services",
    responseTime:
      provider.responseTimeMinutes == null ? undefined : `${provider.responseTimeMinutes} min`,
    completionRate: provider.completionRate == null ? undefined : Number(provider.completionRate),
    bio: provider.bio,
    tags: [provider.city, "ServeHub"].filter(Boolean),
    availableNow: provider.verificationStatus === "VERIFIED",
    city: provider.city,
    serviceRadiusKm: provider.serviceRadiusKm,
    verificationStatus: provider.verificationStatus,
  };
}

function toProviderProfileItem(provider: BackendProvider): ProviderProfileItem {
  return {
    id: String(provider.id),
    userId: String(provider.userId),
    fullName: provider.fullName,
    email: provider.email,
    city: provider.city,
    bio: provider.bio,
    serviceRadiusKm: provider.serviceRadiusKm,
    verificationStatus: provider.verificationStatus,
    averageRating: Number(provider.averageRating ?? 0),
    reviewCount: provider.reviewCount,
    completionRate: Number(provider.completionRate ?? 0),
    responseTimeMinutes: provider.responseTimeMinutes ?? undefined,
    profileImageUrl: provider.profileImageUrl ?? undefined,
    latitude: provider.latitude ?? undefined,
    longitude: provider.longitude ?? undefined,
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

function toServiceOfferingItem(service: BackendServiceOffering): ServiceOfferingItem {
  return {
    id: String(service.id),
    providerId: String(service.providerId),
    providerName: service.providerName,
    category: service.category,
    serviceName: service.serviceName,
    pricingType: service.pricingType,
    price: Number(service.price),
    estimatedDurationMinutes: service.estimatedDurationMinutes,
  };
}

function toCustomerProfileItem(profile: BackendCustomerProfile): CustomerProfileItem {
  return {
    id: String(profile.id),
    fullName: profile.fullName,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    avatarUrl: profile.avatarUrl ?? undefined,
  };
}

function toCustomerAddressItem(address: BackendCustomerAddress): CustomerAddressItem {
  return {
    id: String(address.id),
    label: address.label,
    value: address.value,
    note: address.note ?? undefined,
    defaultAddress: address.defaultAddress,
  };
}

function toSavedPaymentMethodItem(method: BackendSavedPaymentMethod): SavedPaymentMethodItem {
  return {
    id: String(method.id),
    brand: method.brand,
    last4: method.last4,
    holderName: method.holderName,
    expiry: method.expiry,
    defaultMethod: method.defaultMethod,
  };
}

function toSocialCommentItem(comment: BackendSocialComment): SocialCommentItem {
  return {
    id: String(comment.id),
    offeringId: String(comment.offeringId),
    authorId: String(comment.authorId),
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

function toSocialFeedPostItem(post: BackendSocialFeedPost): SocialFeedPostItem {
  return {
    id: String(post.id),
    providerId: String(post.providerId),
    providerName: post.providerName,
    providerAvatarUrl: post.providerAvatarUrl ?? undefined,
    category: post.category,
    serviceName: post.serviceName,
    caption: post.caption,
    city: post.city,
    verified: post.verified,
    rating: Number(post.rating ?? 0),
    reviewCount: post.reviewCount,
    likes: post.likes,
    comments: post.comments,
    reposts: post.reposts,
    likedByViewer: post.likedByViewer,
    repostedByViewer: post.repostedByViewer,
    commentPreview: post.commentPreview.map(toSocialCommentItem),
  };
}

function toSocialReactionToggleItem(item: BackendSocialReaction): SocialReactionToggleItem {
  return {
    offeringId: String(item.offeringId),
    type: item.type,
    active: item.active,
    likes: item.likes,
    reposts: item.reposts,
    comments: item.comments,
  };
}

const DEMO_PROVIDER_PROFILE: ProviderProfileItem = {
  id: "demo-provider-1",
  userId: "demo-user-1",
  fullName: "Demo Provider",
  email: "provider@servehub.local",
  city: "Sandton",
  bio: "Demo provider profile used while API integration is disabled.",
  serviceRadiusKm: 25,
  verificationStatus: "VERIFIED",
  averageRating: 4.8,
  reviewCount: 128,
  completionRate: 97,
  responseTimeMinutes: 12,
  profileImageUrl: undefined,
  latitude: -26.1073,
  longitude: 28.0539,
};

function demoProviders(): ProviderListItem[] {
  return HOME_SERVICE_FIXTURES.map((service, index) => ({
    id: service.providerId,
    name: service.providerName,
    avatar: `https://randomuser.me/api/portraits/men/${index + 10}.jpg`,
    rating: service.rating,
    reviewCount: service.reviews,
    distanceKm: Number((1.2 + index * 1.4).toFixed(1)),
    startingPrice: Number(service.priceLabel.replace(/[^\d.]/g, "")) || undefined,
    verified: true,
    category: service.category,
    responseTime: `${12 + index * 3} min`,
    completionRate: 95 - index,
    bio: service.description,
    tags: service.tags,
    availableNow: service.availableNow,
    city: service.neighborhood,
    serviceRadiusKm: 20,
    verificationStatus: "VERIFIED",
  }));
}

function demoProviderById(id: string): ProviderListItem | null {
  return demoProviders().find((provider) => provider.id === id) ?? null;
}

function demoOfferingsForProvider(providerId: string): ServiceOfferingItem[] {
  const matching = HOME_SERVICE_FIXTURES.filter((service) => service.providerId === providerId);
  const source = matching.length > 0 ? matching : HOME_SERVICE_FIXTURES.filter((_, index) => index < 2);

  return source.map((service, index) => ({
    id: `demo-offering-${HOME_SERVICE_FIXTURES.findIndex((item) => item.id === service.id)}`,
    providerId: service.providerId,
    providerName: service.providerName,
    category: service.category,
    serviceName: service.title,
    pricingType: "FIXED",
    price: Number(service.priceLabel.replace(/[^\d.]/g, "")) || 450,
    estimatedDurationMinutes: 60 + index * 15,
  }));
}

function demoCustomerParticipant() {
  const user = useAuthStore.getState().user;
  return {
    id: user?.id ?? DEMO_CUSTOMER_PROFILE_FIXTURE.id,
    name: user?.fullName ?? DEMO_CUSTOMER_PROFILE_FIXTURE.fullName,
    avatar: user?.avatar ?? DEMO_CUSTOMER_PROFILE_FIXTURE.avatarUrl,
  };
}

function demoCurrentSender(booking: BookingListItem) {
  const { user } = useAuthStore.getState();
  const activeRole = user?.activeRole;

  if (activeRole === "PROVIDER") {
    return {
      sender: booking.provider,
      autoReply: {
        sender: booking.customer,
        content: "Thanks, I see your update. I will keep an eye on this booking from my side.",
      },
    };
  }

  return {
    sender: {
      id: user?.id ?? booking.customer.id,
      name: user?.fullName ?? booking.customer.name,
      avatar: user?.avatar ?? booking.customer.avatar,
    },
    autoReply: {
      sender: booking.provider,
      content:
        booking.status === "IN_PROGRESS"
          ? "I am on-site right now and will send the next update here."
          : "Thanks, I have the note and will keep everything updated in this thread.",
    },
  };
}

function demoSocialFeed(): SocialFeedPostItem[] {
  return EXPLORE_FEED_FIXTURES.map((post, index) => ({
    id: post.postId,
    providerId: post.providerId,
    providerName: post.name,
    providerAvatarUrl: post.avatar || `https://randomuser.me/api/portraits/men/${index + 30}.jpg`,
    category: post.category,
    serviceName: post.headline,
    caption: post.caption,
    city: post.city ?? "Sandton",
    verified: post.verified,
    rating: post.rating,
    reviewCount: post.reviewCount,
    likes: post.likes,
    comments: post.commentsCount,
    reposts: post.reposts,
    likedByViewer: post.likedByViewer ?? false,
    repostedByViewer: post.repostedByViewer ?? false,
    commentPreview: post.comments.map((comment) => ({
      id: comment.id,
      offeringId: post.postId,
      authorId: comment.handle.replace("@", ""),
      authorName: comment.author,
      content: comment.text,
      createdAt: new Date().toISOString(),
    })),
  }));
}

export default api;

export const authApi = {
  async login(
    email: string,
    password: string,
  ): ApiResult<ReturnType<typeof normalizeAuthPayload>> {
    const { data } = await api.post<AuthApiResponse>("/auth/login", { email, password });
    return { data: normalizeAuthPayload(data) };
  },
  async register(
    data: RegisterPayload,
  ): ApiResult<ReturnType<typeof normalizeAuthPayload>> {
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
    if (DEMO_MODE) {
      void params;
      return { data: { content: demoProviders() } };
    }
    const { data } = await api.get<{ content?: BackendProvider[] }>("/providers", { params });
    return { data: { content: (data.content ?? []).map(toProviderListItem) } };
  },
  async getById(id: string): ApiResult<ProviderProfileItem> {
    if (DEMO_MODE) {
      const match = demoProviderById(id);
      return {
        data: match
          ? {
              ...DEMO_PROVIDER_PROFILE,
              id: match.id,
              userId: `user-${match.id}`,
              fullName: match.name,
              email: `${match.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@servehub.demo`,
              city: match.city,
              bio: match.bio ?? DEMO_PROVIDER_PROFILE.bio,
              serviceRadiusKm: match.serviceRadiusKm,
              averageRating: match.rating,
              reviewCount: match.reviewCount,
              completionRate: match.completionRate ?? DEMO_PROVIDER_PROFILE.completionRate,
              responseTimeMinutes: Number(match.responseTime?.replace(/[^\d]/g, "")) || 12,
              profileImageUrl: match.avatar,
            }
          : { ...DEMO_PROVIDER_PROFILE, id, userId: `user-${id}`, fullName: `Provider ${id}` },
      };
    }
    const { data } = await api.get<BackendProvider>(`/providers/${id}`);
    return { data: toProviderProfileItem(data) };
  },
  async getProfile(): ApiResult<ProviderProfileItem> {
    if (DEMO_MODE) {
      return { data: DEMO_PROVIDER_PROFILE };
    }
    const { data } = await api.get<BackendProvider>("/providers/me");
    return { data: toProviderProfileItem(data) };
  },
  async update(data: Partial<ProviderProfileUpdatePayload>): ApiResult<ProviderProfileItem> {
    const response = await api.put<BackendProvider>("/providers/me", data);
    return { data: toProviderProfileItem(response.data) };
  },
  uploadDoc: (file: FormData) =>
    api.post("/providers/me/documents", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  async getOfferings(providerId: string): ApiResult<ServiceOfferingItem[]> {
    if (DEMO_MODE) {
      return { data: demoOfferingsForProvider(providerId) };
    }
    const { data } = await api.get<BackendServiceOffering[]>(
      `/catalog/services/providers/${providerId}/offerings`,
    );
    return { data: data.map(toServiceOfferingItem) };
  },
};

export const catalogApi = {
  getCategories: () => api.get("/categories"),
  async getServices(categoryId?: string): ApiResult<ServiceOfferingItem[]> {
    const { data } = await api.get<BackendServiceOffering[]>("/catalog/services", {
      params: { category: categoryId },
    });
    return { data: data.map(toServiceOfferingItem) };
  },
  async getOfferings(params?: object): ApiResult<ServiceOfferingItem[]> {
    const { data } = await api.get<BackendServiceOffering[]>(
      "/catalog/services/offerings",
      { params },
    );
    return { data: data.map(toServiceOfferingItem) };
  },
  createOffering: (data: object) => api.post("/catalog/services/offerings", data),
  updateOffering: (id: string, data: object) =>
    api.put(`/catalog/services/offerings/${id}`, data),
  deleteOffering: (id: string) => api.delete(`/catalog/services/offerings/${id}`),
};

export const bookingsApi = {
  async getAll(params?: BookingFilterParams): ApiResult<{ content: BookingListItem[] }> {
    if (DEMO_MODE) {
      return { data: { content: getDemoBookings(params) } };
    }
    void params;
    const { data } = await api.get<BackendBooking[]>("/bookings");
    return { data: { content: data.map(toBookingListItem) } };
  },
  async getById(id: string): ApiResult<BookingListItem> {
    if (DEMO_MODE) {
      const match = getDemoBooking(id) ?? getDemoBookings()[0];
      return { data: match };
    }
    const { data } = await api.get<BackendBooking>(`/bookings/${id}`);
    return { data: toBookingListItem(data) };
  },
  async create(data: CreateBookingPayload): ApiResult<BookingListItem> {
    if (DEMO_MODE) {
      const booking = createDemoBooking(
        data as DemoCreateBookingPayload,
        demoCustomerParticipant(),
      );
      return { data: booking };
    }

    const {
      demoProviderId,
      demoProviderName,
      demoProviderAvatar,
      demoProviderPhone,
      demoProviderEmail,
      demoServiceName,
      demoServiceCategory,
      demoImageUrl,
      demoPrice,
      demoProviderRating,
      demoProviderReviewCount,
      demoEstimatedDuration,
      ...payload
    } = data;
    void demoProviderId;
    void demoProviderName;
    void demoProviderAvatar;
    void demoProviderPhone;
    void demoProviderEmail;
    void demoServiceName;
    void demoServiceCategory;
    void demoImageUrl;
    void demoPrice;
    void demoProviderRating;
    void demoProviderReviewCount;
    void demoEstimatedDuration;

    const response = await api.post<BackendBooking>("/bookings", payload);
    return { data: toBookingListItem(response.data) };
  },
  async accept(id: string) {
    if (DEMO_MODE) {
      const booking = getDemoBooking(id);
      return {
        data: updateDemoBookingStatus(id, {
          status: "ACCEPTED",
          detail: "The provider accepted this appointment in demo mode.",
          message: booking
            ? {
                sender: booking.provider,
                content: "I have confirmed the appointment. See you at the scheduled time.",
              }
            : undefined,
        }),
      };
    }
    return api.post(`/bookings/${id}/accept`);
  },
  async decline(id: string, reason: string) {
    if (DEMO_MODE) {
      const booking = getDemoBooking(id);
      return {
        data: updateDemoBookingStatus(id, {
          status: "DECLINED",
          detail: `The provider declined this appointment: ${reason}`,
          cancelledReason: reason,
          message: booking
            ? {
                sender: booking.provider,
                content: `I need to decline this request for now: ${reason}`,
              }
            : undefined,
        }),
      };
    }
    return api.post(`/bookings/${id}/decline`, { reason });
  },
  async start(id: string) {
    if (DEMO_MODE) {
      const booking = getDemoBooking(id);
      return {
        data: updateDemoBookingStatus(id, {
          status: "IN_PROGRESS",
          detail: "The provider started the job.",
          message: booking
            ? {
                sender: booking.provider,
                content: "I am on-site and the job is now in progress.",
              }
            : undefined,
        }),
      };
    }
    return api.post(`/bookings/${id}/start`);
  },
  async complete(id: string, data?: object) {
    if (DEMO_MODE) {
      const booking = getDemoBooking(id);
      void data;
      return {
        data: updateDemoBookingStatus(id, {
          status: "COMPLETED",
          detail: "The provider marked the appointment complete.",
          message: booking
            ? {
                sender: booking.provider,
                content: "Everything is wrapped up. Thanks again for booking through ServeHub.",
              }
            : undefined,
        }),
      };
    }
    return api.post(`/bookings/${id}/complete`, data);
  },
  async cancel(id: string, reason: string) {
    if (DEMO_MODE) {
      return {
        data: updateDemoBookingStatus(id, {
          status: "CANCELLED",
          detail: `The booking was cancelled: ${reason}`,
          cancelledReason: reason,
        }),
      };
    }
    return api.post(`/bookings/${id}/cancel`, { reason });
  },
  async reschedule(id: string, data: { scheduledAt?: string; date?: string; time?: string }) {
    if (DEMO_MODE) {
      const scheduledAt =
        data.scheduledAt ??
        (data.date && data.time ? new Date(`${data.date}T${data.time}`).toISOString() : null);
      if (!scheduledAt) {
        return { data: getDemoBooking(id) };
      }

      return {
        data: rescheduleDemoBooking(
          id,
          scheduledAt,
          `The booking was rescheduled to ${new Date(scheduledAt).toLocaleString("en-ZA")}.`,
        ),
      };
    }
    return api.post(`/bookings/${id}/reschedule`, data);
  },
  async getEvents(id: string) {
    if (DEMO_MODE) {
      return { data: getDemoBookingEvents(id) };
    }
    return api.get(`/bookings/${id}/events`);
  },
};

export const messagesApi = {
  async getThread(
    bookingId: string,
    params?: object,
  ): ApiResult<{ content: ChatMessageItem[] }> {
    if (DEMO_MODE) {
      void params;
      return { data: { content: getDemoMessages(bookingId) } };
    }
    const { data } = await api.get<{ content?: BackendChatMessage[] }>(
      `/bookings/${bookingId}/messages`,
      { params },
    );
    return { data: { content: (data.content ?? []).map(toChatMessageItem) } };
  },
  async send(bookingId: string, content: string): ApiResult<ChatMessageItem> {
    if (DEMO_MODE) {
      const booking = getDemoBooking(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const { sender, autoReply } = demoCurrentSender(booking);
      const message = sendDemoMessage(bookingId, sender, content, autoReply);
      if (!message) {
        throw new Error("Unable to save message");
      }
      return { data: message };
    }
    const { data } = await api.post<BackendChatMessage>(
      `/bookings/${bookingId}/messages`,
      { content },
    );
    return { data: toChatMessageItem(data) };
  },
};

export const customerApi = {
  async getProfile(): ApiResult<CustomerProfileItem> {
    if (DEMO_MODE) {
      return {
        data: {
          id: DEMO_CUSTOMER_PROFILE_FIXTURE.id,
          fullName: DEMO_CUSTOMER_PROFILE_FIXTURE.fullName,
          email: DEMO_CUSTOMER_PROFILE_FIXTURE.email,
          phoneNumber: DEMO_CUSTOMER_PROFILE_FIXTURE.phoneNumber,
          avatarUrl: DEMO_CUSTOMER_PROFILE_FIXTURE.avatarUrl,
        },
      };
    }
    const { data } = await api.get<BackendCustomerProfile>("/customers/me");
    return { data: toCustomerProfileItem(data) };
  },
  async updateProfile(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    avatarUrl?: string;
  }): ApiResult<CustomerProfileItem> {
    const response = await api.put<BackendCustomerProfile>("/customers/me", data);
    return { data: toCustomerProfileItem(response.data) };
  },
  async getAddresses(): ApiResult<CustomerAddressItem[]> {
    if (DEMO_MODE) {
      return {
        data: [
          {
            id: "demo-address-1",
            label: "Home",
            value: "83 Rivonia Road, Sandton",
            note: "Main gate",
            defaultAddress: true,
          },
          {
            id: "demo-address-2",
            label: "Office",
            value: "129 Rivonia Road, Sandown",
            note: "Reception",
            defaultAddress: false,
          },
        ],
      };
    }
    const { data } = await api.get<BackendCustomerAddress[]>("/customers/me/addresses");
    return { data: data.map(toCustomerAddressItem) };
  },
  async createAddress(data: {
    label: string;
    value: string;
    note?: string;
    defaultAddress?: boolean;
  }): ApiResult<CustomerAddressItem> {
    const response = await api.post<BackendCustomerAddress>(
      "/customers/me/addresses",
      data,
    );
    return { data: toCustomerAddressItem(response.data) };
  },
  async updateAddress(id: string, data: {
    label: string;
    value: string;
    note?: string;
    defaultAddress?: boolean;
  }): ApiResult<CustomerAddressItem> {
    const response = await api.put<BackendCustomerAddress>(
      `/customers/me/addresses/${id}`,
      data,
    );
    return { data: toCustomerAddressItem(response.data) };
  },
  deleteAddress: (id: string) => api.delete(`/customers/me/addresses/${id}`),
  async getPaymentMethods(): ApiResult<SavedPaymentMethodItem[]> {
    const { data } = await api.get<BackendSavedPaymentMethod[]>(
      "/customers/me/payment-methods",
    );
    return { data: data.map(toSavedPaymentMethodItem) };
  },
  async createPaymentMethod(data: {
    holderName: string;
    cardNumber: string;
    expiry: string;
    defaultMethod?: boolean;
  }): ApiResult<SavedPaymentMethodItem> {
    const response = await api.post<BackendSavedPaymentMethod>(
      "/customers/me/payment-methods",
      data,
    );
    return { data: toSavedPaymentMethodItem(response.data) };
  },
  async updatePaymentMethod(id: string, data: {
    holderName?: string;
    expiry?: string;
    defaultMethod?: boolean;
  }): ApiResult<SavedPaymentMethodItem> {
    const response = await api.put<BackendSavedPaymentMethod>(
      `/customers/me/payment-methods/${id}`,
      data,
    );
    return { data: toSavedPaymentMethodItem(response.data) };
  },
  deletePaymentMethod: (id: string) => api.delete(`/customers/me/payment-methods/${id}`),
};

export const socialApi = {
  async getFeed(params?: {
    category?: string;
    q?: string;
    size?: number;
  }): ApiResult<SocialFeedPostItem[]> {
    if (DEMO_MODE) {
      return { data: demoSocialFeed() };
    }
    const { data } = await api.get<BackendSocialFeedPost[]>("/social/feed", { params });
    return { data: data.map(toSocialFeedPostItem) };
  },
  async getComments(offeringId: string): ApiResult<SocialCommentItem[]> {
    const { data } = await api.get<BackendSocialComment[]>(
      `/social/feed/${offeringId}/comments`,
    );
    return { data: data.map(toSocialCommentItem) };
  },
  async addComment(
    offeringId: string,
    content: string,
  ): ApiResult<SocialCommentItem> {
    const { data } = await api.post<BackendSocialComment>(
      `/social/feed/${offeringId}/comments`,
      { content },
    );
    return { data: toSocialCommentItem(data) };
  },
  async toggleLike(offeringId: string): ApiResult<SocialReactionToggleItem> {
    const { data } = await api.post<BackendSocialReaction>(
      `/social/feed/${offeringId}/likes/toggle`,
    );
    return { data: toSocialReactionToggleItem(data) };
  },
  async toggleRepost(offeringId: string): ApiResult<SocialReactionToggleItem> {
    const { data } = await api.post<BackendSocialReaction>(
      `/social/feed/${offeringId}/reposts/toggle`,
    );
    return { data: toSocialReactionToggleItem(data) };
  },
};

export const reviewsApi = {
  getForProvider: (providerId: string) => api.get(`/providers/${providerId}/reviews`),
  create: (bookingId: string, data: ReviewPayload) =>
    api.post(`/bookings/${bookingId}/review`, data),
  getByBooking: (bookingId: string) => api.get(`/bookings/${bookingId}/review`),
};

export const disputesApi = {
  getAll: (params?: object) => api.get("/disputes", { params }),
  getById: (id: string) => api.get(`/disputes/${id}`),
  create: (bookingId: string, data: object) =>
    api.post("/disputes", { bookingId, ...data }),
  update: (id: string, data: object) => api.put(`/disputes/${id}`, data),
  resolve: (id: string, data: object) => api.post(`/disputes/${id}/resolve`, data),
};

export const notificationsApi = {
  getAll: (params?: object) => {
    if (DEMO_MODE) {
      void params;
      return Promise.resolve({
        data: {
          content: [
            {
              id: "demo-notif-1",
              title: "Booking update",
              message: "Your demo booking is on the way.",
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    }
    return api.get("/notifications", { params });
  },
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
  rejectProvider: (id: string, reason: string) =>
    api.post(`/admin/verifications/${id}/reject`, { reason }),
  getDisputes: (params?: object) => api.get("/admin/disputes", { params }),
  getBookings: (params?: object) => api.get("/admin/bookings", { params }),
  async getAuditLogs(params?: object): ApiResult<{
    content: {
      id: string;
      type: string;
      description: string;
      timestamp: string;
      severity: "low" | "medium" | "high";
    }[];
  }> {
    const { data } = await api.get<{ content?: BackendAuditLog[] }>(
      "/admin/audit-logs",
      { params },
    );
    return {
      data: {
        content: (data.content ?? []).map((entry) => ({
          id: String(entry.id),
          type: entry.action,
          description: entry.detail,
          timestamp: entry.createdAt,
          severity: entry.action.includes("REJECT")
            ? "high"
            : entry.action.includes("APPROVE")
              ? "medium"
              : "low",
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
    if (DEMO_MODE) {
      return {
        data: {
          available: 5240,
          pending: 740,
          totalEarnings: 34120,
          thisMonth: 6120,
        },
      };
    }
    const { data } = await api.get<BackendWalletBalance>("/wallet/balance");
    return { data };
  },
  getTransactions: (params?: object) => {
    if (DEMO_MODE) {
      void params;
      return Promise.resolve({
        data: {
          content: [
            {
              id: 1,
              type: "EARNING",
              amount: 850,
              reference: "DEMO-TXN-001",
              description: "Demo payout credit",
              balanceAfter: 5240,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    }
    return api.get("/wallet/transactions", { params });
  },
  getPayouts: (params?: object) => {
    if (DEMO_MODE) {
      void params;
      return Promise.resolve({
        data: {
          content: [
            {
              id: 1,
              type: "PAYOUT",
              amount: 1500,
              reference: "DEMO-PO-001",
              description: "Demo payout request",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    }
    return api.get("/wallet/payouts", { params });
  },
  requestPayout: (amount: number) => api.post("/wallet/payouts", { amount }),
};

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
  city?: string;
  serviceRadiusKm?: number;
  bio?: string;
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

export interface ProviderProfileUpdatePayload {
  bio: string;
  city: string;
  serviceRadiusKm: number;
  latitude?: number;
  longitude?: number;
  profileImageUrl?: string;
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
  demoProviderId?: string;
  demoProviderName?: string;
  demoProviderAvatar?: string;
  demoProviderPhone?: string;
  demoProviderEmail?: string;
  demoServiceName?: string;
  demoServiceCategory?: string;
  demoImageUrl?: string;
  demoPrice?: number;
  demoProviderRating?: number;
  demoProviderReviewCount?: number;
  demoEstimatedDuration?: string;
}

export interface ReviewPayload {
  rating: number;
  qualityRating: number;
  punctualityRating: number;
  professionalismRating: number;
  comment: string;
  photos?: string[];
}
