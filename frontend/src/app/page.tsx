"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  HOME_HIGHLIGHTS,
  HOME_ORDER_HISTORY_FIXTURES,
  HOME_SERVICE_FIXTURES,
  type HomeAddressFixture,
  type HomeServiceFixture,
} from "@/lib/app-home-fixtures";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { generateImageUrl, generateFallbackGradient } from "@/lib/image-utils";
import { AppTabs } from "@/components/navigation/AppTabs";

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
    if (service.live && service.providerId) {
      router.push(`/providers/${service.providerId}`);
      return;
    }

    router.push("/explore");
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

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-white/10 bg-white/8 p-2.5 backdrop-blur-md">
          <AppTabs />
        </div>
        
        {/* Mobile-optimized header */}
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55 sm:text-[12px]">
              Homepage
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl lg:text-[2.2rem]">
              Good morning, {homeName}
            </h1>
            <p className="mt-2 text-sm text-white/58 sm:text-base">
              Set an address, check the map, and jump into services or bookings from one place.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Avatar name={user?.fullName ?? "ServeHub"} src={user?.avatar} size="lg" />
          </div>
        </div>

        {/* Mobile-first grid layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr] xl:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            {/* Address input - mobile optimized */}
            <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md sm:p-5">
              <div className="space-y-3">
                <Input
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setAddressSuggestionsOpen(true);
                  }}
                  onFocus={() => setAddressSuggestionsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setAddressSuggestionsOpen(false), 120);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && addressSuggestions[0]) {
                      event.preventDefault();
                      setAddress(addressSuggestions[0].value);
                      setAddressSuggestionsOpen(false);
                    }
                  }}
                  placeholder="Enter address"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  className="h-12 rounded-full border-white/8 bg-white text-slate-950 placeholder:text-slate-400 text-base sm:text-sm"
                />
                
                {/* Address suggestions - mobile optimized */}
                {addressSuggestionsOpen ? (
                  <div className="mt-3 space-y-2 rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Suggested addresses
                    </p>
                    <div className="space-y-2">
                      {addressSuggestions.slice(0, 5).map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setAddress(suggestion.value);
                            setAddressSuggestionsOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-[16px] bg-white/6 px-3 py-3 text-left min-h-[44px] active:bg-white/10"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white truncate">{suggestion.label}</p>
                            <p className="mt-1 text-xs text-white/48 truncate">{suggestion.value}</p>
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.12em] text-cyan-200 flex-shrink-0">
                            {suggestion.area}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                {/* Quick address buttons - mobile optimized */}
                <div className="flex flex-wrap gap-2">
                  {addresses.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAddress(item.value)}
                      className={cn(
                        "min-h-[44px] min-w-[44px] rounded-full border px-3 py-2 text-xs transition-colors active:scale-95",
                        address === item.value
                          ? "border-cyan-300/40 bg-cyan-400/12 text-cyan-100"
                          : "border-white/10 bg-black/20 text-white/72",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/50">Matched area: {activeArea.label}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_52%,#ff9d7d_100%)] p-5 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                Recommended right now
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                The app home should feel like booking, not browsing a landing page.
              </h2>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                {HOME_HIGHLIGHTS.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              <Button
                className="mt-4 min-h-11 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-900"
                onClick={() => router.push("/explore")}
              >
                Open explore
              </Button>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Current bookings</p>
                  <p className="text-xs text-white/45">
                    Open the jobs already in motion or jump to the full bookings page.
                  </p>
                </div>
                <Button variant="ghost" onClick={() => router.push("/bookings")}>
                  View all
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {currentBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => router.push("/bookings")}
                    className="w-full rounded-[24px] border border-white/10 bg-black/20 p-4 text-left transition hover:bg-black/28"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.service}</p>
                        <p className="mt-1 text-sm text-white/55">{booking.provider}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {booking.statusLabel}
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#8ef7d6_0%,#7dd3fc_100%)]"
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
                      <span>{booking.scheduledLabel}</span>
                      <span>{booking.etaLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Map widget</p>
                  <p className="text-xs text-white/45">
                    Services nearest to your selected address, just like the app home used to do.
                  </p>
                </div>
                <Badge className="rounded-full border border-cyan-300/18 bg-cyan-400/12 text-cyan-100 hover:bg-cyan-400/12">
                  {activeArea.label}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {serviceCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "min-h-10 rounded-full px-3 py-2 text-xs transition-colors",
                      selectedCategory === category
                        ? "bg-white text-slate-950"
                        : "border border-white/10 bg-black/20 text-white/72",
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#091220]">
                <div className="relative h-[320px]">
                  <iframe
                    title="Service coverage map"
                    src={mapUrl}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.24),rgba(7,17,31,0.55))] pointer-events-none" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/78">
                    Service coverage
                  </div>
                  {mapPins.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedServiceId(service.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${service.left}%`, top: `${service.top}%` }}
                    >
                      <span
                        className={cn(
                          "relative flex h-11 w-11 items-center justify-center rounded-full border text-white shadow-[0_12px_24px_rgba(5,11,20,0.45)]",
                          selectedService?.id === service.id
                            ? "border-cyan-200 bg-cyan-400 text-slate-950"
                            : "border-white/14 bg-black/45",
                        )}
                      >
                        <MapPin className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                  {selectedService ? (
                    <div className="absolute inset-x-4 bottom-4 rounded-[20px] border border-white/10 bg-[#08111f]/92 p-4 backdrop-blur-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{selectedService.title}</p>
                          <p className="mt-1 text-xs text-white/52">
                            {selectedService.providerName} | {selectedService.neighborhood}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/72">
                          {travelMinutes(selectedService, activeArea)} min
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-white/48">{selectedService.priceLabel}</p>
                        <button
                          type="button"
                          onClick={() => openService(selectedService)}
                          className="text-xs font-semibold text-cyan-200"
                        >
                          Open service
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Search services near you</p>
                  <p className="text-xs text-white/45">
                    The home screen should surface what to book next, not make you hunt for it.
                  </p>
                </div>
                <Search className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="mt-3">
                <Input
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder="Search cleaning, plumbing, electrical..."
                  leftIcon={<Search className="h-4 w-4" />}
                  className="h-12 rounded-full border-white/8 bg-black/20 text-white placeholder:text-white/35"
                />
              </div>
              <p className="mt-3 text-xs text-white/48">
                Sorted by distance from {activeArea.label}.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Recommended services</p>
              <p className="text-xs text-white/45">
                Quick tiles to jump straight into booking from the home screen.
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push("/explore")}>
              Explore all
            </Button>
          </div>
          {filteredServices.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-white/12 bg-white/6 p-6 text-center">
              <p className="text-sm font-semibold">No services found</p>
              <p className="mt-2 text-sm text-white/50">
                Try another search term or switch your category filter.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filteredServices.slice(0, 8).map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => openService(service)}
                  className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${service.accent} p-4 text-left text-white`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,15,28,0.94),rgba(8,15,28,0.18))]" />
                  
                  {/* Service Image */}
                  <div className="absolute inset-0">
                    <div className={`absolute inset-0 bg-gradient-to-br ${generateFallbackGradient(service.category)}`} />
                    <img
                      src={generateImageUrl(service.category, index, { width: 400, height: 300 })}
                      alt={`${service.category} service`}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-all duration-500",
                        loadedServiceImages.has(index) ? "opacity-30" : "opacity-0"
                      )}
                      loading="lazy"
                      onLoad={() => handleServiceImageLoad(index)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-medium">
                        {service.badge}
                      </span>
                      <Sparkles className="h-5 w-5 text-white/86" />
                    </div>
                    <h3 className="mt-10 text-xl font-semibold">{service.title}</h3>
                    <p className="mt-1 text-sm text-white/72">{service.subtitle}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/24 px-3 py-2 text-sm">
                      <Clock3 className="h-4 w-4" />
                      {travelMinutes(service, activeArea)} min
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-white/66">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                        {service.rating.toFixed(1)}
                      </span>
                      <span>{service.reviews} reviews</span>
                    </div>
                    <p className="mt-3 text-xs text-white/55">{service.priceLabel}</p>
                    <p className="mt-2 text-xs text-cyan-100/82">{service.neighborhood}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Recent reorders</p>
                <p className="text-xs text-white/45">
                  Jump back into services you already trust.
                </p>
              </div>
              <CalendarCheck2 className="h-4 w-4 text-cyan-200" />
            </div>
            <div className="mt-4 space-y-3">
              {recentOrders.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push("/bookings")}
                  className="w-full rounded-[22px] border border-white/10 bg-black/20 p-4 text-left transition hover:bg-black/28"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-white/55">{item.provider}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/72">
                      {item.priceLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                    <span>{item.dateLabel}</span>
                    <span className="text-cyan-200">Rebook</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Why this home works</p>
                <p className="text-xs text-white/45">
                  The app home is where location, discovery, and active jobs meet.
                </p>
              </div>
              <Badge className="rounded-full border border-white/10 bg-white/8 text-white hover:bg-white/8">
                App home
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Address first",
                  body: "Your location anchors everything from recommendations to the map widget.",
                },
                {
                  title: "Map in context",
                  body: "You can see service coverage without leaving the home screen.",
                },
                {
                  title: "Bookings stay close",
                  body: "Current jobs and repeat services are one scroll away instead of buried.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                >
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => router.push("/explore")}>
                Explore now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/bookings")}>
                Open bookings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
