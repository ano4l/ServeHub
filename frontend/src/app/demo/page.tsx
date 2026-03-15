"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Droplets,
  Heart,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  PencilLine,
  Phone,
  Repeat2,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  demoAddressBook,
  demoBookings,
  demoFeedPosts,
  demoPaymentMethods,
  homeHighlights,
  homeServices,
  orderHistory,
  profileSettings,
  profileStats,
} from "@/lib/demo-data";

type AppTab = "home" | "explore" | "bookings" | "profile";
type FeedMode = "for-you" | "nearby" | "trending";
type FeedPost = (typeof demoFeedPosts)[number];
type FeedComment = FeedPost["comments"][number];
type FinderSuggestion = {
  id: string;
  label: string;
  value: string;
  neighborhood: string;
  lat: number;
  lng: number;
};

const serviceIcons = [Droplets, Sparkles, Zap, Wrench];
const SANDTON_BOUNDS = {
  latMin: -26.16,
  latMax: -26.06,
  lngMin: 28.015,
  lngMax: 28.095,
};
const SOUTH_AFRICA_REGION = "za";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const finderSuggestions: FinderSuggestion[] = [
  {
    id: "finder-home",
    label: "Home",
    value: "Sandton City, 83 Rivonia Road, Sandhurst, Sandton",
    neighborhood: "Sandhurst",
    lat: -26.1073,
    lng: 28.0539,
  },
  {
    id: "finder-office",
    label: "Office",
    value: "The Marc, 129 Rivonia Road, Sandown, Sandton",
    neighborhood: "Sandown",
    lat: -26.1052,
    lng: 28.0581,
  },
  {
    id: "finder-mom",
    label: "Mom's house",
    value: "3 Benmore Road, Benmore Gardens, Sandton",
    neighborhood: "Benmore",
    lat: -26.1024,
    lng: 28.0605,
  },
  {
    id: "finder-nelson-mandela-square",
    label: "Nelson Mandela Square",
    value: "5 Maude Street, Sandown, Sandton",
    neighborhood: "Sandown",
    lat: -26.1075,
    lng: 28.0541,
  },
  {
    id: "finder-morningside",
    label: "Morningside",
    value: "10 Rivonia Road, Morningside, Sandton",
    neighborhood: "Morningside",
    lat: -26.0827,
    lng: 28.0608,
  },
  {
    id: "finder-rivonia",
    label: "Rivonia",
    value: "9 Wessel Road, Rivonia, Sandton",
    neighborhood: "Rivonia",
    lat: -26.0585,
    lng: 28.0608,
  },
  {
    id: "finder-bryanston",
    label: "Bryanston",
    value: "21 Ballyclare Drive, Bryanston, Sandton",
    neighborhood: "Bryanston",
    lat: -26.0583,
    lng: 28.0288,
  },
  {
    id: "finder-illovo",
    label: "Illovo",
    value: "204 Oxford Road, Illovo, Sandton",
    neighborhood: "Illovo",
    lat: -26.1284,
    lng: 28.0522,
  },
  {
    id: "finder-hyde-park",
    label: "Hyde Park",
    value: "Jan Smuts Avenue, Hyde Park, Sandton",
    neighborhood: "Hyde Park",
    lat: -26.1256,
    lng: 28.0369,
  },
  {
    id: "finder-parkmore",
    label: "Parkmore",
    value: "11 9th Street, Parkmore, Sandton",
    neighborhood: "Parkmore",
    lat: -26.0994,
    lng: 28.0388,
  },
  {
    id: "finder-sandown",
    label: "Sandown",
    value: "Alice Lane, Sandown, Sandton",
    neighborhood: "Sandown",
    lat: -26.1056,
    lng: 28.0568,
  },
  {
    id: "finder-rosebank",
    label: "Rosebank",
    value: "15 Tyrwhitt Avenue, Rosebank, Johannesburg",
    neighborhood: "Rosebank",
    lat: -26.1457,
    lng: 28.0413,
  },
  {
    id: "finder-lonehill",
    label: "Lonehill",
    value: "Lonehill Boulevard, Lone Hill, Sandton",
    neighborhood: "Lone Hill",
    lat: -26.0116,
    lng: 28.0154,
  },
];
const serviceNeighborhoodById: Record<string, string> = {
  "service-1": "Sandown",
  "service-2": "Benmore",
  "service-3": "Morningside",
  "service-4": "Bryanston",
  "service-5": "Sandhurst",
  "service-6": "Illovo",
  "service-7": "Parkmore",
  "service-8": "Rivonia",
  "service-9": "Sandown",
  "service-10": "Benmore",
  "service-11": "Morningside",
  "service-12": "Bryanston",
  "service-13": "Rivonia",
  "service-14": "Rosebank",
  "service-15": "Hyde Park",
  "service-16": "Lone Hill",
  "service-17": "Parkmore",
  "service-18": "Sandhurst",
};

function getSuggestionByNeighborhood(neighborhood: string) {
  return (
    finderSuggestions.find((suggestion) => suggestion.neighborhood === neighborhood) ??
    finderSuggestions[0]
  );
}

function inferSuggestionFromAddress(address: string) {
  const normalized = address.trim().toLowerCase();
  if (!normalized) return finderSuggestions[0];

  const directMatch = finderSuggestions.find(
    (suggestion) =>
      suggestion.value.toLowerCase() === normalized ||
      suggestion.neighborhood.toLowerCase() === normalized ||
      normalized.includes(suggestion.neighborhood.toLowerCase()) ||
      normalized.includes(suggestion.label.toLowerCase()),
  );

  if (directMatch) return directMatch;

  const savedAddressMatch = demoAddressBook.find((saved) =>
    normalized.includes(saved.value.toLowerCase()) || normalized.includes(saved.label.toLowerCase()),
  );

  if (savedAddressMatch) {
    return (
      finderSuggestions.find((suggestion) =>
        suggestion.value.toLowerCase().includes(savedAddressMatch.value.toLowerCase()),
      ) ?? finderSuggestions[0]
    );
  }

  return finderSuggestions[0];
}

function distanceBetween(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const lat = first.lat - second.lat;
  const lng = first.lng - second.lng;
  return Math.sqrt(lat * lat + lng * lng);
}

function serviceTravelMinutes(serviceId: string, activeSuggestion: FinderSuggestion) {
  const serviceSuggestion = getSuggestionByNeighborhood(serviceNeighborhoodById[serviceId] ?? "Sandown");
  const distance = distanceBetween(activeSuggestion, serviceSuggestion);
  return Math.max(9, Math.min(68, Math.round(9 + distance * 180)));
}

