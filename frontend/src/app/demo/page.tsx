"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Droplets,
  Gavel,
  HandHelping,
  Heart,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  PaintBucket,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Truck,
  UserRound,
  Wind,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  demoAddressBook,
  demoBookings,
  demoPaymentMethods,
  demoUserProfile,
  homeServices,
  orderHistory,
  profileSettings,
  profileStats,
} from "@/lib/demo-data";
import {
  bookingsApi,
  catalogApi,
  customerApi,
  messagesApi,
  notificationsApi,
  providersApi,
  socialApi,
  type ChatMessageItem,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatRelativeTime } from "@/lib/utils";

type AppTab = "home" | "explore" | "bookings" | "alerts" | "profile";
type NotificationKind = "booking" | "message" | "payment" | "review" | "system";
type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: NotificationKind;
  action?: string;
};
type ModalState =
  | null
  | "address"
  | "profile"
  | "payment"
  | "booking"
  | "bookingSuccess"
  | "comments";
type BookingMessage = (typeof demoBookings)[number]["thread"][number];
type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";
type PaymentMethod = (typeof demoPaymentMethods)[number];
type AddressBookItem = (typeof demoAddressBook)[number];
type FeedComment = {
  id: string;
  author: string;
  handle: string;
  text: string;
  timeAgo: string;
};
type AppService = (typeof homeServices)[number] & {
  live?: boolean;
  offeringId?: string;
  providerId?: string;
};
type AppBooking = Omit<(typeof demoBookings)[number], "status"> & {
  status: BookingStatus;
  live?: boolean;
  backendId?: string;
};

const COLORS = {
  background: "#F8F8FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F2F2F5",
  primary: "#1A1A2E",
  accent: "#6C63FF",
  accentLight: "#EEEDFF",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#ADB5BD",
  divider: "#F3F4F6",
  success: "#43A047",
  warning: "#FFA726",
  error: "#E53935",
  info: "#42A5F5",
};

const pastelCards = [
  "#DCE8F5",
  "#DAEFD8",
  "#FFF3D4",
  "#FADDE1",
  "#E8DEF8",
  "#D0F0E0",
  "#FFE4CC",
  "#D4F1F9",
];

const fallbackNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Booking Accepted!",
    message: "Lindiwe Clean Studio accepted your move-out clean.",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    kind: "booking",
    action: "Open",
  },
  {
    id: "n2",
    title: "New Message",
    message: "Nomvula Plumbing Co. sent an update on your emergency job.",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
    kind: "message",
    action: "Reply",
  },
  {
    id: "n3",
    title: "Payment Required",
    message: "Your pool cleaning invoice is ready for payment.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
    kind: "payment",
    action: "Pay Now",
  },
];

function categoryIcon(slug: string) {
  switch (slug.toLowerCase()) {
    case "plumbing":
      return Droplets;
    case "electrical":
      return Wrench;
    case "cleaning":
      return Sparkles;
    case "gardening":
      return Leaf;
    case "painting":
      return PaintBucket;
    case "hvac":
      return Wind;
    case "security":
      return Shield;
    case "moving":
      return Truck;
    default:
      return HandHelping;
  }
}

function bookingMeta(status: BookingStatus) {
  switch (status) {
    case "REQUESTED":
      return { label: "Pending", fg: COLORS.warning, bg: "rgba(255,167,38,0.12)" };
    case "ACCEPTED":
      return { label: "Accepted", fg: COLORS.info, bg: "rgba(66,165,245,0.12)" };
    case "IN_PROGRESS":
      return { label: "Active", fg: COLORS.accent, bg: "rgba(108,99,255,0.12)" };
    case "COMPLETED":
      return { label: "Done", fg: COLORS.success, bg: "rgba(67,160,71,0.12)" };
    case "DECLINED":
      return { label: "Declined", fg: COLORS.error, bg: "rgba(229,57,53,0.12)" };
    case "CANCELLED":
      return { label: "Cancelled", fg: COLORS.textSecondary, bg: "rgba(107,114,128,0.12)" };
  }
}

function notificationMeta(kind: NotificationKind) {
  switch (kind) {
    case "booking":
      return { icon: CalendarDays, fg: COLORS.info, bg: "#DCE8F5" };
    case "message":
      return { icon: MessageCircle, fg: COLORS.primary, bg: "#E8DEF8" };
    case "payment":
      return { icon: CreditCard, fg: COLORS.warning, bg: "#FFF3D4" };
    case "review":
      return { icon: Star, fg: "#FFB800", bg: "#FFF3D4" };
    default:
      return { icon: Bell, fg: COLORS.textSecondary, bg: COLORS.surfaceAlt };
  }
}

