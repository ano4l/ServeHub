export const BOOKING_STATUS = {
  REQUESTED: "REQUESTED",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DECLINED: "DECLINED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  REVIEWABLE: "REVIEWABLE",
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS;

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; step: number }
> = {
  REQUESTED:   { label: "Requested",   color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   step: 0 },
  ACCEPTED:    { label: "Accepted",    color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    step: 1 },
  IN_PROGRESS: { label: "In Progress", color: "text-violet-600",  bg: "bg-violet-50 border-violet-200", step: 2 },
  COMPLETED:   { label: "Completed",   color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200",step: 3 },
  REVIEWABLE:  { label: "Reviewable",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",step: 4 },
  DECLINED:    { label: "Declined",    color: "text-red-600",     bg: "bg-red-50 border-red-200",      step: -1 },
  EXPIRED:     { label: "Expired",     color: "text-stone-500",   bg: "bg-stone-50 border-stone-200",  step: -1 },
  CANCELLED:   { label: "Cancelled",   color: "text-red-500",     bg: "bg-red-50 border-red-200",      step: -1 },
};

export const PROVIDER_STATUS = {
  UNVERIFIED: "UNVERIFIED",
  PENDING_REVIEW: "PENDING_REVIEW",
  VERIFIED: "VERIFIED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
} as const;

export type ProviderStatus = keyof typeof PROVIDER_STATUS;

export const PROVIDER_STATUS_CONFIG: Record<
  ProviderStatus,
  { label: string; color: string; bg: string }
> = {
  UNVERIFIED:     { label: "Unverified",     color: "text-stone-500",   bg: "bg-stone-100" },
  PENDING_REVIEW: { label: "Pending Review", color: "text-amber-600",   bg: "bg-amber-50"  },
  VERIFIED:       { label: "Verified",       color: "text-emerald-600", bg: "bg-emerald-50"},
  SUSPENDED:      { label: "Suspended",      color: "text-orange-600",  bg: "bg-orange-50" },
  REJECTED:       { label: "Rejected",       color: "text-red-600",     bg: "bg-red-50"    },
};

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
  SUPPORT: "SUPPORT",
} as const;

export type UserRole = keyof typeof USER_ROLES;

export const DISPUTE_STATUS = {
  OPEN: "OPEN",
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export const PAYMENT_STATUS = {
  INITIATED: "INITIATED",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export const SERVICE_CATEGORIES = [
  { id: "plumbing",     label: "Plumbing",      icon: "Droplets" },
  { id: "electrical",  label: "Electrical",     icon: "Zap" },
  { id: "cleaning",    label: "Cleaning",       icon: "Sparkles" },
  { id: "gardening",   label: "Gardening",      icon: "Leaf" },
  { id: "painting",    label: "Painting",       icon: "PaintBucket" },
  { id: "carpentry",   label: "Carpentry",      icon: "Hammer" },
  { id: "hvac",        label: "HVAC",           icon: "Wind" },
  { id: "security",    label: "Security",       icon: "Shield" },
  { id: "moving",      label: "Moving",         icon: "Truck" },
  { id: "appliances",  label: "Appliances",     icon: "Settings" },
] as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
export const WS_URL      = process.env.NEXT_PUBLIC_WS_URL  ?? "http://localhost:8080/ws";
