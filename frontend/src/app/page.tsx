"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Search,
  Star,
  X,
  Zap,
} from "lucide-react";
import {
  bookingsApi,
  customerApi,
  socialApi,
  type BookingListItem,
  type CustomerAddressItem,
  type SocialFeedPostItem,
} from "@/lib/api";
import {
  HOME_ADDRESS_FIXTURES,
  HOME_BOOKING_FIXTURES,
  HOME_ORDER_HISTORY_FIXTURES,
  HOME_SERVICE_FIXTURES,
  type HomeAddressFixture,
  type HomeServiceFixture,
} from "@/lib/app-home-fixtures";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { generateImageUrl } from "@/lib/image-utils";
import { AppTabs } from "@/components/navigation/AppTabs";
import { SERVICE_CATEGORIES, POPULAR_SERVICES } from "@/lib/services-directory";

interface AreaPoint {
  label: string;
  lat: number;
  lng: number;
}

interface HomeAddressOption extends HomeAddressFixture {
  source: "fixture" | "live";
}

interface RecommendedService extends HomeServiceFixture {
  live: boolean;
}

interface HomeBookingCard {
  id: string;
  service: string;
  provider: string;
  statusLabel: string;
  etaLabel: string;
  scheduledLabel: string;
  address: string;
  progress: number;
  live: boolean;
}

interface HomeOrderCard {
  id: string;
  title: string;
  provider: string;
  dateLabel: string;
  priceLabel: string;
  live: boolean;
}

const SERVICE_ACCENTS = [
  "from-cyan-300 via-sky-400 to-blue-700",
  "from-amber-200 via-orange-400 to-rose-600",
  "from-emerald-300 via-teal-500 to-cyan-700",
  "from-fuchsia-400 via-rose-500 to-orange-600",
];

const AREA_POINTS: AreaPoint[] = [
  { label: "Sandton", lat: -26.1073, lng: 28.0539 },
  { label: "Sandown", lat: -26.1052, lng: 28.0581 },
  { label: "Rosebank", lat: -26.1457, lng: 28.0413 },
  { label: "Fourways", lat: -26.0018, lng: 28.0178 },
  { label: "Midrand", lat: -25.9992, lng: 28.1263 },
  { label: "Pretoria East", lat: -25.7689, lng: 28.3107 },
  { label: "Centurion", lat: -25.8603, lng: 28.1896 },
  { label: "Lone Hill", lat: -26.0116, lng: 28.0154 },
];

function inferAreaFromText(value: string): AreaPoint {
  const normalized = value.trim().toLowerCase();

  return (
    AREA_POINTS.find((area) => normalized.includes(area.label.toLowerCase())) ??
    AREA_POINTS[0]
  );
}

function distanceBetween(first: AreaPoint, second: AreaPoint) {
  const lat = first.lat - second.lat;
  const lng = first.lng - second.lng;
  return Math.sqrt(lat * lat + lng * lng);
}

function travelMinutes(service: Pick<RecommendedService, "lat" | "lng">, area: AreaPoint) {
  const distance = distanceBetween({ label: "service", lat: service.lat, lng: service.lng }, area);
  return Math.max(9, Math.round(9 + distance * 180));
}

function buildMapBounds(
  area: AreaPoint,
  services: Pick<RecommendedService, "lat" | "lng">[],
) {
  const points = [{ lat: area.lat, lng: area.lng }, ...services];
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const padding = 0.045;

  return {
    latMin: Math.min(...latitudes) - padding,
    latMax: Math.max(...latitudes) + padding,
    lngMin: Math.min(...longitudes) - padding,
    lngMax: Math.max(...longitudes) + padding,
  };
}