function formatPrice(amount?: number) {
  if (amount == null || Number.isNaN(amount)) {
    return "From R0";
  }
  return `From R${Math.round(amount)}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function buildChecklist(status: BookingStatus) {
  return [
    { label: "Request submitted", complete: true },
    {
      label: "Provider accepted",
      complete: ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(status),
    },
    {
      label: "Provider en route",
      complete: ["IN_PROGRESS", "COMPLETED"].includes(status),
    },
    { label: "Service complete", complete: status === "COMPLETED" },
  ];
}

function buildScheduledAt(dateLabel: string, timeLabel: string) {
  const now = new Date();
  const scheduled = new Date(now);
  if (dateLabel.toLowerCase() === "tomorrow") {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  const [hoursText, minutesText] = timeLabel.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
    scheduled.setHours(hours, minutes, 0, 0);
  }

  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled.toISOString();
}

function normalizeExpiryInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidExpiryInput(value: string) {
  if (!/^\d{2}\/\d{2}$/.test(value.trim())) {
    return false;
  }
  const [monthText, yearText] = value.trim().split("/");
  const month = Number(monthText);
  const year = Number(yearText);
  if (month < 1 || month > 12) {
    return false;
  }
  const expiry = new Date(2000 + year, month, 0, 23, 59, 59, 999);
  return expiry.getTime() > Date.now();
}

function serviceArtwork(serviceName: string, category: string) {
  const normalized = `${serviceName} ${category}`.toLowerCase();
  return (
    homeServices.find((service) =>
      normalized.includes(service.category.toLowerCase()) ||
      service.title.toLowerCase().includes(serviceName.toLowerCase()),
    )?.imageUrl ?? homeServices[0].imageUrl
  );
}

function toBookingMessage(message: ChatMessageItem, currentUserId?: string): BookingMessage {
  return {
    id: message.id,
    sender: message.senderName,
    text: message.content,
    time: formatRelativeTime(message.sentAt),
    own: message.senderId === currentUserId,
  };
}

function toNotificationKind(type?: string): NotificationKind {
  const normalized = type?.toLowerCase() ?? "";
  if (normalized.includes("message")) return "message";
  if (normalized.includes("payment")) return "payment";
  if (normalized.includes("review")) return "review";
  if (normalized.includes("booking")) return "booking";
  return "system";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "User",
    lastName: parts.slice(1).join(" "),
  };
}

function toFeedComment(comment: {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}) {
  const firstName = splitName(comment.authorName).firstName.toLowerCase();
  return {
    id: comment.id,
    author: comment.authorName,
    handle: `@${firstName}`,
    text: comment.content,
    timeAgo: formatRelativeTime(comment.createdAt),
  };
}

export default function DemoPage() {
  const { user, setUser } = useAuthStore();
  const seededAddresses = user?.activeRole === "CUSTOMER" ? [] : demoAddressBook;
  const seededPaymentMethods =
    user?.activeRole === "CUSTOMER" ? [] : demoPaymentMethods;
  const seededPaymentId =
    seededPaymentMethods.find((method) => method.default)?.id ??
    seededPaymentMethods[0]?.id ??
    "";
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [searchText, setSearchText] = useState("");
  const [services, setServices] = useState<AppService[]>(homeServices);
  const [selectedBookingId, setSelectedBookingId] = useState(demoBookings[0]?.id ?? "");
  const [bookings, setBookings] = useState<AppBooking[]>(demoBookings);
  const [messages, setMessages] = useState(
    () =>
      Object.fromEntries(
        demoBookings.map((booking) => [booking.id, booking.thread]),
      ) as Record<string, BookingMessage[]>,
  );
  const [notifications, setNotifications] = useState(fallbackNotifications);
  const [exploreCategory, setExploreCategory] = useState("All");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [repostedIds, setRepostedIds] = useState<string[]>([]);
  const [reactions, setReactions] = useState(
    () =>
      Object.fromEntries(
        homeServices.map((service) => [
          service.id,
          {
            likes: Math.max(18, Math.round(service.reviews * 3.2)),
            comments: Math.max(3, Math.round(service.reviews / 18)),
            reposts: Math.max(1, Math.round(service.reviews / 25)),
          },
        ]),
      ) as Record<string, { likes: number; comments: number; reposts: number }>,
  );
  const [serviceComments, setServiceComments] = useState<Record<string, FeedComment[]>>({});
  const [loadingLiveData, setLoadingLiveData] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentServiceId, setCommentServiceId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [profile, setProfile] = useState(() => ({
    ...demoUserProfile,
    fullName: user?.fullName ?? demoUserProfile.fullName,
    email: user?.email ?? demoUserProfile.email,
  }));
  const [profileDraft, setProfileDraft] = useState(profile);
  const [addresses, setAddresses] = useState<AddressBookItem[]>(seededAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    seededAddresses[0]?.id ?? "",
  );
  const [addressDraft, setAddressDraft] = useState({ label: "", value: "", note: "" });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    seededPaymentMethods,
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState(seededPaymentId);
  const [paymentDraft, setPaymentDraft] = useState({
    holder: user?.fullName ?? demoUserProfile.fullName,
    number: "",
    expiry: "",
    cvc: "",
  });
  const [bookingDraft, setBookingDraft] = useState({
    date: "Today",
    time: "10:00",
    note: "",
    addressId: seededAddresses[0]?.id ?? "",
    paymentId: seededPaymentId,
  });

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    setProfile((current) => ({
      ...current,
      fullName: user.fullName || current.fullName,
      email: user.email || current.email,
      phone: user.phone ?? current.phone,
    }));
  }, [setUser, user]);

  useEffect(() => {
    if (!user || user.activeRole !== "CUSTOMER") return;
    let cancelled = false;

    const loadCustomerAccount = async () => {
      try {
        const [profileResponse, addressesResponse, paymentMethodsResponse] = await Promise.all([
          customerApi.getProfile(),
          customerApi.getAddresses(),
          customerApi.getPaymentMethods(),
        ]);

        if (cancelled) return;

        setProfile({
          fullName: profileResponse.data.fullName,
          email: profileResponse.data.email,
          phone: profileResponse.data.phoneNumber,
        });
        setProfileDraft({
          fullName: profileResponse.data.fullName,
          email: profileResponse.data.email,
          phone: profileResponse.data.phoneNumber,
        });
        if (
          user.fullName !== profileResponse.data.fullName ||
          user.email !== profileResponse.data.email ||
          user.phone !== profileResponse.data.phoneNumber
        ) {
          const profileName = splitName(profileResponse.data.fullName);
          setUser({
            ...user,
            fullName: profileResponse.data.fullName,
            firstName: profileName.firstName,
            lastName: profileName.lastName,
            email: profileResponse.data.email,
            phone: profileResponse.data.phoneNumber,
          });
        }

        const nextAddresses = addressesResponse.data.map((address) => ({
          id: address.id,
          label: address.label,
          value: address.value,
          note: address.note ?? "No special notes.",
        }));
        const defaultAddress =
          addressesResponse.data.find((address) => address.defaultAddress)?.id ??
          nextAddresses[0]?.id ??
          "";
        setAddresses(nextAddresses);
        setSelectedAddressId(defaultAddress);
        setBookingDraft((current) => ({ ...current, addressId: defaultAddress }));

        const nextPaymentMethods = paymentMethodsResponse.data.map((method) => ({
          id: method.id,
          brand: method.brand,
          last4: method.last4,
          holder: method.holderName,
          expiry: method.expiry,
          default: method.defaultMethod,
        }));
        const defaultMethod =
          nextPaymentMethods.find((method) => method.default)?.id ??
          nextPaymentMethods[0]?.id ??
          "";
        setPaymentMethods(nextPaymentMethods);
        setSelectedPaymentId(defaultMethod);
        setBookingDraft((current) => ({ ...current, paymentId: defaultMethod }));
      } catch {
        // Keep seeded account state when the live customer account is not ready yet.
      }
    };

    void loadCustomerAccount();

    return () => {
      cancelled = true;
    };
  }, [setUser, user]);

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      setLoadingLiveData(true);
      try {
        const [providersResponse, offeringsResponse] = await Promise.all([
          providersApi.getAll({ page: 0, size: 40 }),
          catalogApi.getOfferings(),
        ]);

        if (cancelled) return;

        const providers = new Map(
          (providersResponse.data.content ?? []).map((provider) => [provider.id, provider]),
        );
        const liveServices = offeringsResponse.data.map((offering, index) => {
          const provider = providers.get(offering.providerId);
          const fallback =
            homeServices.find((service) =>
              service.category.toLowerCase() === offering.category.toLowerCase(),
            ) ?? homeServices[index % homeServices.length];

          return {
            ...fallback,
            id: `service-${offering.id}`,
            title: offering.serviceName,
            subtitle: provider?.bio || fallback.subtitle,
            description:
              provider?.bio ||
              `${offering.providerName} offers ${offering.serviceName.toLowerCase()} in ${provider?.city ?? "your area"}.`,
            category: offering.category,
            eta: provider ? `${provider.serviceRadiusKm} km radius` : fallback.eta,
            duration: formatDuration(offering.estimatedDurationMinutes),
            price: formatPrice(offering.price),
            badge: provider?.verified ? "Verified pro" : fallback.badge,
            provider: offering.providerName,
            rating: provider?.rating ?? fallback.rating,
            reviews: provider?.reviewCount ?? fallback.reviews,
            imageUrl: provider?.avatar || serviceArtwork(offering.serviceName, offering.category),
            tags: [
              offering.category,
              provider?.city,
              provider?.verified ? "Verified" : "Local",
            ].filter(Boolean) as string[],
            live: true,
            offeringId: offering.id,
            providerId: offering.providerId,
          } satisfies AppService;
        });

        if (liveServices.length > 0) {
          setServices(liveServices);
        }
      } catch {
        // Keep the rich seeded catalog as a graceful fallback.
      } finally {
        if (!cancelled) {
          setLoadingLiveData(false);
        }
      }
    };

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setReactions((current) => {
      const next = { ...current };
      for (const service of services) {
        if (!next[service.id]) {
          next[service.id] = {
            likes: Math.max(18, Math.round(service.reviews * 3.2)),
            comments: Math.max(3, Math.round(service.reviews / 18)),
            reposts: Math.max(1, Math.round(service.reviews / 25)),
          };
        }
      }
      return next;
    });
  }, [services]);

  useEffect(() => {
    const liveServices = services.filter((service) => service.live && service.offeringId);
    if (liveServices.length === 0) {
      return;
    }
    let cancelled = false;

    const loadSocialFeed = async () => {
      try {
        const response = await socialApi.getFeed({ size: 40 });
        if (cancelled) return;
        const feedByOffering = new Map(response.data.map((post) => [post.id, post]));

        setReactions((current) => {
          const next = { ...current };
          for (const service of liveServices) {
            const post = feedByOffering.get(service.offeringId as string);
            if (!post) continue;
            next[service.id] = {
              likes: post.likes,
              comments: post.comments,
              reposts: post.reposts,
            };
          }
          return next;
        });

        setServiceComments((current) => {
          const next = { ...current };
          for (const service of liveServices) {
            const post = feedByOffering.get(service.offeringId as string);
            if (!post) continue;
            next[service.id] = post.commentPreview.map(toFeedComment);
          }
          return next;
        });

        setLikedIds((current) => {
          const next = new Set(current.filter((id) => !liveServices.some((service) => service.id === id)));
          for (const service of liveServices) {
            if (feedByOffering.get(service.offeringId as string)?.likedByViewer) {
              next.add(service.id);
            }
          }
          return Array.from(next);
        });

        setRepostedIds((current) => {
          const next = new Set(current.filter((id) => !liveServices.some((service) => service.id === id)));
          for (const service of liveServices) {
            if (feedByOffering.get(service.offeringId as string)?.repostedByViewer) {
              next.add(service.id);
            }
          }
          return Array.from(next);
        });
      } catch {
        // Keep the optimistic local social state if the backend feed is unavailable.
      }
    };

    void loadSocialFeed();

    return () => {
      cancelled = true;
    };
  }, [services]);

  const serviceByOfferingId = useMemo(
    () =>
      new Map(
        services
          .filter((service) => Boolean(service.offeringId))
          .map((service) => [service.offeringId as string, service]),
      ),
    [services],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadAccountData = async () => {
      try {
        const [bookingsResponse, notificationsResponse] = await Promise.all([
          bookingsApi.getAll({ page: 0, size: 20 }),
          notificationsApi.getAll({ page: 0, size: 20 }),
        ]);

        if (cancelled) return;

        const nextBookings = (bookingsResponse.data.content ?? []).map((booking) => {
          const linkedService = serviceByOfferingId.get(booking.serviceOfferingId);
          const status = (booking.status as BookingStatus) ?? "REQUESTED";
          return {
            id: booking.id,
            service: booking.service,
            provider: booking.provider.name,
            providerRole: linkedService?.category ?? "Service pro",
            status,
            eta:
              status === "COMPLETED"
                ? "Completed"
                : status === "IN_PROGRESS"
                  ? "Provider en route"
                  : status === "ACCEPTED"
                    ? "Provider confirmed"
                    : "Awaiting acceptance",
            scheduledFor: new Date(booking.scheduledAt).toLocaleString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            price: booking.price != null ? `R${Math.round(booking.price)}` : linkedService?.price ?? "TBD",
            address: booking.address,
            progress:
              status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? 78 : status === "ACCEPTED" ? 48 : 24,
            accent: linkedService?.accent ?? homeServices[0].accent,
            imageUrl: linkedService?.imageUrl ?? serviceArtwork(booking.service, linkedService?.category ?? booking.service),
            avatarUrl: linkedService?.imageUrl ?? serviceArtwork(booking.service, linkedService?.category ?? booking.service),
            checklist: buildChecklist(status),
            thread: [
              {
                id: `placeholder-${booking.id}`,
                sender: booking.provider.name,
                text: "Chat with your provider about this booking.",
                time: formatRelativeTime(booking.createdAt),
              },
            ],
            live: true,
            backendId: booking.id,
          } satisfies AppBooking;
        });

        setBookings(nextBookings);
        setSelectedBookingId((current) =>
          nextBookings.some((booking) => booking.id === current)
            ? current
            : (nextBookings[0]?.id ?? ""),
        );

        type BackendNotificationPage = {
          content?: Array<{
            id: number;
            type?: string;
            title: string;
            message: string;
            read: boolean;
            createdAt: string;
            link?: string;
          }>;
        };

        const backendNotifications =
          ((notificationsResponse.data as BackendNotificationPage).content ?? []).map((notification) => ({
            id: String(notification.id),
            title: notification.title,
            message: notification.message,
            createdAt: notification.createdAt,
            read: notification.read,
            kind: toNotificationKind(notification.type),
            action: notification.link ? "Open" : undefined,
          }));

        if (backendNotifications.length > 0) {
          setNotifications(backendNotifications);
        }
      } catch {
        // Keep seeded data if the account is new or the backend is unavailable.
      }
    };

    void loadAccountData();

    return () => {
      cancelled = true;
    };
  }, [serviceByOfferingId, user]);

  useEffect(() => {
    const selected = bookings.find((booking) => booking.id === selectedBookingId);
    if (!selected?.live || !user) return;
    let cancelled = false;

    const loadThread = async () => {
      try {
        const response = await messagesApi.getThread(selected.id, { page: 0, size: 50 });
        if (cancelled) return;
        setMessages((current) => ({
          ...current,
          [selected.id]:
            response.data.content.length > 0
              ? response.data.content.map((message) => toBookingMessage(message, user.id))
              : current[selected.id] ?? selected.thread,
        }));
      } catch {
        // Leave the optimistic placeholder thread in place.
      }
    };

    void loadThread();

    return () => {
      cancelled = true;
    };
  }, [bookings, selectedBookingId, user]);

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;
  const selectedPayment =
    paymentMethods.find((method) => method.id === selectedPaymentId) ?? null;
  const selectedAddressLabel = selectedAddress?.label ?? "Add address";
  const selectedAddressValue =
    selectedAddress?.value ??
    "Save a primary address so bookings route to the right location.";
  const selectedPaymentValue = selectedPayment
    ? `${selectedPayment.brand} ending in ${selectedPayment.last4}`
    : "Add a payment method";
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchText ||
        `${service.title} ${service.subtitle} ${service.provider} ${service.category}`
          .toLowerCase()
          .includes(searchText.toLowerCase());
      const matchesCategory =
        exploreCategory === "All" || service.category === exploreCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exploreCategory, searchText, services]);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(services.map((service) => service.category)))],
    [services],
  );
  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => !["COMPLETED", "DECLINED", "CANCELLED"].includes(booking.status),
      ),
    [bookings],
  );
  const selectedBooking =
    bookings.find((booking) => booking.id === selectedBookingId) ?? bookings[0] ?? null;
  const selectedMessages =
    selectedBooking ? messages[selectedBooking.id] ?? selectedBooking.thread : [];
  const bookingService =
    services.find((service) => service.id === bookingServiceId) ??
    filteredServices[0] ??
    homeServices[0];
  const commentService =
    services.find((service) => service.id === commentServiceId) ??
    filteredServices[0] ??
    homeServices[0];
  const commentThread = serviceComments[commentService.id] ?? [];

  const showToast = (message: string) => setToast(message);

  const openProfileModal = () => {
    setProfileDraft(profile);
    setModal("profile");
  };

  const openAddressModal = () => {
    setAddressDraft({ label: "", value: "", note: "" });
    setModal("address");
  };

  const openPaymentModal = () => {
    setPaymentDraft({
      holder: profile.fullName,
      number: "",
      expiry: "",
      cvc: "",
    });
    setModal("payment");
  };

  const startBookingFlow = (serviceId: string) => {
    setBookingServiceId(serviceId);
    setBookingStep(1);
    setBookingDraft({
      date: "Today",
      time: "10:00",
      note: "",
      addressId: selectedAddressId,
      paymentId: selectedPaymentId,
    });
    setModal("booking");
  };

  const saveProfile = async () => {
    if (!profileDraft.fullName.trim() || !profileDraft.email.trim()) {
      showToast("Add a name and email to continue.");
      return;
    }

    const nextProfile = {
      fullName: profileDraft.fullName.trim(),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim(),
    };

    if (user?.activeRole === "CUSTOMER") {
      try {
        const response = await customerApi.updateProfile({
          fullName: nextProfile.fullName,
          email: nextProfile.email,
          phoneNumber: nextProfile.phone,
        });
        const savedProfile = {
          fullName: response.data.fullName,
          email: response.data.email,
          phone: response.data.phoneNumber,
        };
        setProfile(savedProfile);
        setProfileDraft(savedProfile);
        if (user) {
          const name = splitName(savedProfile.fullName);
          setUser({
            ...user,
            fullName: savedProfile.fullName,
            firstName: name.firstName,
            lastName: name.lastName,
            email: savedProfile.email,
            phone: savedProfile.phone,
          });
        }
        setModal(null);
        showToast("Profile updated.");
        return;
      } catch {
        showToast("Could not save the live profile. Saved locally instead.");
      }
    }

    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setModal(null);
    showToast("Profile updated.");
  };

  const addAddress = async () => {
    if (!addressDraft.label.trim() || !addressDraft.value.trim()) {
      showToast("Add a label and address.");
      return;
    }

    if (user?.activeRole === "CUSTOMER") {
      try {
        const response = await customerApi.createAddress({
          label: addressDraft.label.trim(),
          value: addressDraft.value.trim(),
          note: addressDraft.note.trim() || undefined,
          defaultAddress: true,
        });
        const nextAddress: AddressBookItem = {
          id: response.data.id,
          label: response.data.label,
          value: response.data.value,
          note: response.data.note ?? "No special notes.",
        };
        setAddresses((current) => [nextAddress, ...current.filter((item) => item.id !== nextAddress.id)]);
        setSelectedAddressId(nextAddress.id);
        setBookingDraft((current) => ({ ...current, addressId: nextAddress.id }));
        setModal(null);
        showToast("Address added.");
        return;
      } catch {
        showToast("Could not save the live address. Added locally instead.");
      }
    }

    const nextAddress: AddressBookItem = {
      id: `address-${Date.now()}`,
      label: addressDraft.label.trim(),
      value: addressDraft.value.trim(),
      note: addressDraft.note.trim() || "No special notes.",
    };
    setAddresses((current) => [nextAddress, ...current]);
    setSelectedAddressId(nextAddress.id);
    setBookingDraft((current) => ({ ...current, addressId: nextAddress.id }));
    setModal(null);
    showToast("Address added.");
  };

  const addPaymentMethod = async () => {
    const digits = paymentDraft.number.replace(/\D/g, "");
    if (
      paymentDraft.holder.trim().length < 2 ||
      digits.length < 12 ||
      !isValidExpiryInput(paymentDraft.expiry)
    ) {
      showToast("Enter valid payment details.");
      return;
    }
    if (user?.activeRole === "CUSTOMER") {
      try {
        const response = await customerApi.createPaymentMethod({
          holderName: paymentDraft.holder.trim(),
          cardNumber: paymentDraft.number,
          expiry: paymentDraft.expiry.trim(),
          defaultMethod: true,
        });
        const nextMethod: PaymentMethod = {
          id: response.data.id,
          brand: response.data.brand,
          last4: response.data.last4,
          holder: response.data.holderName,
          expiry: response.data.expiry,
          default: response.data.defaultMethod,
        };
        setPaymentMethods(
          (current): PaymentMethod[] => [
            ...current.map((method) => ({ ...method, default: false })),
            nextMethod,
          ],
        );
        setSelectedPaymentId(nextMethod.id);
        setBookingDraft((current) => ({ ...current, paymentId: nextMethod.id }));
        setModal(null);
        showToast("Payment method added.");
        return;
      } catch {
        showToast("Could not save the live payment method. Saved locally instead.");
      }
    }

    const nextMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      brand: digits.startsWith("4") ? "Visa" : "Mastercard",
      last4: digits.slice(-4),
      holder: paymentDraft.holder.trim(),
      expiry: paymentDraft.expiry.trim(),
      default: true,
    };
    setPaymentMethods(
      (current): PaymentMethod[] => [
        ...current.map((method) => ({ ...method, default: false })),
        nextMethod,
      ],
    );
    setSelectedPaymentId(nextMethod.id);
    setBookingDraft((current) => ({ ...current, paymentId: nextMethod.id }));
    setModal(null);
    showToast("Payment method added.");
  };

  const removeAddress = async (addressId: string) => {
    if (!addresses.some((address) => address.id === addressId)) {
      return;
    }

    if (user?.activeRole === "CUSTOMER" && /^\d+$/.test(addressId)) {
      try {
        await customerApi.deleteAddress(addressId);
      } catch {
        showToast("Could not remove the address right now.");
        return;
      }
    }

    const remaining = addresses.filter((address) => address.id !== addressId);
    const nextSelectedId = remaining[0]?.id ?? "";
    setAddresses(remaining);
    setSelectedAddressId((current) => (current === addressId ? nextSelectedId : current));
    setBookingDraft((current) => ({
      ...current,
      addressId: current.addressId === addressId ? nextSelectedId : current.addressId,
    }));
    showToast(remaining.length > 0 ? "Address removed." : "Address removed. Add another address to keep booking.");
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    if (!paymentMethods.some((method) => method.id === paymentMethodId)) {
      return;
    }

    if (user?.activeRole === "CUSTOMER" && /^\d+$/.test(paymentMethodId)) {
      try {
        await customerApi.deletePaymentMethod(paymentMethodId);
      } catch {
        showToast("Could not remove the payment method right now.");
        return;
      }
    }

    const remaining = paymentMethods.filter((method) => method.id !== paymentMethodId);
    const nextSelectedId =
      remaining.find((method) => method.default)?.id ?? remaining[0]?.id ?? "";
    setPaymentMethods(
      remaining.map((method) => ({
        ...method,
        default: method.id === nextSelectedId,
      })),
    );
    setSelectedPaymentId((current) =>
      current === paymentMethodId ? nextSelectedId : current,
    );
    setBookingDraft((current) => ({
      ...current,
      paymentId:
        current.paymentId === paymentMethodId ? nextSelectedId : current.paymentId,
    }));
    showToast(
      remaining.length > 0
        ? "Payment method removed."
        : "Payment method removed. Add another card before booking.",
    );
  };

  const selectAddress = async (address: AddressBookItem) => {
    setSelectedAddressId(address.id);
    setBookingDraft((current) => ({ ...current, addressId: address.id }));

    if (user?.activeRole !== "CUSTOMER" || !/^\d+$/.test(address.id)) {
      return;
    }

    try {
      await customerApi.updateAddress(address.id, {
        label: address.label,
        value: address.value,
        note: address.note,
        defaultAddress: true,
      });
    } catch {
      showToast("Could not update the default address.");
    }
  };

  const selectPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentId(method.id);
    setPaymentMethods((current) =>
      current.map((item) => ({ ...item, default: item.id === method.id })),
    );
    setBookingDraft((current) => ({ ...current, paymentId: method.id }));

    if (user?.activeRole !== "CUSTOMER" || !/^\d+$/.test(method.id)) {
      return;
    }

    try {
      await customerApi.updatePaymentMethod(method.id, {
        holderName: method.holder,
        expiry: method.expiry,
        defaultMethod: true,
      });
    } catch {
      showToast("Could not update the default payment method.");
    }
  };

  const confirmBooking = async () => {
    const chosenAddress =
      addresses.find((address) => address.id === bookingDraft.addressId) ??
      selectedAddress;
    const chosenPayment =
      paymentMethods.find((method) => method.id === bookingDraft.paymentId) ??
      selectedPayment;
    const scheduledFor = buildScheduledAt(bookingDraft.date, bookingDraft.time);

    if (!chosenAddress || !chosenPayment) {
      setBookingStep(2);
      showToast("Add an address and payment method before confirming.");
      return;
    }

    if (bookingService.live && bookingService.offeringId && user) {
      try {
        const response = await bookingsApi.create({
          offeringId: bookingService.offeringId,
          scheduledAt: scheduledFor,
          address: chosenAddress.value,
          notes: bookingDraft.note.trim() || undefined,
          bookingType: "AT_CUSTOMER",
        });
        const createdBooking = response.data;
        const newBooking: AppBooking = {
          id: createdBooking.id,
          service: createdBooking.service,
          provider: createdBooking.provider.name,
          providerRole: bookingService.category,
          status: createdBooking.status as BookingStatus,
          eta: "Awaiting acceptance",
          scheduledFor: new Date(createdBooking.scheduledAt).toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: createdBooking.price != null ? `R${Math.round(createdBooking.price)}` : bookingService.price,
          address: createdBooking.address,
          progress: 24,
          accent: bookingService.accent,
          imageUrl: bookingService.imageUrl,
          avatarUrl: bookingService.imageUrl,
          checklist: buildChecklist("REQUESTED"),
          thread: [
            {
              id: `placeholder-${createdBooking.id}`,
              sender: createdBooking.provider.name,
              text: `Thanks for the request. I am reviewing your ${createdBooking.service.toLowerCase()} booking now.`,
              time: "Now",
            },
          ],
          live: true,
          backendId: createdBooking.id,
        };

        setBookings((current) => [newBooking, ...current]);
        setMessages((current) => ({ ...current, [newBooking.id]: newBooking.thread }));
        setSelectedBookingId(newBooking.id);
        setNotifications((current) => [
          {
            id: `notification-${Date.now()}`,
            title: "Booking Requested",
            message: `${createdBooking.provider.name} received your ${createdBooking.service.toLowerCase()} request. ${chosenPayment.brand} ending in ${chosenPayment.last4} is ready.`,
            createdAt: new Date().toISOString(),
            read: false,
            kind: "booking",
            action: "Open",
          },
          ...current,
        ]);
        setActiveTab("bookings");
        setModal("bookingSuccess");
        showToast("Booking submitted.");
        return;
      } catch {
        showToast("Could not create the live booking. Showing demo flow instead.");
      }
    }

    const newBooking: AppBooking = {
      id: `booking-${Date.now()}`,
      service: bookingService.title,
      provider: bookingService.provider,
      providerRole: bookingService.category,
      status: "REQUESTED",
      eta: "Awaiting acceptance",
      scheduledFor: `${bookingDraft.date}, ${bookingDraft.time}`,
      price: bookingService.price.replace(/^From\s+/i, ""),
      address: chosenAddress.value,
      progress: 24,
      accent: bookingService.accent,
      imageUrl: bookingService.imageUrl,
      avatarUrl: bookingService.imageUrl,
      checklist: buildChecklist("REQUESTED"),
      thread: [
        {
          id: `thread-${Date.now()}`,
          sender: bookingService.provider,
          text: `Thanks for the request. I am reviewing your ${bookingService.title.toLowerCase()} booking now.`,
          time: "Now",
        },
        ...(bookingDraft.note.trim()
          ? [
              {
                id: `thread-note-${Date.now()}`,
                sender: "You",
                text: bookingDraft.note.trim(),
                time: "Now",
                own: true,
              },
            ]
          : []),
      ],
    };

    setBookings((current) => [newBooking, ...current]);
    setMessages((current) => ({ ...current, [newBooking.id]: newBooking.thread }));
    setSelectedBookingId(newBooking.id);
    setNotifications((current) => [
      {
        id: `notification-${Date.now()}`,
        title: "Booking Requested",
        message: `${bookingService.provider} received your ${bookingService.title.toLowerCase()} request. ${chosenPayment.brand} ending in ${chosenPayment.last4} is ready.`,
        createdAt: new Date().toISOString(),
        read: false,
        kind: "booking",
        action: "Open",
      },
      ...current,
    ]);
    setActiveTab("bookings");
    setModal("bookingSuccess");
    showToast("Booking submitted.");
  };

  const advanceBooking = () => {
    if (!selectedBooking) {
      showToast("Select a booking first.");
      return;
    }
    if (selectedBooking.live) {
      showToast("Live bookings update from the provider in real time.");
      return;
    }
    if (selectedBooking.status === "COMPLETED") {
      showToast("This booking is already complete.");
      return;
    }
    const next = selectedBooking.status === "REQUESTED"
      ? "ACCEPTED"
      : selectedBooking.status === "ACCEPTED"
        ? "IN_PROGRESS"
        : "COMPLETED";
    setBookings((current) =>
      current.map((booking) =>
        booking.id === selectedBooking.id
          ? {
              ...booking,
              status: next,
              progress: next === "ACCEPTED" ? 48 : next === "IN_PROGRESS" ? 78 : 100,
              eta: next === "COMPLETED" ? "Completed" : next === "IN_PROGRESS" ? "Provider en route" : "Provider confirmed",
              checklist: next === "ACCEPTED"
                ? [
                    { label: "Request submitted", complete: true },
                    { label: "Provider accepted", complete: true },
                    { label: "Provider en route", complete: false },
                    { label: "Service complete", complete: false },
                  ]
                : next === "IN_PROGRESS"
                  ? [
                      { label: "Request submitted", complete: true },
                      { label: "Provider accepted", complete: true },
                      { label: "Provider en route", complete: true },
                      { label: "Service complete", complete: false },
                    ]
                  : [
                      { label: "Request submitted", complete: true },
                      { label: "Provider accepted", complete: true },
                      { label: "Provider en route", complete: true },
                      { label: "Service complete", complete: true },
                    ],
            }
          : booking,
      ),
    );
    setMessages((current) => ({
      ...current,
      [selectedBooking.id]: [
        ...(current[selectedBooking.id] ?? selectedBooking.thread),
        {
          id: `message-${Date.now()}`,
          sender: selectedBooking.provider,
          text:
            next === "ACCEPTED"
              ? "Booking accepted. I have everything I need for the visit."
              : next === "IN_PROGRESS"
                ? "I am on the way and will update you when I arrive."
                : "The job is complete. Please review the service when you have a moment.",
          time: "Now",
        },
      ],
    }));
    showToast(`Booking moved to ${bookingMeta(next).label}.`);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !selectedBooking) return;
    if (selectedBooking.live && user) {
      try {
        const response = await messagesApi.send(selectedBooking.id, trimmed);
        setMessages((current) => ({
          ...current,
          [selectedBooking.id]: [
            ...(current[selectedBooking.id] ?? selectedBooking.thread),
            toBookingMessage(response.data, user.id),
          ],
        }));
        setDraftMessage("");
        showToast("Message sent.");
        return;
      } catch {
        showToast("Message failed to send.");
        return;
      }
    }
    setMessages((current) => ({
      ...current,
      [selectedBooking.id]: [
        ...(current[selectedBooking.id] ?? selectedBooking.thread),
        {
          id: `user-message-${Date.now()}`,
          sender: "You",
          text: trimmed,
          time: "Now",
          own: true,
        },
      ],
    }));
    setDraftMessage("");
    showToast("Message sent.");
  };

  const toggleLike = async (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    if (service?.live && service.offeringId && user?.activeRole === "CUSTOMER") {
      try {
        const response = await socialApi.toggleLike(service.offeringId);
        setReactions((current) => ({
          ...current,
          [serviceId]: {
            likes: response.data.likes,
            comments: response.data.comments,
            reposts: response.data.reposts,
          },
        }));
        setLikedIds((current) =>
          response.data.active
            ? Array.from(new Set([...current, serviceId]))
            : current.filter((id) => id !== serviceId),
        );
        return;
      } catch {
        showToast("Could not update the like right now.");
        return;
      }
    }

    const liked = likedIds.includes(serviceId);
    setLikedIds((current) =>
      liked ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
    setReactions((current) => ({
      ...current,
      [serviceId]: {
        likes: (current[serviceId]?.likes ?? 0) + (liked ? -1 : 1),
        comments: current[serviceId]?.comments ?? 0,
        reposts: current[serviceId]?.reposts ?? 0,
      },
    }));
  };

  const toggleRepost = async (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    if (service?.live && service.offeringId && user?.activeRole === "CUSTOMER") {
      try {
        const response = await socialApi.toggleRepost(service.offeringId);
        setReactions((current) => ({
          ...current,
          [serviceId]: {
            likes: response.data.likes,
            comments: response.data.comments,
            reposts: response.data.reposts,
          },
        }));
        setRepostedIds((current) =>
          response.data.active
            ? Array.from(new Set([...current, serviceId]))
            : current.filter((id) => id !== serviceId),
        );
        return;
      } catch {
        showToast("Could not repost right now.");
        return;
      }
    }

    const reposted = repostedIds.includes(serviceId);
    setRepostedIds((current) =>
      reposted ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
    setReactions((current) => ({
      ...current,
      [serviceId]: {
        likes: current[serviceId]?.likes ?? 0,
        comments: current[serviceId]?.comments ?? 0,
        reposts: (current[serviceId]?.reposts ?? 0) + (reposted ? -1 : 1),
      },
    }));
  };

  const openComments = async (serviceId: string) => {
    setCommentServiceId(serviceId);
    setCommentDraft("");
    setModal("comments");

    const service = services.find((item) => item.id === serviceId);
    if (!service?.live || !service.offeringId) {
      return;
    }

    try {
      const response = await socialApi.getComments(service.offeringId);
      setServiceComments((current) => ({
        ...current,
        [serviceId]: response.data.map(toFeedComment),
      }));
    } catch {
      showToast("Could not load comments right now.");
    }
  };

  const submitComment = async () => {
    if (!commentServiceId || !commentDraft.trim()) {
      showToast("Write a comment first.");
      return;
    }
    const service = services.find((item) => item.id === commentServiceId);
    if (service?.live && service.offeringId && user?.activeRole === "CUSTOMER") {
      try {
        const response = await socialApi.addComment(service.offeringId, commentDraft.trim());
        const nextComment = toFeedComment(response.data);
        setServiceComments((current) => ({
          ...current,
          [commentServiceId]: [nextComment, ...(current[commentServiceId] ?? [])],
        }));
        setReactions((current) => ({
          ...current,
          [commentServiceId]: {
            likes: current[commentServiceId]?.likes ?? 0,
            comments: (current[commentServiceId]?.comments ?? 0) + 1,
            reposts: current[commentServiceId]?.reposts ?? 0,
          },
        }));
        setCommentDraft("");
        showToast("Comment posted.");
        return;
      } catch {
        showToast("Could not post the comment right now.");
        return;
      }
    }
    setReactions((current) => ({
      ...current,
      [commentServiceId]: {
        likes: current[commentServiceId]?.likes ?? 0,
        comments: (current[commentServiceId]?.comments ?? 0) + 1,
        reposts: current[commentServiceId]?.reposts ?? 0,
      },
    }));
    const authorName = user?.fullName || profile.fullName || "You";
    const nextComment: FeedComment = {
      id: `comment-${Date.now()}`,
      author: authorName,
      handle: `@${splitName(authorName).firstName.toLowerCase()}`,
      text: commentDraft.trim(),
      timeAgo: "Now",
    };
    setServiceComments((current) => ({
      ...current,
      [commentServiceId]: [nextComment, ...(current[commentServiceId] ?? [])],
    }));
    setCommentDraft("");
    showToast("Comment posted.");
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.background, color: COLORS.textPrimary }}
    >
      <div
        className="mx-auto min-h-screen max-w-[480px] px-5 pt-4"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {activeTab === "home" ? (
          <section className="pb-8">
            <div className="flex items-start justify-between pt-2">
              <div>
                <button
                  type="button"
                  onClick={openAddressModal}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedAddressLabel}
                </button>
                <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.04em]">
                  {profile.fullName}
                </h1>
                <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
                  {selectedAddressValue}
                </p>
                {loadingLiveData ? (
                  <p className="mt-2 text-xs font-semibold" style={{ color: COLORS.accent }}>
                    Syncing live services...
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("alerts")}
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-[20px] bg-white p-2 shadow-sm">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setActiveTab("explore");
                }}
                placeholder="Search for a service or provider..."
                leftIcon={<Search className="h-5 w-5" />}
                rightIcon={<SlidersHorizontal className="h-5 w-5" />}
                className="h-12 rounded-2xl border-0 bg-transparent px-3 text-[15px] placeholder:text-[#ADB5BD]"
              />
            </div>

            <SectionHeader
              title="Recommended services"
              action="See all"
              onClick={() => setActiveTab("explore")}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(filteredServices.length > 0 ? filteredServices : homeServices)
                .slice(0, 4)
                .map((service, index) => {
                  const Icon = categoryIcon(service.category);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => startBookingFlow(service.id)}
                      className="overflow-hidden rounded-[22px] bg-white text-left shadow-sm"
                    >
                      <div className="relative h-28">
                        <div
                          aria-label={service.title}
                          role="img"
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${service.imageUrl})` }}
                        />
                        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-[15px] font-bold">{service.title}</p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: COLORS.textSecondary }}
                        >
                          {service.subtitle}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              backgroundColor:
                                pastelCards[index % pastelCards.length],
                            }}
                          >
                            {service.price}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.textMuted }}
                          >
                            {service.eta}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            <SectionHeader
              title="Last services booked"
              action="History"
              onClick={() => setActiveTab("bookings")}
            />
            <div className="mt-4 space-y-3">
              {orderHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[20px] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">
                        {item.title}
                      </p>
                      <p
                        className="mt-1 text-[13px]"
                        style={{ color: COLORS.textMuted }}
                      >
                        {item.provider}
                      </p>
                    </div>
                    <span className="text-sm font-bold">{item.price}</span>
                  </div>
                  <p
                    className="mt-3 text-xs font-medium"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {item.date}
                  </p>
                </div>
              ))}
            </div>

            <SectionHeader
              title="Current bookings"
              action="Manage"
              onClick={() => setActiveTab("bookings")}
            />
            <div className="mt-4 space-y-3">
              {activeBookings.slice(0, 3).map((booking) => {
                const meta = bookingMeta(booking.status);
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => {
                      setSelectedBookingId(booking.id);
                      setActiveTab("bookings");
                    }}
                    className="flex w-full items-center gap-4 rounded-[20px] bg-white p-4 text-left shadow-sm"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[14px]"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <HandHelping
                        className="h-5 w-5"
                        style={{ color: meta.fg }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">
                        {booking.service}
                      </p>
                      <p
                        className="mt-1 truncate text-[13px]"
                        style={{ color: COLORS.textMuted }}
                      >
                        {booking.provider}
                      </p>
                    </div>
                    <div
                      className="rounded-[10px] px-3 py-1.5 text-[11px] font-semibold"
                      style={{ backgroundColor: meta.bg, color: meta.fg }}
                    >
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeTab === "explore" ? (
          <section className="pb-8">
            <h1 className="pt-2 text-[2rem] font-bold tracking-[-0.04em]">
              Explore
            </h1>
            <div className="mt-4 rounded-[20px] bg-white p-2 shadow-sm">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search services, providers, neighborhoods..."
                leftIcon={<Search className="h-5 w-5" />}
                className="h-12 rounded-2xl border-0 bg-transparent px-3 text-[15px] placeholder:text-[#ADB5BD]"
              />
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setExploreCategory(category)}
                  className="shrink-0 rounded-[14px] px-4 py-2.5 text-[13px] font-semibold"
                  style={{
                    backgroundColor:
                      exploreCategory === category ? COLORS.primary : COLORS.surface,
                    color:
                      exploreCategory === category ? "white" : COLORS.textSecondary,
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              {filteredServices.length === 0 ? (
                <EmptyState
                  title="No services match your search"
                  copy="Try another category, service, or provider name."
                />
              ) : (
                filteredServices.slice(0, 6).map((service) => {
                  const reaction = reactions[service.id] ?? {
                    likes: Math.max(18, Math.round(service.reviews * 3.2)),
                    comments: Math.max(3, Math.round(service.reviews / 18)),
                    reposts: Math.max(1, Math.round(service.reviews / 25)),
                  };
                  const previewComments = (serviceComments[service.id] ?? []).slice(0, 2);
                  return (
                    <article
                      key={service.id}
                      className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                    >
                      <div className="relative h-[220px]">
                        <div
                          aria-label={service.title}
                          role="img"
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${service.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute right-4 top-4 rounded-2xl bg-white/95 px-4 py-2 text-base font-extrabold">
                          {service.price}
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-[15px] font-bold">{service.provider}</p>
                        <h2 className="mt-3 text-lg font-extrabold">
                          {service.title}
                        </h2>
                        <p
                          className="mt-2 text-sm leading-6"
                          style={{ color: COLORS.textSecondary }}
                        >
                          {service.description}
                        </p>
                        <div className="mt-5 flex items-center gap-5">
                          <button
                            type="button"
                            onClick={() => void toggleLike(service.id)}
                            aria-label={`Like ${service.title}`}
                          >
                            <SmallAction
                              icon={Heart}
                              label={String(reaction.likes)}
                              active={likedIds.includes(service.id)}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => void openComments(service.id)}
                            aria-label={`Open comments for ${service.title}`}
                          >
                            <SmallAction
                              icon={MessageCircle}
                              label={String(reaction.comments)}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleRepost(service.id)}
                            aria-label={`Repost ${service.title}`}
                          >
                            <SmallAction
                              icon={Repeat2}
                              label={String(reaction.reposts)}
                              active={repostedIds.includes(service.id)}
                            />
                          </button>
                          <div className="ml-auto">
                            <Button
                              className="rounded-[14px] px-6"
                              style={{ backgroundColor: COLORS.primary }}
                              onClick={() => startBookingFlow(service.id)}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                        <div
                          className="mt-4 rounded-[18px] p-4"
                          style={{ backgroundColor: COLORS.surfaceAlt }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COLORS.textMuted }}>
                              Community
                            </p>
                            <button
                              type="button"
                              className="text-xs font-semibold"
                              style={{ color: COLORS.accent }}
                              onClick={() => void openComments(service.id)}
                            >
                              {reaction.comments > previewComments.length
                                ? `View all ${reaction.comments}`
                                : "Open thread"}
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            {previewComments.length > 0 ? (
                              previewComments.map((comment) => (
                                <div key={comment.id} className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{comment.author}</span>
                                    <span style={{ color: COLORS.textMuted }}>{comment.handle}</span>
                                    <span style={{ color: COLORS.textMuted }}>{comment.timeAgo}</span>
                                  </div>
                                  <p className="mt-1 leading-6" style={{ color: COLORS.textSecondary }}>
                                    {comment.text}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm leading-6" style={{ color: COLORS.textSecondary }}>
                                Be the first customer to ask a question or share feedback on this service.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "bookings" ? (
          <section className="pb-8">
            <h1 className="pt-2 text-[2rem] font-bold tracking-[-0.04em]">
              Bookings
            </h1>
            {bookings.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No bookings yet"
                  copy="Book your first service to unlock live updates and messaging."
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {bookings.map((booking) => {
                  const meta = bookingMeta(booking.status);
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => setSelectedBookingId(booking.id)}
                      className="w-full rounded-[20px] bg-white p-4 text-left shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                          style={{ backgroundColor: meta.bg }}
                        >
                          <HandHelping
                            className="h-5 w-5"
                            style={{ color: meta.fg }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-semibold">
                                {booking.service}
                              </p>
                              <p
                                className="mt-1 truncate text-[13px]"
                                style={{ color: COLORS.textMuted }}
                              >
                                {booking.provider}
                              </p>
                            </div>
                            <div
                              className="rounded-[10px] px-3 py-1.5 text-[11px] font-semibold"
                              style={{ backgroundColor: meta.bg, color: meta.fg }}
                            >
                              {meta.label}
                            </div>
                          </div>
                          <div
                            className="mt-4 rounded-[14px] p-3"
                            style={{ backgroundColor: COLORS.surfaceAlt }}
                          >
                            <MetaRow icon={CalendarDays} text={booking.scheduledFor} />
                            <MetaRow icon={CircleDollarSign} text={booking.price} />
                            <MetaRow icon={MapPin} text={booking.address} />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedBooking ? (
            <div className="mt-5 rounded-[24px] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{selectedBooking.service}</h2>
                  <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
                    {selectedBooking.provider} | {selectedBooking.providerRole}
                  </p>
                </div>
                <span
                  className="rounded-[10px] px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: bookingMeta(selectedBooking.status).bg,
                    color: bookingMeta(selectedBooking.status).fg,
                  }}
                >
                  {bookingMeta(selectedBooking.status).label}
                </span>
              </div>

              <div className="mt-5 space-y-2">
                {selectedBooking.checklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-[16px] px-3 py-3"
                    style={{ backgroundColor: COLORS.surfaceAlt }}
                  >
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: item.complete ? COLORS.success : COLORS.textMuted }}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {[
                  "Please ring on arrival",
                  "Share updated quote",
                  "I added another issue",
                ].map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => void sendMessage(text)}
                    className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: COLORS.surfaceAlt,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={message.own ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className="max-w-[82%] rounded-[16px] px-4 py-3"
                      style={{
                        backgroundColor: message.own
                          ? COLORS.accentLight
                          : COLORS.surfaceAlt,
                      }}
                    >
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: COLORS.textMuted }}
                      >
                        {message.sender}
                      </p>
                      <p className="mt-1 text-sm leading-6">{message.text}</p>
                      <p
                        className="mt-2 text-[11px]"
                        style={{ color: COLORS.textMuted }}
                      >
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[18px] p-3" style={{ backgroundColor: COLORS.surfaceAlt }}>
                <Input
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Send a message to the provider..."
                  className="border-0 bg-transparent shadow-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1 rounded-[14px]"
                    onClick={advanceBooking}
                  >
                    {selectedBooking.live ? "Live status" : "Advance status"}
                  </Button>
                  <Button
                    className="flex-1 rounded-[14px]"
                    style={{ backgroundColor: COLORS.primary }}
                    onClick={() => void sendMessage(draftMessage)}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === "alerts" ? (
          <section className="pb-8">
            <div className="flex items-center justify-between pt-2">
              <h1 className="text-[2rem] font-bold tracking-[-0.04em]">
                Notifications
              </h1>
              <button
                type="button"
                className="text-sm font-semibold"
                style={{ color: COLORS.accent }}
                onClick={() => {
                  void notificationsApi.markAllRead().catch(() => undefined);
                  setNotifications((current) =>
                    current.map((item) => ({ ...item, read: true })),
                  );
                }}
              >
                Mark read
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {notifications.map((notification) => {
                const meta = notificationMeta(notification.kind);
                const Icon = meta.icon;
                return (
                  <article
                    key={notification.id}
                    className="rounded-[16px] border p-4 shadow-sm"
                    style={{
                      backgroundColor: notification.read
                        ? COLORS.surface
                        : "rgba(26,26,46,0.05)",
                      borderColor: notification.read
                        ? "rgba(229,231,235,0.3)"
                        : "rgba(26,26,46,0.2)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-[14px]"
                        style={{ backgroundColor: meta.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: meta.fg }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold">
                          {notification.title}
                        </p>
                        <p
                          className="mt-1 text-sm leading-6"
                          style={{ color: COLORS.textSecondary }}
                        >
                          {notification.message}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p
                            className="text-xs font-medium"
                            style={{ color: COLORS.textMuted }}
                          >
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                          {notification.action ? (
                            <span
                              className="rounded-[8px] px-3 py-1.5 text-[11px] font-bold text-white"
                              style={{ backgroundColor: meta.fg }}
                            >
                              {notification.action}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeTab === "profile" ? (
          <section className="pb-8">
            <div className="flex items-center justify-between pt-2">
              <h1 className="text-[2rem] font-bold tracking-[-0.04em]">
                Profile
              </h1>
              <button
                type="button"
                onClick={openProfileModal}
                className="rounded-full bg-white p-2 shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-[24px] bg-white p-6 text-center shadow-sm">
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px]"
                style={{ backgroundColor: COLORS.accentLight }}
              >
                <span className="text-[2rem] font-bold" style={{ color: COLORS.accent }}>
                  {profile.fullName[0]?.toUpperCase() ?? "A"}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{profile.fullName}</h2>
              <p className="mt-1 text-sm" style={{ color: COLORS.textMuted }}>
                {profile.email}
              </p>
              <p className="mt-1 text-sm" style={{ color: COLORS.textMuted }}>
                {profile.phone}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {profileStats.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[20px] bg-white p-4 text-center shadow-sm"
                >
                  <p className="text-lg font-bold">{item.value}</p>
                  <p
                    className="mt-1 text-[11px] font-medium"
                    style={{ color: COLORS.textMuted }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <ProfileSection
              title="Account"
              items={[
                {
                  icon: UserRound,
                  label: "Edit Profile",
                  value: profile.fullName,
                  onClick: openProfileModal,
                },
                {
                  icon: MapPin,
                  label: "Primary Address",
                  value: selectedAddressValue,
                  onClick: openAddressModal,
                },
                {
                  icon: CreditCard,
                  label: "Default Payment",
                  value: selectedPaymentValue,
                  onClick: openPaymentModal,
                },
              ]}
            />

            <ProfileSection
              title="Activity"
              items={[
                {
                  icon: Star,
                  label: "Saved Services",
                  value: `${likedIds.length} liked`,
                  onClick: () => setActiveTab("explore"),
                },
                {
                  icon: CalendarDays,
                  label: "Bookings",
                  value: `${bookings.length} total`,
                  onClick: () => setActiveTab("bookings"),
                },
                {
                  icon: Gavel,
                  label: "Support Tier",
                  value: profileSettings[2]?.value ?? "Priority customer tier",
                },
              ]}
            />
          </section>
        ) : null}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-white"
        style={{
          borderColor: COLORS.divider,
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto grid max-w-[480px] grid-cols-5 gap-1 px-2 pt-2">
          {[{ id: "home" as const, label: "Home", icon: Home }, { id: "explore" as const, label: "Explore", icon: Sparkles }, { id: "bookings" as const, label: "Bookings", icon: CalendarDays }, { id: "alerts" as const, label: "Alerts", icon: Bell }, { id: "profile" as const, label: "Profile", icon: UserRound }].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="flex min-h-11 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium"
                style={{ backgroundColor: active ? COLORS.accentLight : "transparent", color: active ? COLORS.accent : COLORS.textMuted }}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AppModal
        open={modal === "profile"}
        onClose={() => setModal(null)}
        title="Edit profile"
        description="Update the customer details investors see."
      >
        <div className="space-y-3">
          <Input
            label="Full name"
            value={profileDraft.fullName}
            onChange={(event) =>
              setProfileDraft((current) => ({ ...current, fullName: event.target.value }))
            }
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={profileDraft.email}
            onChange={(event) =>
              setProfileDraft((current) => ({ ...current, email: event.target.value }))
            }
            autoComplete="email"
          />
          <Input
            label="Phone"
            value={profileDraft.phone}
            onChange={(event) =>
              setProfileDraft((current) => ({ ...current, phone: event.target.value }))
            }
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-[16px]" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button className="flex-1 rounded-[16px]" style={{ backgroundColor: COLORS.primary }} onClick={() => void saveProfile()}>
            Save
          </Button>
        </div>
      </AppModal>

      <AppModal
        open={modal === "address"}
        onClose={() => setModal(null)}
        title="Addresses"
        description="Switch addresses or add a new one."
      >
        <div className="space-y-3">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start gap-3 rounded-[18px] p-4"
                style={{
                  backgroundColor:
                    selectedAddressId === address.id
                      ? COLORS.accentLight
                      : COLORS.surfaceAlt,
                  border: `1px solid ${
                    selectedAddressId === address.id
                      ? COLORS.accent
                      : "transparent"
                  }`,
                }}
              >
                <button
                  type="button"
                  onClick={() => void selectAddress(address)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-bold">{address.label}</p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {address.value}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: COLORS.textMuted }}>
                    {address.note}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => void removeAddress(address.id)}
                  className="rounded-full p-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.75)" }}
                  aria-label={`Remove ${address.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
              No saved addresses yet. Add one below so bookings can use your real service location.
            </div>
          )}
        </div>
        <div className="mt-5 rounded-[20px] p-4" style={{ backgroundColor: COLORS.surfaceAlt }}>
          <Input
            label="Label"
            value={addressDraft.label}
            onChange={(event) => setAddressDraft((current) => ({ ...current, label: event.target.value }))}
            placeholder="Home, Office..."
          />
          <div className="mt-3" />
          <Input
            label="Address"
            value={addressDraft.value}
            onChange={(event) => setAddressDraft((current) => ({ ...current, value: event.target.value }))}
            autoComplete="street-address"
            placeholder="14 Beach Road, Sea Point"
          />
          <div className="mt-3" />
          <Input
            label="Notes"
            value={addressDraft.note}
            onChange={(event) => setAddressDraft((current) => ({ ...current, note: event.target.value }))}
            placeholder="Gate code, parking..."
          />
          <Button className="mt-4 w-full rounded-[16px]" style={{ backgroundColor: COLORS.primary }} onClick={() => void addAddress()}>
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </div>
      </AppModal>

      <AppModal
        open={modal === "payment"}
        onClose={() => setModal(null)}
        title="Payment methods"
        description="Add a card so the booking flow has a realistic checkout step."
      >
        <div className="space-y-3">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-start gap-3 rounded-[18px] p-4"
                style={{
                  backgroundColor:
                    selectedPaymentId === method.id
                      ? COLORS.accentLight
                      : COLORS.surfaceAlt,
                  border: `1px solid ${
                    selectedPaymentId === method.id
                      ? COLORS.accent
                      : "transparent"
                  }`,
                }}
              >
                <button
                  type="button"
                  onClick={() => void selectPaymentMethod(method)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-bold">
                    {method.brand} ending in {method.last4}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {method.holder} | Expires {method.expiry}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => void removePaymentMethod(method.id)}
                  className="rounded-full p-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.75)" }}
                  aria-label={`Remove ${method.brand} ending in ${method.last4}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
              No payment methods saved yet. Add one below so checkout works like a real customer flow.
            </div>
          )}
        </div>
        <div className="mt-5 rounded-[20px] p-4" style={{ backgroundColor: COLORS.surfaceAlt }}>
          <Input
            label="Cardholder"
            value={paymentDraft.holder}
            onChange={(event) => setPaymentDraft((current) => ({ ...current, holder: event.target.value }))}
            autoComplete="cc-name"
          />
          <div className="mt-3" />
          <Input
            label="Card number"
            value={paymentDraft.number}
            onChange={(event) => setPaymentDraft((current) => ({ ...current, number: event.target.value }))}
            autoComplete="cc-number"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              label="Expiry"
              value={paymentDraft.expiry}
              onChange={(event) =>
                setPaymentDraft((current) => ({
                  ...current,
                  expiry: normalizeExpiryInput(event.target.value),
                }))
              }
              autoComplete="cc-exp"
              inputMode="numeric"
              placeholder="10/28"
            />
            <Input
              label="CVC"
              value={paymentDraft.cvc}
              onChange={(event) => setPaymentDraft((current) => ({ ...current, cvc: event.target.value }))}
              autoComplete="cc-csc"
              inputMode="numeric"
              placeholder="123"
            />
          </div>
          <Button className="mt-4 w-full rounded-[16px]" style={{ backgroundColor: COLORS.primary }} onClick={() => void addPaymentMethod()}>
            <Plus className="h-4 w-4" />
            Save Card
          </Button>
        </div>
      </AppModal>

      <AppModal
        open={modal === "booking"}
        onClose={() => setModal(null)}
        title={`Book ${bookingService.title}`}
        description="Complete the full demo booking flow."
      >
        <div className="rounded-[18px] p-4" style={{ backgroundColor: COLORS.surfaceAlt }}>
          <div className="flex items-center gap-3">
            <div
              aria-label={bookingService.title}
              role="img"
              className="h-16 w-16 rounded-[16px] bg-cover bg-center"
              style={{ backgroundImage: `url(${bookingService.imageUrl})` }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{bookingService.title}</p>
              <p className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>{bookingService.provider} | {bookingService.price}</p>
            </div>
          </div>
        </div>
        {bookingStep === 1 ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {["Today", "Tomorrow", "Saturday", "Monday"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBookingDraft((current) => ({ ...current, date: value }))}
                  className="rounded-[16px] px-3 py-3 text-sm font-semibold"
                  style={{
                    backgroundColor: bookingDraft.date === value ? COLORS.accentLight : COLORS.surfaceAlt,
                    color: bookingDraft.date === value ? COLORS.accent : COLORS.textSecondary,
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <Input
              label="Preferred time"
              value={bookingDraft.time}
              onChange={(event) => setBookingDraft((current) => ({ ...current, time: event.target.value }))}
              placeholder="10:00"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Booking notes</label>
              <textarea
                value={bookingDraft.note}
                onChange={(event) => setBookingDraft((current) => ({ ...current, note: event.target.value }))}
                className="min-h-28 w-full rounded-[22px] border border-white/65 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                placeholder="Tell the provider what you need done..."
              />
            </div>
          </div>
        ) : bookingStep === 2 ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-bold">Choose address</p>
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setBookingDraft((current) => ({ ...current, addressId: address.id }))}
                    className="w-full rounded-[16px] p-4 text-left"
                    style={{
                      backgroundColor: bookingDraft.addressId === address.id ? COLORS.accentLight : COLORS.surfaceAlt,
                      border: `1px solid ${bookingDraft.addressId === address.id ? COLORS.accent : "transparent"}`,
                    }}
                  >
                    <p className="text-sm font-bold">{address.label}</p>
                    <p className="mt-1 text-xs" style={{ color: COLORS.textSecondary }}>{address.value}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
                  Add an address first so the provider knows where to come.
                  <Button variant="secondary" className="mt-3 rounded-[14px]" onClick={openAddressModal}>
                    Add address
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">Choose payment</p>
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setBookingDraft((current) => ({ ...current, paymentId: method.id }))}
                    className="w-full rounded-[16px] p-4 text-left"
                    style={{
                      backgroundColor: bookingDraft.paymentId === method.id ? COLORS.accentLight : COLORS.surfaceAlt,
                      border: `1px solid ${bookingDraft.paymentId === method.id ? COLORS.accent : "transparent"}`,
                    }}
                  >
                    <p className="text-sm font-bold">{method.brand} ending in {method.last4}</p>
                    <p className="mt-1 text-xs" style={{ color: COLORS.textSecondary }}>{method.holder}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
                  Add a payment method so checkout can complete like a real booking.
                  <Button variant="secondary" className="mt-3 rounded-[14px]" onClick={openPaymentModal}>
                    Add card
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] p-4" style={{ backgroundColor: COLORS.surfaceAlt }}>
            <ReviewRow label="Service" value={bookingService.title} />
            <ReviewRow label="Provider" value={bookingService.provider} />
            <ReviewRow label="When" value={`${bookingDraft.date}, ${bookingDraft.time}`} />
            <ReviewRow
              label="Address"
              value={
                (
                  addresses.find((address) => address.id === bookingDraft.addressId) ??
                  selectedAddress
                )?.value ?? "Add an address"
              }
            />
            <ReviewRow
              label="Payment"
              value={() => {
                const payment =
                  paymentMethods.find((method) => method.id === bookingDraft.paymentId) ??
                  selectedPayment;
                return payment
                  ? `${payment.brand} ending in ${payment.last4}`
                  : "Add a payment method";
              }}
            />
            <ReviewRow label="Price" value={bookingService.price} />
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-[16px]" onClick={() => (bookingStep === 1 ? setModal(null) : setBookingStep((current) => current - 1))}>
            {bookingStep === 1 ? "Cancel" : "Back"}
          </Button>
          <Button className="flex-1 rounded-[16px]" style={{ backgroundColor: COLORS.primary }} onClick={() => (bookingStep < 3 ? setBookingStep((current) => current + 1) : void confirmBooking())}>
            {bookingStep < 3 ? "Continue" : "Confirm"}
          </Button>
        </div>
      </AppModal>

      <AppModal
        open={modal === "bookingSuccess"}
        onClose={() => setModal(null)}
        title="Booking created"
        description="The new demo booking is live in your bookings tab."
      >
        <div className="rounded-[20px] p-5 text-center" style={{ backgroundColor: COLORS.surfaceAlt }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.accentLight }}>
            <CheckCircle2 className="h-7 w-7" style={{ color: COLORS.accent }} />
          </div>
          <p className="mt-4 text-lg font-bold">The workflow is connected</p>
          <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
            The booking appears in the list, supports messaging, and can move through accepted, in progress, and completed.
          </p>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-[16px]" onClick={() => setModal(null)}>
            Close
          </Button>
          <Button className="flex-1 rounded-[16px]" style={{ backgroundColor: COLORS.primary }} onClick={() => { setModal(null); setActiveTab("bookings"); }}>
            Open booking
          </Button>
        </div>
      </AppModal>

      <AppModal
        open={modal === "comments"}
        onClose={() => setModal(null)}
        title={commentService.title}
        description="See what customers are saying and join the conversation."
      >
        <div className="rounded-[18px] p-4" style={{ backgroundColor: COLORS.surfaceAlt }}>
          <p className="text-sm font-semibold">{commentService.provider}</p>
          <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
            {commentService.description}
          </p>
        </div>
        <div className="mt-4 rounded-[18px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(64,87,130,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Comments</p>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              {commentThread.length} shown
            </span>
          </div>
          <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1">
            {commentThread.length > 0 ? (
              commentThread.map((comment) => (
                <div key={comment.id} className="rounded-[16px] p-3" style={{ backgroundColor: COLORS.surfaceAlt }}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{comment.author}</span>
                    <span style={{ color: COLORS.textMuted }}>{comment.handle}</span>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{comment.timeAgo}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
                    {comment.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6" style={{ color: COLORS.textSecondary }}>
                No comments yet. Start the thread with a quick question or recommendation.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Comment</label>
          <textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            className="min-h-28 w-full rounded-[22px] border border-white/65 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:outline-none focus:ring-2 focus:ring-sky-500/25"
            placeholder="Ask a question or leave feedback..."
          />
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-[16px]" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button className="flex-1 rounded-[16px]" style={{ backgroundColor: COLORS.primary }} onClick={submitComment}>
            Post
          </Button>
        </div>
      </AppModal>

      {toast ? (
        <div className="fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 rounded-[18px] px-4 py-3 text-sm font-semibold text-white shadow-lg" style={{ backgroundColor: COLORS.primary }}>
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  action,
  onClick,
}: {
  title: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <h2 className="text-xl font-bold">{title}</h2>
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-semibold"
        style={{ color: COLORS.accent }}
      >
        {action}
      </button>
    </div>
  );
}

function SmallAction({
  icon: Icon,
  label,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: active ? COLORS.accent : COLORS.textSecondary }}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div
      className="flex items-start gap-2 py-1.5 text-[13px]"
      style={{ color: COLORS.textSecondary }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function ProfileSection({
  title,
  items,
}: {
  title: string;
  items: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
    onClick?: () => void;
  }>;
}) {
  return (
    <section className="mt-6">
      <p className="mb-2 text-[13px] font-semibold" style={{ color: COLORS.textMuted }}>
        {title}
      </p>
      <div className="overflow-hidden rounded-[20px] bg-white shadow-sm">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-4 px-4 py-4 text-left"
              style={{ borderTop: index > 0 ? `1px solid ${COLORS.divider}` : "none" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: COLORS.surfaceAlt }}
              >
                <Icon className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{item.label}</p>
                <p className="mt-1 truncate text-xs" style={{ color: COLORS.textMuted }}>
                  {item.value}
                </p>
              </div>
              <ChevronRight className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AppModal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const headingId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;
  const descriptionId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-description`;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 pt-12">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-[460px] rounded-[28px] bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="text-lg font-bold">{title}</h2>
            <p id={descriptionId} className="mt-1 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2"
            style={{ backgroundColor: COLORS.surfaceAlt }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string | (() => string);
}) {
  const text = typeof value === "function" ? value() : value;
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
        {label}
      </span>
      <span className="max-w-[60%] text-right text-sm font-semibold">{text}</span>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[24px] bg-white p-8 text-center shadow-sm">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: COLORS.surfaceAlt }}
      >
        <Search className="h-5 w-5" style={{ color: COLORS.textMuted }} />
      </div>
      <p className="mt-4 text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textSecondary }}>
        {copy}
      </p>
    </div>
  );
}