function parseCompactCount(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.endsWith("K")) return Math.round(Number(trimmed.slice(0, -1)) * 1000);
  if (trimmed.endsWith("M")) return Math.round(Number(trimmed.slice(0, -1)) * 1000000);
  return Number(trimmed.replace(/,/g, "")) || 0;
}

function compactCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
  return `${value}`;
}

function isWithinBounds(
  point: { lat: number; lng: number },
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number },
) {
  return (
    point.lat >= bounds.latMin &&
    point.lat <= bounds.latMax &&
    point.lng >= bounds.lngMin &&
    point.lng <= bounds.lngMax
  );
}

function buildOsmEmbedUrl(
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number },
  marker?: { lat: number; lng: number } | null,
) {
  const bbox = `${bounds.lngMin},${bounds.latMin},${bounds.lngMax},${bounds.latMax}`;
  const markerPart = marker ? `&marker=${marker.lat},${marker.lng}` : "";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${markerPart}`;
}

function buildOsmOpenUrl(marker?: { lat: number; lng: number } | null) {
  if (marker) {
    return `https://www.openstreetmap.org/?mlat=${marker.lat}&mlon=${marker.lng}#map=14/${marker.lat}/${marker.lng}`;
  }

  const lat = (SANDTON_BOUNDS.latMin + SANDTON_BOUNDS.latMax) / 2;
  const lng = (SANDTON_BOUNDS.lngMin + SANDTON_BOUNDS.lngMax) / 2;
  return `https://www.openstreetmap.org/#map=13/${lat}/${lng}`;
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [address, setAddress] = useState("Sandton City, 83 Rivonia Road, Sandhurst, Sandton");
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const [addressFinderStatus, setAddressFinderStatus] = useState<string | null>(null);
  const [addressSearchResults, setAddressSearchResults] = useState<FinderSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [bookings] = useState(demoBookings);
  const [selectedBookingId, setSelectedBookingId] = useState(demoBookings[0].id);
  const [bookingMessages, setBookingMessages] = useState(
    Object.fromEntries(demoBookings.map((booking) => [booking.id, booking.thread])),
  );
  const [bookingComposer, setBookingComposer] = useState("");
  const [searchText, setSearchText] = useState("");
  const [serviceGridOpen, setServiceGridOpen] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapFilterOpen, setMapFilterOpen] = useState(false);
  const [mapCategoryFilter, setMapCategoryFilter] = useState("All");
  const [selectedMapServiceId, setSelectedMapServiceId] = useState<string | null>(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSavedStatus, setProfileSavedStatus] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "Ano Dzinotyiwei",
    email: "ano@example.com",
    phone: "+27 82 555 0134",
    tagline: "Keep the home admin light while trusted pros handle the hard stuff.",
  });
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([
    "Plumbing",
    "Cleaning",
    "Hair",
  ]);
  const [notificationMode, setNotificationMode] = useState("Push + SMS");
  const [preferredWindow, setPreferredWindow] = useState("After work");
  const [feedMode, setFeedMode] = useState<FeedMode>("for-you");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>({});
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [feedComments, setFeedComments] = useState<Record<string, FeedComment[]>>(
    Object.fromEntries(demoFeedPosts.map((post) => [post.id, post.comments])),
  );
  const [feedStats, setFeedStats] = useState(
    Object.fromEntries(
      demoFeedPosts.map((post) => [
        post.id,
        {
          likes: parseCompactCount(post.stats.likes),
          comments: parseCompactCount(post.stats.comments),
          reposts: parseCompactCount(post.stats.reposts),
        },
      ]),
    ) as Record<string, { likes: number; comments: number; reposts: number }>,
  );

  useEffect(() => {
    if (!openCommentsFor) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenCommentsFor(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCommentsFor]);

  useEffect(() => {
    if (!addressFinderStatus) return;
    const timeout = window.setTimeout(() => setAddressFinderStatus(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [addressFinderStatus]);

  useEffect(() => {
    if (!profileSavedStatus) return;
    const timeout = window.setTimeout(() => setProfileSavedStatus(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [profileSavedStatus]);

  const activeAddressSuggestion = useMemo(
    () => inferSuggestionFromAddress(address),
    [address],
  );
  const addressSuggestions = useMemo(() => {
    const query = address.trim().toLowerCase();
    const localMatches = finderSuggestions.filter(
      (suggestion) =>
        suggestion.value.toLowerCase().includes(query) ||
        suggestion.neighborhood.toLowerCase().includes(query) ||
        suggestion.label.toLowerCase().includes(query),
    );

    if (!query) return [...localMatches, ...addressSearchResults];

    const merged = [...addressSearchResults, ...localMatches];
    return merged.filter(
      (suggestion, index, allSuggestions) =>
        allSuggestions.findIndex((candidate) => candidate.value === suggestion.value) === index,
    );
  }, [address, addressSearchResults]);
  const serviceCategoryOptions = useMemo(
    () => Array.from(new Set(homeServices.map((service) => service.category))),
    [],
  );
  const mapCategoryOptions = useMemo(() => ["All", ...serviceCategoryOptions], [serviceCategoryOptions]);
  const activeSavedAddress = useMemo(
    () => demoAddressBook.find((item) => item.value === address) ?? null,
    [address],
  );
  const profileCompletion = useMemo(() => {
    const completedFields = [
      profileForm.fullName,
      profileForm.email,
      profileForm.phone,
      profileForm.tagline,
      activeSavedAddress?.value ?? address,
    ].filter((value) => value.trim().length > 0).length;

    return Math.min(100, Math.round((completedFields / 5) * 100));
  }, [activeSavedAddress, address, profileForm]);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? bookings[0],
    [bookings, selectedBookingId],
  );
  const currentMessages = bookingMessages[selectedBooking.id] ?? selectedBooking.thread;
  const filteredServices = useMemo(
    () =>
      homeServices.filter((service) =>
        `${service.title} ${service.subtitle} ${service.provider} ${service.category}`
          .toLowerCase()
          .includes(searchText.toLowerCase()),
      )
      .sort(
        (left, right) => {
          const leftFavorite = favoriteCategories.includes(left.category) ? 0 : 1;
          const rightFavorite = favoriteCategories.includes(right.category) ? 0 : 1;
          if (leftFavorite !== rightFavorite) return leftFavorite - rightFavorite;

          return (
            serviceTravelMinutes(left.id, activeAddressSuggestion) -
            serviceTravelMinutes(right.id, activeAddressSuggestion)
          );
        },
      )
      .map((service) => ({
        ...service,
        neighborhood: serviceNeighborhoodById[service.id] ?? activeAddressSuggestion.neighborhood,
        dynamicEta: `${serviceTravelMinutes(service.id, activeAddressSuggestion)} min`,
      })),
    [activeAddressSuggestion, favoriteCategories, searchText],
  );
  const mapVisibleServices = useMemo(
    () =>
      filteredServices.filter((service) =>
        mapCategoryFilter === "All" ? true : service.category === mapCategoryFilter,
      ),
    [filteredServices, mapCategoryFilter],
  );
  const mapPins = useMemo(() => {
    return mapVisibleServices.slice(0, 10).map((service, index) => {
      const suggestion = getSuggestionByNeighborhood(service.neighborhood);
      const normalizedX =
        (suggestion.lng - SANDTON_BOUNDS.lngMin) /
        (SANDTON_BOUNDS.lngMax - SANDTON_BOUNDS.lngMin || 1);
      const normalizedY =
        (SANDTON_BOUNDS.latMax - suggestion.lat) /
        (SANDTON_BOUNDS.latMax - SANDTON_BOUNDS.latMin || 1);

      return {
        ...service,
        left: 10 + normalizedX * 78 + ((index % 3) - 1) * 2.2,
        top: 12 + normalizedY * 68 + (index % 2 === 0 ? -2.4 : 2.1),
      };
    });
  }, [mapVisibleServices]);
  const selectedMapService = useMemo(
    () => mapVisibleServices.find((service) => service.id === selectedMapServiceId) ?? mapVisibleServices[0] ?? null,
    [mapVisibleServices, selectedMapServiceId],
  );
  const selectedMapMarker = useMemo(() => {
    if (selectedMapService) {
      const suggestion = getSuggestionByNeighborhood(selectedMapService.neighborhood);
      return { lat: suggestion.lat, lng: suggestion.lng };
    }

    if (isWithinBounds(activeAddressSuggestion, SANDTON_BOUNDS)) {
      return { lat: activeAddressSuggestion.lat, lng: activeAddressSuggestion.lng };
    }

    return null;
  }, [activeAddressSuggestion, selectedMapService]);
  const sandtonMapUrl = useMemo(
    () => buildOsmEmbedUrl(SANDTON_BOUNDS, selectedMapMarker),
    [selectedMapMarker],
  );
  const sandtonMapExternalUrl = useMemo(
    () => buildOsmOpenUrl(selectedMapMarker),
    [selectedMapMarker],
  );
  const filteredFeedPosts = useMemo(
    () => {
      const query = searchText.toLowerCase();
      return demoFeedPosts
        .filter((post) =>
          `${post.provider} ${post.category} ${post.headline} ${post.caption} ${post.location}`
            .toLowerCase()
            .includes(query),
        )
        .sort((left, right) => {
          const leftService =
            homeServices.find((service) => service.provider === left.provider) ?? homeServices[0];
          const rightService =
            homeServices.find((service) => service.provider === right.provider) ?? homeServices[0];
          const leftDistance = serviceTravelMinutes(leftService.id, activeAddressSuggestion);
          const rightDistance = serviceTravelMinutes(rightService.id, activeAddressSuggestion);
          const leftTrend =
            parseCompactCount(left.stats.likes) +
            parseCompactCount(left.stats.comments) * 4 +
            parseCompactCount(left.stats.reposts) * 6;
          const rightTrend =
            parseCompactCount(right.stats.likes) +
            parseCompactCount(right.stats.comments) * 4 +
            parseCompactCount(right.stats.reposts) * 6;
          const leftFavoriteBoost = favoriteCategories.includes(left.category) ? 4000 : 0;
          const rightFavoriteBoost = favoriteCategories.includes(right.category) ? 4000 : 0;

          if (feedMode === "nearby") return leftDistance - rightDistance;
          if (feedMode === "trending") return rightTrend - leftTrend;

          const leftScore = leftTrend + left.rating * 100 + leftFavoriteBoost - leftDistance * 14;
          const rightScore = rightTrend + right.rating * 100 + rightFavoriteBoost - rightDistance * 14;
          return rightScore - leftScore;
        });
    },
    [activeAddressSuggestion, favoriteCategories, feedMode, searchText],
  );
  const openCommentPost = openCommentsFor
    ? demoFeedPosts.find((post) => post.id === openCommentsFor) ?? null
    : null;
  const showServiceGrid = serviceGridOpen || searchText.trim().length > 0;

  const openServiceGrid = (serviceId?: string) => {
    setServiceGridOpen(true);
    setExpandedServiceId(serviceId ?? filteredServices[0]?.id ?? null);
    if (serviceId) setSelectedMapServiceId(serviceId);
  };

  const applyAddressSuggestion = (suggestion: FinderSuggestion) => {
    setAddress(suggestion.value);
    setAddressSuggestionsOpen(false);
    setAddressFinderStatus(`Showing services closest to ${suggestion.neighborhood}`);
  };

  const updateProfileField = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = () => {
    setProfileEditing(false);
    setProfileSavedStatus("Profile updated and saved to your demo account.");
  };

  const toggleFavoriteCategory = (category: string) => {
    setFavoriteCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const searchActualAddress = async (query = address) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 6) {
      setAddressFinderStatus("Type a fuller South African address to search.");
      return;
    }

    setIsSearchingAddress(true);

    try {
      const params = new URLSearchParams({
        q: trimmedQuery,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: SOUTH_AFRICA_REGION,
        limit: "5",
        dedupe: "1",
      });
      const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Address lookup failed with ${response.status}`);
      }

      const results = (await response.json()) as Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }>;

      const suggestions = results.map((result) => {
        const neighborhood =
          result.address?.suburb ||
          result.address?.city_district ||
          result.address?.town ||
          result.address?.city ||
          result.address?.county ||
          "Johannesburg";
        const label =
          result.address?.road ||
          result.address?.building ||
          result.address?.house_number ||
          neighborhood;

        return {
          id: `real-${result.place_id}`,
          label,
          value: result.display_name,
          neighborhood,
          lat: Number(result.lat),
          lng: Number(result.lon),
        } satisfies FinderSuggestion;
      });

      setAddressSearchResults(suggestions);
      setAddressSuggestionsOpen(true);

      if (suggestions.length > 0) {
        applyAddressSuggestion(suggestions[0]);
        setAddressSearchResults(suggestions);
        setAddressFinderStatus(`Resolved real address near ${suggestions[0].neighborhood}`);
      } else {
        setAddressFinderStatus("No South African address match found yet.");
      }
    } catch {
      setAddressFinderStatus("Real address lookup is unavailable right now. Try again shortly.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const findCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setAddressFinderStatus("Current location isn't supported here yet.");
      return;
    }

    setIsLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const params = new URLSearchParams({
            lat: `${current.lat}`,
            lon: `${current.lng}`,
            format: "jsonv2",
            zoom: "18",
            addressdetails: "1",
          });
          const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Reverse geocoding failed with ${response.status}`);
          }

          const result = (await response.json()) as {
            place_id?: number;
            display_name?: string;
            lat?: string;
            lon?: string;
            address?: Record<string, string>;
          };

          const neighborhood =
            result.address?.suburb ||
            result.address?.city_district ||
            result.address?.town ||
            result.address?.city ||
            result.address?.county ||
            "Current area";

          const resolvedSuggestion: FinderSuggestion = {
            id: `current-${result.place_id ?? Date.now()}`,
            label: "Current location",
            value: result.display_name ?? `${current.lat.toFixed(5)}, ${current.lng.toFixed(5)}`,
            neighborhood,
            lat: Number(result.lat ?? current.lat),
            lng: Number(result.lon ?? current.lng),
          };

          setAddressSearchResults([resolvedSuggestion]);
          applyAddressSuggestion(resolvedSuggestion);
          setAddressFinderStatus(`Using current location near ${resolvedSuggestion.neighborhood}`);
        } catch {
          const nearest = finderSuggestions.reduce((closest, suggestion) => {
            const closestDistance = distanceBetween(closest, current);
            const suggestionDistance = distanceBetween(suggestion, current);
            return suggestionDistance < closestDistance ? suggestion : closest;
          }, finderSuggestions[0]);

          applyAddressSuggestion(nearest);
          setAddressFinderStatus(`Using closest known area near ${nearest.neighborhood}`);
        } finally {
          setIsLocatingAddress(false);
        }
      },
      () => {
        setAddressFinderStatus("Couldn't access your location. Choose a nearby area below.");
        setIsLocatingAddress(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      },
    );
  };

  const sendBookingMessage = (inputText?: string) => {
    const text = (inputText ?? bookingComposer).trim();
    if (!text) return;

    const bookingId = selectedBooking.id;
    const providerShortName = selectedBooking.provider.split(" ")[0];
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setBookingMessages((current) => ({
      ...current,
      [bookingId]: [
        ...(current[bookingId] ?? selectedBooking.thread),
        {
          id: `${bookingId}-${Date.now()}`,
          sender: "You",
          text,
          time: timeLabel,
          own: true,
        },
      ],
    }));

    setBookingComposer("");

    const reply =
      text.toLowerCase().includes("quote")
        ? "Got it. I'll send the updated quote in this thread shortly."
        : text.toLowerCase().includes("arrival") || text.toLowerCase().includes("ring")
          ? "Noted. I'll message again just before I arrive."
          : text.toLowerCase().includes("issue")
            ? "Thanks, I have added that to the job notes."
            : "Received. I'll keep you updated here as the booking progresses.";

    window.setTimeout(() => {
      setBookingMessages((current) => ({
        ...current,
        [bookingId]: [
          ...(current[bookingId] ?? []),
          {
            id: `${bookingId}-${Date.now()}-reply`,
            sender: providerShortName,
            text: reply,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ],
      }));
    }, 650);
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((current) => {
      const nextValue = !current[postId];
      setFeedStats((currentStats) => ({
        ...currentStats,
        [postId]: {
          ...currentStats[postId],
          likes: currentStats[postId].likes + (nextValue ? 1 : -1),
        },
      }));
      return { ...current, [postId]: nextValue };
    });
  };

  const toggleRepost = (postId: string) => {
    setRepostedPosts((current) => {
      const nextValue = !current[postId];
      setFeedStats((currentStats) => ({
        ...currentStats,
        [postId]: {
          ...currentStats[postId],
          reposts: currentStats[postId].reposts + (nextValue ? 1 : -1),
        },
      }));
      return { ...current, [postId]: nextValue };
    });
  };

  const submitComment = (postId: string) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    setFeedComments((current) => ({
      ...current,
      [postId]: [
        {
          id: `${postId}-${Date.now()}`,
          author: "You",
          handle: "@you",
          text: draft,
        },
        ...(current[postId] ?? []),
      ],
    }));
    setFeedStats((current) => ({
      ...current,
      [postId]: {
        ...current[postId],
        comments: current[postId].comments + 1,
      },
    }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />

      <div
        className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <div
          className={`min-h-screen ${activeTab === "explore" ? "pb-0" : ""}`}
          style={{
            paddingBottom:
              activeTab === "explore"
                ? "calc(5.8rem + env(safe-area-inset-bottom, 0px))"
                : "calc(6.6rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>

          {activeTab === "home" ? (
            <div className="animate-fade-in">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Homepage
                  </p>
                  <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em]">
                    Good morning, Ano
                  </h1>
                </div>
                <Avatar name="Ano" size="md" />
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <Input
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setAddressSearchResults([]);
                    setAddressSuggestionsOpen(true);
                  }}
                  onFocus={() => setAddressSuggestionsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setAddressSuggestionsOpen(false), 120);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void searchActualAddress();
                    }
                  }}
                  placeholder="Enter address"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  className="h-12 rounded-full border-white/8 bg-white text-slate-950 placeholder:text-slate-400"
                />
                {addressSuggestionsOpen ? (
                  <div className="mt-3 space-y-2 rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Suggested addresses
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => void searchActualAddress()}
                          className="rounded-full bg-cyan-400/14 px-3 py-1.5 text-[11px] font-medium text-cyan-100"
                        >
                          {isSearchingAddress ? "Searching..." : "Search real address"}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={findCurrentLocation}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80"
                        >
                          {isLocatingAddress ? "Finding..." : "Use current location"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {addressSuggestions.length > 0 ? (
                        addressSuggestions.slice(0, 5).map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyAddressSuggestion(suggestion)}
                            className="flex w-full items-center justify-between rounded-[16px] bg-white/6 px-3 py-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">{suggestion.label}</p>
                              <p className="mt-1 text-xs text-white/48">{suggestion.value}</p>
                            </div>
                            <span className="text-[11px] uppercase tracking-[0.12em] text-cyan-200">
                              {suggestion.neighborhood}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[16px] bg-white/6 px-3 py-3 text-sm text-white/70">
                          <p className="font-medium text-white">No exact match yet</p>
                          <p className="mt-1 text-xs text-white/48">
                            Search a full South African address or use one of the Sandton shortcuts below.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Home", value: "Sandton City, 83 Rivonia Road, Sandhurst, Sandton" },
                    { label: "Office", value: "The Marc, 129 Rivonia Road, Sandown, Sandton" },
                    { label: "Mom's house", value: "3 Benmore Road, Benmore Gardens, Sandton" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        applyAddressSuggestion(
                          finderSuggestions.find((suggestion) => suggestion.value === item.value) ??
                            finderSuggestions[0],
                        )
                      }
                      className="min-h-11 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/72"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/50">
                  Auto-matched area: {activeAddressSuggestion.neighborhood}
                </p>
                {addressFinderStatus ? (
                  <p role="status" className="mt-1 text-xs text-cyan-200">
                    {addressFinderStatus}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_52%,#ff9d7d_100%)] p-5 text-slate-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                  Recommended right now
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  Book a verified pro in under 2 minutes
                </h2>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  {homeHighlights.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
                <Button
                  className="mt-4 min-h-11 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-900"
                  onClick={() => setActiveTab("explore")}
                >
                  Browse live feed
                </Button>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Find something fast</p>
                    <p className="text-xs text-white/45">
                      Search services available near your address
                    </p>
                  </div>
                  <Search className="h-4 w-4 text-cyan-200" />
                </div>
                <div className="mt-3">
                  <Input
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(event.target.value);
                      if (event.target.value.trim()) {
                        setServiceGridOpen(true);
                      }
                    }}
                    placeholder="Search cleaning, plumbing, electrical..."
                    leftIcon={<Search className="h-4 w-4" />}
                    className="h-12 rounded-full border-white/8 bg-black/20 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                  <span>Closest services are sorted around {activeAddressSuggestion.neighborhood}</span>
                  {showServiceGrid ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchText("");
                        setServiceGridOpen(false);
                        setExpandedServiceId(null);
                      }}
                      className="text-cyan-200"
                    >
                      Clear grid
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Service map</p>
                    <p className="text-xs text-white/45">
                      Expandable Sandton widget with live service pins
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMapFilterOpen((current) => !current)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/76"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapExpanded(true)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/12 px-3 py-2 text-xs text-cyan-100"
                    >
                      Expand
                    </button>
                  </div>
                </div>
                {mapFilterOpen ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mapCategoryOptions.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setMapCategoryFilter(category)}
                        className={`min-h-10 rounded-full px-3 py-2 text-xs ${
                          mapCategoryFilter === category
                            ? "bg-white text-slate-950"
                            : "border border-white/10 bg-black/20 text-white/72"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#091220]">
                  <div className="relative h-[250px]">
                    <iframe
                      title="Sandton service map"
                      src={sandtonMapUrl}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.24),rgba(7,17,31,0.55))] pointer-events-none" />

                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/78">
                      Sandton live coverage
                    </div>
                    <div className="absolute bottom-4 left-4 rounded-full border border-cyan-300/18 bg-cyan-400/12 px-3 py-2 text-xs text-cyan-100">
                      {isWithinBounds(activeAddressSuggestion, SANDTON_BOUNDS)
                        ? "Your address is inside the current map"
                        : `Current address: ${activeAddressSuggestion.neighborhood}`}
                    </div>

                    {mapPins.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedMapServiceId(service.id)}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${service.left}%`, top: `${service.top}%` }}
                      >
                        <span
                          className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-white shadow-[0_12px_24px_rgba(5,11,20,0.45)] ${
                            selectedMapService?.id === service.id
                              ? "border-cyan-200 bg-cyan-400 text-slate-950"
                              : "border-white/14 bg-black/45"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                        </span>
                      </button>
                    ))}

                    {mapPins.length === 0 ? (
                      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[20px] border border-dashed border-white/10 bg-black/35 p-4 text-center">
                        <p className="text-sm font-semibold">No pins for this filter yet</p>
                        <p className="mt-1 text-xs text-white/52">
                          Try another category or clear your search to repopulate the map.
                        </p>
                      </div>
                    ) : null}

                    {selectedMapService ? (
                      <div className="absolute inset-x-4 bottom-4 rounded-[20px] border border-white/10 bg-[#08111f]/92 p-4 backdrop-blur-md">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{selectedMapService.title}</p>
                            <p className="mt-1 text-xs text-white/52">
                              {selectedMapService.provider} | {selectedMapService.neighborhood}
                            </p>
                          </div>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/72">
                            {selectedMapService.dynamicEta}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-white/48">{selectedMapService.price}</p>
                          <div className="flex items-center gap-3">
                            <a
                              href={sandtonMapExternalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-white/58"
                            >
                              Open OSM
                            </a>
                            <button
                              type="button"
                              onClick={() => openServiceGrid(selectedMapService.id)}
                              className="text-xs font-semibold text-cyan-200"
                            >
                              Open service
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/48">
                  <span>
                    {isWithinBounds(activeAddressSuggestion, SANDTON_BOUNDS)
                      ? "Distances and pins are anchored to your real resolved location."
                      : "Real address lookup works nationwide; the live map widget is centered on Sandton for this demo."}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                    Recommended services
                  </h3>
                  <button
                    type="button"
                    onClick={() => openServiceGrid(filteredServices[0]?.id)}
                    className="text-sm text-cyan-200"
                  >
                    See all
                  </button>
                </div>
                {showServiceGrid ? (
                  filteredServices.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredServices.slice(0, 12).map((service, index) => {
                      const Icon = serviceIcons[index % serviceIcons.length];
                      const expanded = expandedServiceId === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() =>
                            setExpandedServiceId((current) =>
                              current === service.id ? null : service.id,
                            )
                          }
                          className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${service.accent} p-4 text-left text-white ${
                            expanded ? "col-span-2 min-h-[260px]" : "min-h-[212px]"
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-30"
                            style={{ backgroundImage: `url(${service.imageUrl})` }}
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,15,28,0.96),rgba(8,15,28,0.18))]" />
                          <div className="relative">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-medium">
                                {service.badge}
                              </span>
                              <Icon className="h-5 w-5 text-white/86" />
                            </div>
                            <h4 className="mt-8 text-lg font-semibold">{service.title}</h4>
                            <p className="mt-1 text-sm text-white/72">{service.subtitle}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/75">
                              <span className="rounded-full bg-black/24 px-2.5 py-1">
                                {service.dynamicEta}
                              </span>
                              <span className="rounded-full bg-black/24 px-2.5 py-1">
                                {service.neighborhood}
                              </span>
                            </div>
                            {expanded ? (
                              <div className="mt-4 space-y-3">
                                <p className="text-sm leading-6 text-white/80">
                                  {service.description}
                                </p>
                                <div className="flex flex-wrap gap-2 text-[11px] text-white/78">
                                  {service.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-white/12 px-2.5 py-1"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">{service.provider}</p>
                                    <p className="mt-1 text-xs text-white/55">
                                      {service.price} - {service.duration}
                                    </p>
                                  </div>
                                  <Button
                                    className="min-h-10 rounded-full bg-white px-4 text-slate-950 hover:bg-white/92"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setActiveTab("bookings");
                                    }}
                                  >
                                    Book now
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-white/12 bg-white/6 p-5 text-center">
                      <p className="text-sm font-semibold">No services found</p>
                      <p className="mt-2 text-sm text-white/50">
                        Try a different search or switch your address to a nearby area.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    {filteredServices.slice(0, 6).map((service, index) => {
                    const Icon = serviceIcons[index % serviceIcons.length];
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => openServiceGrid(service.id)}
                        className={`relative min-w-[260px] overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br ${service.accent} p-4 text-left text-white`}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-35"
                          style={{ backgroundImage: `url(${service.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,15,28,0.94),rgba(8,15,28,0.18))]" />
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-medium">
                              {service.badge}
                            </span>
                            <Icon className="h-5 w-5 text-white/86" />
                          </div>
                          <h4 className="mt-10 text-xl font-semibold">{service.title}</h4>
                          <p className="mt-1 text-sm text-white/72">{service.subtitle}</p>
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/24 px-3 py-2 text-sm">
                            <Clock3 className="h-4 w-4" />
                            {service.dynamicEta}
                          </div>
                          <p className="mt-3 text-xs text-white/55">{service.neighborhood}</p>
                        </div>
                      </button>
                    );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                    Last services booked
                  </h3>
                  <span className="text-xs text-white/45">Rebook fast</span>
                </div>
                {orderHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-white/55">{item.provider}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/72">
                        {item.price}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                      <span>{item.date}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("bookings")}
                        className="text-cyan-200"
                      >
                        Rebook
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                    Current bookings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bookings")}
                    className="text-sm text-cyan-200"
                  >
                    Open
                  </button>
                </div>
                {bookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => {
                      setSelectedBookingId(booking.id);
                      setActiveTab("bookings");
                    }}
                    className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-white/8 p-4 text-left backdrop-blur-md"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
                      style={{ backgroundImage: `url(${booking.imageUrl})` }}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.service}</p>
                        <p className="mt-1 text-sm text-white/55">{booking.provider}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {booking.status}
                      </span>
                    </div>
                    <div className="relative mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#8ef7d6_0%,#7dd3fc_100%)]"
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>
                    <div className="relative mt-3 flex items-center justify-between text-xs text-white/50">
                      <span>{booking.scheduledFor}</span>
                      <span>{booking.eta}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "explore" ? (
            <div className="animate-fade-in mt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Explore
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                    Live service feed
                  </h2>
                </div>
                <div className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/70">
                  Scroll the feed
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "for-you" as const, label: "For you" },
                  { id: "nearby" as const, label: "Nearby" },
                  { id: "trending" as const, label: "Trending" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFeedMode(mode.id)}
                    className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm ${
                      feedMode === mode.id
                        ? "bg-white text-slate-950"
                        : "border border-white/10 bg-white/8 text-white/70"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
                <div className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">
                  {activeAddressSuggestion.neighborhood}
                </div>
              </div>

              <div className="mb-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search posts, providers, categories..."
                  leftIcon={<Search className="h-4 w-4" />}
                  className="h-12 rounded-full border-white/8 bg-black/20 text-white placeholder:text-white/35"
                />
              </div>

              <div className="h-[calc(100vh-15rem)] snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth">
                {filteredFeedPosts.length > 0 ? (
                  <div className="space-y-4 pb-10">
                    {filteredFeedPosts.map((post, postIndex) => {
                    const stats = feedStats[post.id];
                    const comments = feedComments[post.id] ?? [];

                    return (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: postIndex * 0.03 }}
                        className="relative min-h-[calc(100vh-15rem)] snap-start overflow-hidden rounded-[30px] border border-white/10 bg-black/20"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${post.accent}`} />
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-28 mix-blend-screen"
                          style={{ backgroundImage: `url(${post.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,11,20,0.98),rgba(5,11,20,0.18)_56%,rgba(5,11,20,0.04))]" />

                        <div className="relative flex h-full flex-col justify-between p-5">
                          <div>
                            <div className="mb-4 flex gap-1">
                              {filteredFeedPosts.map((feedPost, index) => (
                                <div
                                  key={feedPost.id}
                                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                                >
                                  <div
                                    className="h-full rounded-full bg-white"
                                    style={{
                                      width:
                                        filteredFeedPosts.findIndex((item) => item.id === post.id) >=
                                        index
                                          ? "100%"
                                          : "0%",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-3">
                              <Avatar src={post.avatarUrl} name={post.provider} size="lg" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold">{post.provider}</p>
                                  <BadgeCheck className="h-4 w-4 text-cyan-200" />
                                </div>
                                <p className="text-xs text-white/62">
                                  {post.category} | {post.location}
                                </p>
                              </div>
                              <div className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/72">
                                {feedMode === "for-you"
                                  ? "For you"
                                  : feedMode === "nearby"
                                    ? "Nearby"
                                    : "Trending"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-end gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex flex-wrap gap-2">
                                {post.moments.map((moment) => (
                                  <span
                                    key={moment}
                                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/88"
                                  >
                                    {moment}
                                  </span>
                                ))}
                              </div>
                              <h3 className="max-w-[16rem] text-3xl font-semibold leading-tight tracking-[-0.04em]">
                                {post.headline}
                              </h3>
                              <p className="mt-3 max-w-[17rem] text-sm leading-6 text-white/82">
                                {post.caption}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100/80">
                                {post.hashtags.map((tag) => (
                                  <span key={tag}>{tag}</span>
                                ))}
                              </div>
                              <div className="mt-4 flex items-center gap-3 text-xs text-white/66">
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                                  {post.rating.toFixed(1)}
                                </span>
                                <span>{post.reviews} reviews</span>
                                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/72">
                                  {serviceTravelMinutes(
                                    homeServices.find((service) => service.provider === post.provider)?.id ?? "service-1",
                                    activeAddressSuggestion,
                                  )}{" "}
                                  min away
                                </span>
                              </div>
                              {comments.length > 0 ? (
                                <div className="mt-4 rounded-[20px] border border-white/8 bg-white/8 p-3 text-sm text-white/78">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                                      Community
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setOpenCommentsFor(post.id)}
                                      className="text-xs font-semibold text-cyan-200"
                                    >
                                      Open thread
                                    </button>
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    {comments.slice(0, 2).map((comment) => (
                                      <div key={comment.id}>
                                        <div className="flex items-center gap-2 text-xs text-white/52">
                                          <span className="font-semibold text-white/86">
                                            {comment.author}
                                          </span>
                                          <span>{comment.handle}</span>
                                        </div>
                                        <p className="mt-1 leading-5">{comment.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              <Button
                                className="mt-4 min-h-11 rounded-full bg-white px-5 text-slate-950 hover:bg-white/92"
                                onClick={() => setActiveTab("bookings")}
                              >
                                Book now
                              </Button>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleLike(post.id)}
                                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                                  likedPosts[post.id]
                                    ? "bg-rose-500 text-white"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                <Heart
                                  className={`h-5 w-5 ${likedPosts[post.id] ? "fill-current" : ""}`}
                                />
                              </button>
                              <span className="text-xs text-white/70">
                                {compactCount(stats.likes)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenCommentsFor(post.id)}
                                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white"
                              >
                                <MessageCircle className="h-5 w-5" />
                              </button>
                              <span className="text-xs text-white/70">
                                {compactCount(stats.comments)}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRepost(post.id)}
                                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                                  repostedPosts[post.id]
                                    ? "bg-emerald-400 text-slate-950"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                <Repeat2 className="h-5 w-5" />
                              </button>
                              <span className="text-xs text-white/70">
                                {compactCount(stats.reposts)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="w-full rounded-[28px] border border-dashed border-white/10 bg-white/8 p-6 text-center">
                      <p className="text-lg font-semibold">No posts match that search yet</p>
                      <p className="mt-2 text-sm text-white/52">
                        Try another keyword or switch to a different feed mode.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "bookings" ? (
            <div className="animate-fade-in">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Bookings
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">Your jobs</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/70"
                >
                  3 active
                </button>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {bookings.map((booking) => {
                  const active = selectedBooking.id === booking.id;
                  return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setSelectedBookingId(booking.id)}
                    aria-pressed={active}
                    className={`group relative min-w-[252px] overflow-hidden rounded-[26px] border p-4 text-left transition-all ${
                      active
                        ? "border-cyan-300/55 bg-white/14 shadow-[0_0_0_1px_rgba(103,232,249,0.22)]"
                        : "border-white/10 bg-white/8 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
                      style={{ backgroundImage: `url(${booking.imageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(7,17,31,0.92),rgba(7,17,31,0.52))]" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={booking.avatarUrl} name={booking.provider} size="sm" />
                          <div>
                            <p className="font-medium leading-5">{booking.service}</p>
                            <p className="mt-1 text-xs text-white/55">{booking.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/72">
                            {booking.status}
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 text-white/45 transition-transform ${
                              active ? "translate-x-0.5" : ""
                            }`}
                          />
                        </div>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${booking.accent}`}
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-white/55">
                        <span>{booking.scheduledFor}</span>
                        <span>{booking.price}</span>
                      </div>
                    </div>
                  </button>
                )})}
              </div>

              <div className="mt-4 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] p-5 text-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Selected booking
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{selectedBooking.service}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedBooking.provider} | {selectedBooking.providerRole}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 rounded-[22px] bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between text-sm">
                    <span>ETA</span>
                    <span className="font-semibold">{selectedBooking.eta}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Scheduled</span>
                    <span className="font-semibold">{selectedBooking.scheduledFor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Address</span>
                    <span className="max-w-[11rem] text-right font-semibold">
                      {selectedBooking.address}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedBooking.checklist.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          item.complete ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <p className="text-sm font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Booking chat</p>
                    <p className="text-xs text-white/45">
                      Integrated messaging in the same job flow
                    </p>
                  </div>
                  <MessageCircle className="h-4 w-4 text-cyan-200" />
                </div>

                <div className="space-y-3">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.own ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[20px] px-4 py-3 ${
                          message.own ? "bg-cyan-400 text-slate-950" : "bg-black/20 text-white"
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                          {message.sender}
                        </p>
                        <p className="mt-1 text-sm leading-6">{message.text}</p>
                        <p className="mt-2 text-[11px] opacity-60">{message.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    "Please ring on arrival",
                    "Share updated quote",
                    "I added another issue",
                  ].map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => sendBookingMessage(text)}
                      className="min-h-11 shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Input
                    value={bookingComposer}
                    onChange={(event) => setBookingComposer(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        sendBookingMessage();
                      }
                    }}
                    placeholder="Type a message to the provider..."
                    className="h-12 rounded-[20px] border-white/10 bg-white/8 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="button"
                    onClick={() => sendBookingMessage()}
                    className="min-h-12 rounded-[20px] bg-white px-4 text-slate-950 hover:bg-white/92"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="animate-fade-in">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Settings & profile
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                    Your account
                  </h2>
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,#132646_0%,#2457a5_100%)] p-5">
                <div className="flex items-start gap-4">
                  <Avatar
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80"
                    name={profileForm.fullName}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-xl font-semibold">{profileForm.fullName}</h3>
                      <BadgeCheck className="h-4 w-4 text-cyan-200" />
                    </div>
                    <p className="mt-1 text-sm text-white/70">{profileForm.email}</p>
                    <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/68">
                      {profileForm.tagline}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {profileStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="rounded-[18px] bg-white/10 px-3 py-3 text-center"
                        >
                          <p className="text-lg font-semibold">{stat.value}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/58">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-white/12">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#8ef7d6_0%,#7dd3fc_100%)]"
                          style={{ width: `${profileCompletion}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-cyan-100">
                        {profileCompletion}% ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <PencilLine className="h-4 w-4 text-cyan-200" />
                    <p className="text-sm font-semibold">Profile details</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (profileEditing) {
                        setProfileEditing(false);
                        setProfileSavedStatus("Changes discarded.");
                      } else {
                        setProfileEditing(true);
                      }
                    }}
                    className="text-xs font-semibold text-cyan-200"
                  >
                    {profileEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
                {profileEditing ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                        Full name
                      </p>
                      <Input
                        value={profileForm.fullName}
                        onChange={(event) => updateProfileField("fullName", event.target.value)}
                        aria-label="Full name"
                        autoComplete="name"
                        className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                        Email
                      </p>
                      <Input
                        value={profileForm.email}
                        onChange={(event) => updateProfileField("email", event.target.value)}
                        type="email"
                        aria-label="Email"
                        autoComplete="email"
                        className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                        Phone
                      </p>
                      <Input
                        value={profileForm.phone}
                        onChange={(event) => updateProfileField("phone", event.target.value)}
                        type="tel"
                        aria-label="Phone"
                        autoComplete="tel"
                        className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                        Tagline
                      </p>
                      <Input
                        value={profileForm.tagline}
                        onChange={(event) => updateProfileField("tagline", event.target.value)}
                        aria-label="Tagline"
                        className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                      />
                    </div>
                    <Button
                      className="min-h-12 w-full rounded-full bg-white text-slate-950 hover:bg-white/92"
                      onClick={saveProfile}
                    >
                      <Check className="h-4 w-4" />
                      Save profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-[18px] bg-black/20 px-4 py-3">
                      <UserRound className="h-4 w-4 text-cyan-200" />
                      <div>
                        <p className="text-sm font-medium">Full name</p>
                        <p className="mt-1 text-xs text-white/52">{profileForm.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-[18px] bg-black/20 px-4 py-3">
                      <Mail className="h-4 w-4 text-cyan-200" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="mt-1 text-xs text-white/52">{profileForm.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-[18px] bg-black/20 px-4 py-3">
                      <Phone className="h-4 w-4 text-cyan-200" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="mt-1 text-xs text-white/52">{profileForm.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
                {profileSavedStatus ? (
                  <p role="status" className="mt-3 text-xs text-cyan-200">
                    {profileSavedStatus}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold">Saved addresses</p>
                </div>
                <div className="space-y-3">
                  {demoAddressBook.map((addressItem) => {
                    const active = address === addressItem.value;
                    return (
                      <button
                        key={addressItem.id}
                        type="button"
                        onClick={() =>
                          applyAddressSuggestion(
                            finderSuggestions.find(
                              (suggestion) => suggestion.value === addressItem.value,
                            ) ?? inferSuggestionFromAddress(addressItem.value),
                          )
                        }
                        className={`w-full rounded-[18px] px-4 py-3 text-left transition-colors ${
                          active
                            ? "border border-cyan-300/45 bg-cyan-400/10"
                            : "bg-black/20 hover:bg-black/28"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{addressItem.label}</p>
                            <p className="mt-1 text-xs text-white/52">{addressItem.value}</p>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/38">
                              {addressItem.note}
                            </p>
                          </div>
                          {active ? (
                            <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                              Active
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold">Personalize matching</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                      Favorite categories
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {serviceCategoryOptions.map((category) => {
                        const active = favoriteCategories.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => toggleFavoriteCategory(category)}
                            className={`min-h-11 rounded-full px-3 py-2 text-sm transition-colors ${
                              active
                                ? "bg-white text-slate-950"
                                : "border border-white/10 bg-black/20 text-white/76"
                            }`}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                      Preferred arrival window
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {["Early", "After work", "Weekend"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPreferredWindow(option)}
                          className={`min-h-11 rounded-[16px] px-3 py-2 text-sm ${
                            preferredWindow === option
                              ? "bg-cyan-300 text-slate-950"
                              : "bg-black/20 text-white/72"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                      Updates and alerts
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Push only", "Push + SMS", "Email digest"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setNotificationMode(option)}
                          className={`min-h-11 rounded-full px-3 py-2 text-sm ${
                            notificationMode === option
                              ? "bg-emerald-300 text-slate-950"
                              : "border border-white/10 bg-black/20 text-white/76"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold">Payment methods</p>
                </div>
                <div className="space-y-3">
                  {demoPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {method.brand} ending in {method.last4}
                        </p>
                        <p className="mt-1 text-xs text-white/52">
                          {method.holder} | expires {method.expiry}
                        </p>
                      </div>
                      {method.default ? (
                        <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                          Default
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-[0.12em] text-white/38">
                          Saved
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold">Account shortcuts</p>
                </div>
                <div className="space-y-3">
                  {profileSettings.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-[18px] bg-black/20 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-xs text-white/52">{item.value}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/35" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  className="min-h-12 flex-1 rounded-full bg-white text-slate-950 hover:bg-white/92"
                  onClick={() => {
                    setProfileEditing(true);
                    setProfileSavedStatus("Edit mode enabled.");
                  }}
                >
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  className="min-h-12 flex-1 rounded-full border-white/12 bg-white/8 text-white hover:bg-white/12"
                  onClick={() => setActiveTab("home")}
                >
                  Back home
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#07101d]/95 px-3 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto grid max-w-[480px] grid-cols-4 gap-1">
          {[
            { id: "home" as const, label: "Home", icon: Home },
            { id: "explore" as const, label: "Explore", icon: Sparkles },
            { id: "bookings" as const, label: "Bookings", icon: MessageCircle },
            { id: "profile" as const, label: "Profile", icon: UserRound },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-pressed={active}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-xs ${
                  active ? "bg-white text-slate-950" : "text-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {mapExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setMapExpanded(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Expanded Sandton service map"
              className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-[#07111f] px-4"
              style={{
                paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
                paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/46">
                    Expanded map
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">Sandton service coverage</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMapExpanded(false)}
                  className="rounded-full bg-white/10 p-3 text-white/78"
                >
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </button>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#091220]">
                <div className="relative h-[58vh]">
                  <iframe
                    title="Expanded Sandton service map"
                    src={sandtonMapUrl}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.12),rgba(7,17,31,0.42))] pointer-events-none" />
                  {mapPins.map((service) => (
                    <button
                      key={`expanded-${service.id}`}
                      type="button"
                      onClick={() => setSelectedMapServiceId(service.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${service.left}%`, top: `${service.top}%` }}
                    >
                      <span
                        className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-white shadow-[0_14px_28px_rgba(5,11,20,0.5)] ${
                          selectedMapService?.id === service.id
                            ? "border-cyan-200 bg-cyan-400 text-slate-950"
                            : "border-white/18 bg-black/52"
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/52">
                <span>
                  Real address resolution is live. The demo map stays centered on Sandton for investor walkthroughs.
                </span>
                <a
                  href={sandtonMapExternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-white/80"
                >
                  Open in OSM
                </a>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto pb-2">
                {mapVisibleServices.slice(0, 8).map((service) => {
                  const active = selectedMapService?.id === service.id;
                  return (
                    <button
                      key={`expanded-card-${service.id}`}
                      type="button"
                      onClick={() => setSelectedMapServiceId(service.id)}
                      className={`flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left ${
                        active ? "border border-cyan-300/45 bg-cyan-400/10" : "bg-white/8"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{service.title}</p>
                        <p className="mt-1 text-xs text-white/52">
                          {service.provider} | {service.neighborhood}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{service.dynamicEta}</p>
                        <p className="mt-1 text-xs text-white/52">{service.price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openCommentPost ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            onClick={() => setOpenCommentsFor(null)}
          >
            <motion.div
              initial={{ y: 32 }}
              animate={{ y: 0 }}
              exit={{ y: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Comments for ${openCommentPost.provider}`}
              className="mx-auto w-full max-w-[430px] rounded-t-[28px] border border-white/10 bg-[#0b1423] p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/18" />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Comments
                  </p>
                  <h3 className="text-lg font-semibold">{openCommentPost.provider}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenCommentsFor(null)}
                  className="rounded-full bg-white/10 p-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </button>
              </div>

              <div className="space-y-3">
                {(feedComments[openCommentPost.id] ?? []).map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-[20px] border border-white/8 bg-white/6 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-white/45">{comment.handle}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/78">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={commentDrafts[openCommentPost.id] ?? ""}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [openCommentPost.id]: event.target.value,
                    }))
                  }
                  placeholder="Add a comment..."
                  className="h-12 rounded-full border-white/8 bg-white/8 text-white placeholder:text-white/35"
                />
                <Button
                  className="min-h-12 rounded-full bg-white px-5 text-slate-950 hover:bg-white/92"
                  onClick={() => submitComment(openCommentPost.id)}
                >
                  Post
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