function buildOsmEmbedUrl(
  bounds: ReturnType<typeof buildMapBounds>,
  marker?: { lat: number; lng: number } | null,
) {
  const bbox = `${bounds.lngMin},${bounds.latMin},${bounds.lngMax},${bounds.latMax}`;
  const markerPart = marker ? `&marker=${marker.lat},${marker.lng}` : "";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik${markerPart}`;
}

function bookingProgress(status: BookingListItem["status"]) {
  switch (status) {
    case "REQUESTED":
      return 24;
    case "ACCEPTED":
      return 56;
    case "IN_PROGRESS":
      return 82;
    case "COMPLETED":
    case "REVIEWABLE":
      return 100;
    default:
      return 8;
  }
}

function bookingStatusLabel(status: BookingListItem["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return "In progress";
    case "REVIEWABLE":
      return "Completed";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
  }
}

function bookingEtaLabel(status: BookingListItem["status"]) {
  switch (status) {
    case "REQUESTED":
      return "Awaiting provider";
    case "ACCEPTED":
      return "Confirmed";
    case "IN_PROGRESS":
      return "On the way";
    case "COMPLETED":
    case "REVIEWABLE":
      return "Completed";
    case "DECLINED":
      return "Declined";
    case "CANCELLED":
      return "Cancelled";
    case "EXPIRED":
      return "Expired";
    default:
      return "Pending";
  }
}

function toAddressOption(address: CustomerAddressItem): HomeAddressOption {
  const area = inferAreaFromText(`${address.label} ${address.value} ${address.note ?? ""}`);

  return {
    id: address.id,
    label: address.label,
    value: address.value,
    note: address.note ?? "Saved location",
    area: area.label,
    lat: area.lat,
    lng: area.lng,
    source: "live",
  };
}

function toRecommendedService(post: SocialFeedPostItem, index: number): RecommendedService {
  const area = inferAreaFromText(post.city);

  return {
    id: `live-service-${post.id}`,
    providerId: post.providerId,
    providerName: post.providerName,
    title: post.serviceName,
    subtitle: `${post.providerName} in ${post.city}`,
    description:
      post.caption?.trim() ||
      `${post.providerName} is actively taking ${post.category.toLowerCase()} requests in ${post.city}.`,
    category: post.category,
    badge: post.reviewCount > 25 ? "Recommended" : "Fresh today",
    priceLabel: "Quote on request",
    accent: SERVICE_ACCENTS[index % SERVICE_ACCENTS.length],
    rating: post.rating,
    reviews: post.reviewCount,
    neighborhood: area.label,
    lat: area.lat,
    lng: area.lng,
    tags: ["Live", "Verified"],
    availableNow: true,
    live: true,
    imageUrl: post.imageUrl || generateImageUrl(post.category, index),
  };
}

function toHomeBookingCard(booking: BookingListItem): HomeBookingCard {
  return {
    id: booking.id,
    service: booking.service,
    provider: booking.provider.name,
    statusLabel: bookingStatusLabel(booking.status),
    etaLabel: bookingEtaLabel(booking.status),
    scheduledLabel: formatDateTime(booking.scheduledAt),
    address: booking.address,
    progress: bookingProgress(booking.status),
    live: true,
  };
}

function toOrderCard(booking: BookingListItem): HomeOrderCard {
  return {
    id: booking.id,
    title: booking.service,
    provider: booking.provider.name,
    dateLabel: formatDateTime(booking.scheduledAt),
    priceLabel: booking.price ? formatCurrency(booking.price) : "Quote settled",
    live: true,
  };
}

const fallbackAddresses: HomeAddressOption[] = HOME_ADDRESS_FIXTURES.map((address) => ({
  ...address,
  source: "fixture",
}));

const fallbackServices: RecommendedService[] = HOME_SERVICE_FIXTURES.map((service) => ({
  ...service,
  live: false,
}));

const fallbackBookings: HomeBookingCard[] = HOME_BOOKING_FIXTURES.map((booking) => ({
  ...booking,
  live: false,
}));

const fallbackOrders: HomeOrderCard[] = HOME_ORDER_HISTORY_FIXTURES.map((order) => ({
  ...order,
  live: false,
}));

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Form states
  const [address, setAddress] = useState("123 Main Street, Sandton");
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [loadedServiceImages, setLoadedServiceImages] = useState<Set<number>>(new Set());
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());

  // Data states
  const [addresses, setAddresses] = useState<HomeAddressOption[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<RecommendedService[]>([]);
  const [liveBookings, setLiveBookings] = useState<HomeBookingCard[]>([]);
  const [completed, setCompleted] = useState<HomeOrderCard[]>([]);
  const [currentBookings, setCurrentBookings] = useState<HomeBookingCard[]>([]);
  const [recentOrders, setRecentOrders] = useState<HomeOrderCard[]>([]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) {
      return;
    }

    if (user?.activeRole === "PROVIDER") {
      router.replace("/provider");
      return;
    }

    if (user?.activeRole === "ADMIN" || user?.activeRole === "SUPPORT") {
      router.replace("/admin");
    }
  }, [hydrated, isAuthenticated, router, user]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isAuthenticated && user?.activeRole === "CUSTOMER") {
        try {
          const response = await customerApi.getAddresses();
          if (cancelled || response.data.length === 0) {
            return;
          }

          const liveAddresses = response.data.map(toAddressOption);
          const defaultAddressEntry =
            response.data.find((entry) => entry.defaultAddress) ?? response.data[0];
          const defaultAddress =
            liveAddresses.find((item) => item.id === defaultAddressEntry.id) ??
            liveAddresses[0];

          setAddresses(liveAddresses);
          setAddress(defaultAddress.value);
        } catch {
          // Keep fixture addresses when saved addresses are unavailable.
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await socialApi.getFeed({ size: 8 });
        if (cancelled || response.data.length === 0) {
          return;
        }

        setRecommendedServices(response.data.map(toRecommendedService));
      } catch {
        // Keep fixture recommendations when the feed is unavailable.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isAuthenticated || user?.activeRole !== "CUSTOMER") {
        return;
      }

      try {
        const response = await bookingsApi.getAll({ page: 0, size: 8 });
        if (cancelled) {
          return;
        }

        const liveBookings = response.data.content ?? [];
        if (liveBookings.length === 0) {
          return;
        }

        const active = liveBookings.filter((booking) =>
          ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(booking.status),
        );
        const completed = liveBookings.filter((booking) =>
          ["COMPLETED", "REVIEWABLE"].includes(booking.status),
        );

        setCurrentBookings(
          (active.length > 0 ? active : liveBookings).slice(0, 3).map(toHomeBookingCard),
        );
        setRecentOrders(
          (completed.length > 0 ? completed : liveBookings).slice(0, 3).map(toOrderCard),
        );
      } catch {
        // Keep fixture booking previews when the API is unavailable.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const activeArea = useMemo(() => inferAreaFromText(address), [address]);

  const addressSuggestions = useMemo(() => {
    const query = address.trim().toLowerCase();
    if (!query) {
      return addresses;
    }

    return addresses.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query) ||
        item.area.toLowerCase().includes(query) ||
        item.note.toLowerCase().includes(query),
    );
  }, [address, addresses]);

  const serviceCategories = useMemo(
    () => ["All", ...Array.from(new Set(recommendedServices.map((service) => service.category)))],
    [recommendedServices],
  );

  const filteredServices = useMemo(() => {
    return recommendedServices
      .filter((service) => {
        const query = serviceQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          `${service.title} ${service.subtitle} ${service.providerName} ${service.category} ${service.neighborhood}`
            .toLowerCase()
            .includes(query);
        const matchesCategory =
          selectedCategory === "All" || service.category === selectedCategory;
        return matchesQuery && matchesCategory;
      })
      .sort((left, right) => travelMinutes(left, activeArea) - travelMinutes(right, activeArea));
  }, [activeArea, recommendedServices, selectedCategory, serviceQuery]);

  const selectedService =
    filteredServices.find((service) => service.id === selectedServiceId) ??
    filteredServices[0] ??
    null;

  const mapBounds = useMemo(
    () => buildMapBounds(activeArea, filteredServices.slice(0, 6)),
    [activeArea, filteredServices],
  );

  const mapUrl = useMemo(
    () =>
      buildOsmEmbedUrl(
        mapBounds,
        selectedService
          ? { lat: selectedService.lat, lng: selectedService.lng }
          : { lat: activeArea.lat, lng: activeArea.lng },
      ),
    [activeArea, mapBounds, selectedService],
  );

  const mapPins = useMemo(() => {
    return filteredServices.slice(0, 6).map((service) => {
      const left =
        ((service.lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin || 1)) * 76 + 12;
      const top =
        ((mapBounds.latMax - service.lat) / (mapBounds.latMax - mapBounds.latMin || 1)) * 66 + 12;

      return {
        ...service,
        left,
        top,
      };
    });
  }, [filteredServices, mapBounds]);

  const openService = (service: RecommendedService) => {
    // Pass service data to booking workflow
    const bookingData = {
      provider: service.providerName,
      service: service.title,
      category: service.category,
      price: service.priceLabel
    };
    // Store booking data in session storage for the booking wizard
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    router.push("/book");
  };

  const handleServiceImageLoad = (index: number) => {
    setLoadedServiceImages(prev => new Set(prev).add(index));
  };

  const homeName = user?.firstName ?? "there";

  const shouldHideForRole =
    hydrated &&
    isAuthenticated &&
    user?.activeRole !== "CUSTOMER" &&
    user?.activeRole !== undefined;

  if (shouldHideForRole) {
    return null;
  }

  const FILTER_CHIPS = ["Offers", "Under 30 min", "Top rated", "Available now"];

  const toggleChip = (chip: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_28%)]" />
      <AppTabs />

      <div className="relative mx-auto max-w-3xl pb-24">
        {/* ═══ Sticky Header: Search + Address ═══ */}
        <div className="sticky top-0 z-40 bg-[#07111f]/95 backdrop-blur-xl">
          <div className="px-4 pb-2 pt-3 sm:px-6">
            {/* Search bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                placeholder="Search ServeHub"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/6 pl-11 pr-10 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-white/20 focus:bg-white/8"
              />
              {serviceQuery && (
                <button
                  onClick={() => setServiceQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Address row */}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAddressSuggestionsOpen(!addressSuggestionsOpen)}
                className="flex items-center gap-1.5 rounded-full py-1 text-sm text-white/70 transition hover:text-white"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-[200px] truncate">{address.split(",")[0]}</span>
                <ChevronDown className="h-3 w-3 text-white/40" />
              </button>
              <button
                onClick={() => router.push("/bookings")}
                className="flex items-center gap-1.5 rounded-full py-1 text-sm text-white/50 transition hover:text-white"
              >
                <CalendarCheck2 className="h-3.5 w-3.5" />
                Bookings ({currentBookings.length})
              </button>
            </div>

            {/* Address dropdown */}
            {addressSuggestionsOpen && (
              <div className="mt-2 rounded-2xl border border-white/10 bg-[#0a1525] p-3 shadow-xl">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                  Your addresses
                </p>
                <div className="space-y-1">
                  {addressSuggestions.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setAddress(s.value);
                        setAddressSuggestionsOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/6 active:bg-white/8"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/8">
                        <MapPin className="h-3.5 w-3.5 text-white/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.label}</p>
                        <p className="text-xs text-white/40 truncate">{s.value}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ Horizontal category filter tabs ═══ */}
          <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none sm:px-6">
            <button
              onClick={() => setSelectedCategory("All")}
              className={cn(
                "flex h-9 flex-shrink-0 items-center rounded-full px-4 text-[13px] font-medium transition-all active:scale-95",
                selectedCategory === "All"
                  ? "bg-white text-[#07111f]"
                  : "border border-white/10 bg-white/5 text-white/60",
              )}
            >
              All
            </button>
            {serviceCategories
              .filter((c) => c !== "All")
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex h-9 flex-shrink-0 items-center rounded-full px-4 text-[13px] font-medium transition-all active:scale-95",
                    selectedCategory === cat
                      ? "bg-white text-[#07111f]"
                      : "border border-white/10 bg-white/5 text-white/60",
                  )}
                >
                  {cat}
                </button>
              ))}
          </div>
          <div className="h-px bg-white/6" />
        </div>

        {/* ═══ Scrollable content ═══ */}
        <div className="px-4 pt-4 sm:px-6">

          {/* ─── Category icon bubbles (Uber Eats style) ─── */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => router.push(`/services?cat=${cat.id}`)}
                className="flex flex-shrink-0 flex-col items-center gap-2 transition-transform active:scale-95"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/6 text-2xl transition hover:bg-white/10">
                  {cat.emoji}
                </div>
                <span className="max-w-[72px] truncate text-center text-[11px] text-white/60">
                  {cat.name.split("&")[0].trim()}
                </span>
              </button>
            ))}
          </div>

          {/* ─── Filter chips ─── */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                className={cn(
                  "flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-all active:scale-95",
                  activeChips.has(chip)
                    ? "bg-white text-[#07111f]"
                    : "border border-white/10 bg-white/5 text-white/60",
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ─── Active booking strip (Uber-style top bar) ─── */}
          {currentBookings.length > 0 && (
            <button
              onClick={() => router.push("/bookings")}
              className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-4 text-left transition-all active:scale-[0.98] hover:bg-cyan-500/12"
            >
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/25">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {currentBookings[0].service}
                </p>
                <p className="text-xs text-white/50">
                  {currentBookings[0].etaLabel} · {currentBookings[0].provider}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-cyan-300">{currentBookings[0].statusLabel}</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${currentBookings[0].progress}%` }}
                  />
                </div>
              </div>
            </button>
          )}

          {/* ═══ Featured on ServeHub (large cards like Uber Eats) ═══ */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Featured on ServeHub</h2>
                <p className="text-xs text-white/35">Sponsored</p>
              </div>
              <button
                onClick={() => router.push("/explore")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 transition hover:bg-white/12"
              >
                <ArrowRight className="h-4 w-4 text-white/60" />
              </button>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {filteredServices.slice(0, 6).map((service, index) => (
                <button
                  key={service.id}
                  onClick={() => openService(service)}
                  className="group relative w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/4 text-left transition-all active:scale-[0.97] hover:border-white/14"
                >
                  {/* Card image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                    <img
                      src={service.imageUrl || generateImageUrl(service.category, index, { width: 400, height: 250 })}
                      alt={service.title}
                      loading="lazy"
                      onLoad={() => handleServiceImageLoad(index)}
                      className={cn(
                        "h-full w-full object-cover transition-all duration-500",
                        loadedServiceImages.has(index) ? "opacity-100 scale-100" : "opacity-0 scale-105",
                      )}
                    />
                    {!loadedServiceImages.has(index) && (
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/60 via-transparent to-transparent" />
                    {service.availableNow && (
                      <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Zap className="h-2.5 w-2.5" /> Available now
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 transition hover:text-white"
                    >
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Card body */}
                  <div className="p-3">
                    <p className="text-[14px] font-medium leading-tight text-white/90 line-clamp-1">
                      {service.providerName}
                    </p>
                    <p className="mt-0.5 text-[12px] text-white/40 line-clamp-1">{service.title}</p>
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-white/50">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-amber-400" />
                        {service.rating.toFixed(1)} ({service.reviews})
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {travelMinutes(service, activeArea)} min
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-cyan-300/80">{service.priceLabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ Popular services grid (Uber Eats "Picked for you") ═══ */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Popular services</h2>
            <p className="text-xs text-white/35">Most booked this week</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {POPULAR_SERVICES.slice(0, 6).map((service) => {
                const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      sessionStorage.setItem("bookingData", JSON.stringify({ service: service.name, category: cat?.name ?? "" }));
                      router.push("/book");
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 text-left transition-all active:scale-[0.97] hover:border-white/14"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/30 to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-medium leading-tight text-white/90 line-clamp-1">
                        {service.name}
                      </p>
                      {cat && (
                        <p className="mt-0.5 text-[11px] text-white/35">{cat.emoji} {cat.name}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ All recommended / filtered ═══ */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedCategory === "All" ? "All services near you" : selectedCategory}
              </h2>
              <button
                onClick={() => router.push("/services")}
                className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                View all 100 →
              </button>
            </div>
            {filteredServices.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/4 py-12 text-center">
                <Search className="h-6 w-6 text-white/20" />
                <p className="mt-3 text-sm font-medium text-white/50">No services found</p>
                <p className="mt-1 text-xs text-white/30">Try a different search or category</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {filteredServices.slice(0, 8).map((service, index) => (
                  <button
                    key={service.id}
                    onClick={() => openService(service)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3 text-left transition-all active:scale-[0.98] hover:border-white/12 hover:bg-white/6"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-[80px] w-[80px] flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                      <img
                        src={service.imageUrl || generateImageUrl(service.category, index, { width: 200, height: 200 })}
                        alt={service.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-white line-clamp-1">
                        {service.providerName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-white/45 line-clamp-1">{service.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[12px] text-white/40">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-amber-400" />
                          {service.rating.toFixed(1)} ({service.reviews}+)
                        </span>
                        <span>·</span>
                        <span>{travelMinutes(service, activeArea)} min</span>
                      </div>
                      <p className="mt-1 text-xs text-cyan-300/70">{service.priceLabel}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/20" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══ Recent reorders ═══ */}
          {recentOrders.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Order again</h2>
                <button
                  onClick={() => router.push("/bookings")}
                  className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                >
                  See all
                </button>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {recentOrders.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push("/bookings")}
                    className="w-[180px] flex-shrink-0 rounded-2xl border border-white/8 bg-white/4 p-3 text-left transition-all active:scale-[0.97] hover:bg-white/6"
                  >
                    <p className="text-sm font-medium text-white line-clamp-1">{item.title}</p>
                    <p className="mt-1 text-xs text-white/40">{item.provider}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-white/30">{item.dateLabel}</span>
                      <span className="font-medium text-cyan-300">{item.priceLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
