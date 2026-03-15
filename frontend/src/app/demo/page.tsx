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
import { customerApi } from "@/lib/api";
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
import { useAuthStore } from "@/store/auth.store";

type AppTab = "home" | "explore" | "bookings" | "profile";
type FeedMode = "for-you" | "nearby" | "trending";
type DemoService = (typeof homeServices)[number];
type FeedPost = (typeof demoFeedPosts)[number];
type FeedComment = FeedPost["comments"][number];
type AddressBookItem = (typeof demoAddressBook)[number];
type AddressEditorMode = "create" | "edit";
type FinderSuggestion = {
  id: string;
  label: string;
  value: string;
  neighborhood: string;
  lat: number;
  lng: number;
};
type AddressFormState = {
  label: string;
  value: string;
  note: string;
};
type BookingFieldOption = {
  label: string;
  value: string;
  priceDelta?: number;
};
type BookingFieldDefinition = {
  id: string;
  label: string;
  kind: "single" | "multi" | "toggle";
  helper?: string;
  options?: BookingFieldOption[];
  toggleLabel?: string;
  priceDelta?: number;
};
type BookingDraftValues = Record<string, string | string[] | boolean>;
type BookingFlowState = {
  serviceId: string;
  step: number;
  values: BookingDraftValues;
  scheduledDate: string;
  arrivalWindow: string;
  addressValue: string;
  paymentMethodId: string;
  notes: string;
  contactPreference: string;
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

function createFinderSuggestionFromSavedAddress(addressItem: AddressBookItem) {
  if (
    typeof addressItem.lat !== "number" ||
    typeof addressItem.lng !== "number" ||
    !addressItem.neighborhood
  ) {
    return null;
  }

  return {
    id: `saved-${addressItem.id}`,
    label: addressItem.label,
    value: addressItem.value,
    neighborhood: addressItem.neighborhood,
    lat: addressItem.lat,
    lng: addressItem.lng,
  } satisfies FinderSuggestion;
}

function findSuggestionForAddress(address: string, addressBook: AddressBookItem[] = demoAddressBook) {
  const normalized = address.trim().toLowerCase();
  if (!normalized) return null;

  const directMatch = finderSuggestions.find(
    (suggestion) =>
      suggestion.value.toLowerCase() === normalized ||
      suggestion.neighborhood.toLowerCase() === normalized ||
      normalized.includes(suggestion.neighborhood.toLowerCase()) ||
      normalized.includes(suggestion.label.toLowerCase()),
  );

  if (directMatch) return directMatch;

  const savedAddressMatch = addressBook.find((saved) =>
    normalized.includes(saved.value.toLowerCase()) || normalized.includes(saved.label.toLowerCase()),
  );

  if (savedAddressMatch) {
    const savedSuggestion = createFinderSuggestionFromSavedAddress(savedAddressMatch);
    if (savedSuggestion) return savedSuggestion;

    return (
      finderSuggestions.find((suggestion) =>
        suggestion.value.toLowerCase().includes(savedAddressMatch.value.toLowerCase()),
      ) ?? null
    );
  }

  return null;
}

function inferSuggestionFromAddress(address: string, addressBook: AddressBookItem[] = demoAddressBook) {
  return findSuggestionForAddress(address, addressBook) ?? finderSuggestions[0];
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

const bookingFieldConfigByCategory: Record<string, BookingFieldDefinition[]> = {
  Plumbing: [
    {
      id: "issue",
      label: "What needs attention?",
      kind: "single",
      options: [
        { label: "Leak or burst pipe", value: "Leak or burst pipe", priceDelta: 0 },
        { label: "Blocked drain", value: "Blocked drain", priceDelta: 60 },
        { label: "Geyser problem", value: "Geyser problem", priceDelta: 120 },
        { label: "Pressure / fittings check", value: "Pressure / fittings check", priceDelta: 40 },
      ],
    },
    {
      id: "urgency",
      label: "Urgency",
      kind: "single",
      options: [
        { label: "ASAP", value: "ASAP", priceDelta: 90 },
        { label: "Today", value: "Today", priceDelta: 35 },
        { label: "Flexible", value: "Flexible", priceDelta: 0 },
      ],
    },
    {
      id: "property",
      label: "Property type",
      kind: "single",
      options: [
        { label: "Apartment", value: "Apartment" },
        { label: "House", value: "House", priceDelta: 30 },
        { label: "Office", value: "Office", priceDelta: 55 },
      ],
    },
    {
      id: "materialsReady",
      label: "Replacement parts",
      kind: "toggle",
      toggleLabel: "Bring common replacement parts",
      priceDelta: 75,
    },
  ],
  Cleaning: [
    {
      id: "scope",
      label: "Scope",
      kind: "single",
      options: [
        { label: "Studio / 1 bed", value: "Studio / 1 bed" },
        { label: "2 - 3 bedrooms", value: "2 - 3 bedrooms", priceDelta: 120 },
        { label: "Move-out clean", value: "Move-out clean", priceDelta: 240 },
      ],
    },
    {
      id: "extras",
      label: "Extras",
      kind: "multi",
      options: [
        { label: "Inside oven", value: "Inside oven", priceDelta: 85 },
        { label: "Inside fridge", value: "Inside fridge", priceDelta: 70 },
        { label: "Windows", value: "Windows", priceDelta: 110 },
        { label: "Laundry fold", value: "Laundry fold", priceDelta: 60 },
      ],
    },
    {
      id: "petFriendly",
      label: "Home setup",
      kind: "toggle",
      toggleLabel: "Pets will be home during the clean",
    },
  ],
  Electrical: [
    {
      id: "issue",
      label: "Electrical issue",
      kind: "single",
      options: [
        { label: "Plug / socket fault", value: "Plug / socket fault" },
        { label: "Lights tripping", value: "Lights tripping", priceDelta: 70 },
        { label: "DB board issue", value: "DB board issue", priceDelta: 120 },
        { label: "Appliance diagnostic", value: "Appliance diagnostic", priceDelta: 90 },
      ],
    },
    {
      id: "property",
      label: "Property type",
      kind: "single",
      options: [
        { label: "Apartment", value: "Apartment" },
        { label: "House", value: "House", priceDelta: 30 },
        { label: "Office", value: "Office", priceDelta: 50 },
      ],
    },
    {
      id: "powerOff",
      label: "Safety",
      kind: "toggle",
      toggleLabel: "Whole area is without power",
      priceDelta: 80,
    },
  ],
  Gardening: [
    {
      id: "yardSize",
      label: "Garden size",
      kind: "single",
      options: [
        { label: "Small patio / compact yard", value: "Small patio / compact yard" },
        { label: "Standard garden", value: "Standard garden", priceDelta: 80 },
        { label: "Large yard", value: "Large yard", priceDelta: 170 },
      ],
    },
    {
      id: "tasks",
      label: "Tasks",
      kind: "multi",
      options: [
        { label: "Lawn cut", value: "Lawn cut" },
        { label: "Hedge trim", value: "Hedge trim", priceDelta: 90 },
        { label: "Green waste removal", value: "Green waste removal", priceDelta: 70 },
      ],
    },
  ],
  Hair: [
    {
      id: "style",
      label: "Service",
      kind: "single",
      options: [
        { label: "Silk press", value: "Silk press" },
        { label: "Wash and style", value: "Wash and style", priceDelta: 35 },
        { label: "Braids install", value: "Braids install", priceDelta: 220 },
      ],
    },
    {
      id: "length",
      label: "Hair length",
      kind: "single",
      options: [
        { label: "Short", value: "Short" },
        { label: "Shoulder length", value: "Shoulder length", priceDelta: 35 },
        { label: "Long", value: "Long", priceDelta: 80 },
      ],
    },
    {
      id: "washIncluded",
      label: "Prep",
      kind: "toggle",
      toggleLabel: "Include wash and blow-dry setup",
      priceDelta: 45,
    },
  ],
  "Dog Washing": [
    {
      id: "petSize",
      label: "Dog size",
      kind: "single",
      options: [
        { label: "Small", value: "Small" },
        { label: "Medium", value: "Medium", priceDelta: 30 },
        { label: "Large", value: "Large", priceDelta: 65 },
      ],
    },
    {
      id: "coat",
      label: "Coat type",
      kind: "single",
      options: [
        { label: "Short coat", value: "Short coat" },
        { label: "Long coat", value: "Long coat", priceDelta: 35 },
        { label: "Double coat", value: "Double coat", priceDelta: 55 },
      ],
    },
    {
      id: "extras",
      label: "Extras",
      kind: "multi",
      options: [
        { label: "Nail trim", value: "Nail trim", priceDelta: 30 },
        { label: "Ear clean", value: "Ear clean", priceDelta: 25 },
        { label: "De-shed", value: "De-shed", priceDelta: 55 },
      ],
    },
  ],
  "Pool Cleaning": [
    {
      id: "poolSize",
      label: "Pool size",
      kind: "single",
      options: [
        { label: "Plunge pool", value: "Plunge pool" },
        { label: "Family pool", value: "Family pool", priceDelta: 90 },
        { label: "Large pool", value: "Large pool", priceDelta: 160 },
      ],
    },
    {
      id: "chemicals",
      label: "Add-on",
      kind: "toggle",
      toggleLabel: "Bring balancing chemicals",
      priceDelta: 85,
    },
    {
      id: "frequency",
      label: "Visit type",
      kind: "single",
      options: [
        { label: "One-off cleanup", value: "One-off cleanup" },
        { label: "Weekly maintenance", value: "Weekly maintenance", priceDelta: 40 },
        { label: "Fortnightly maintenance", value: "Fortnightly maintenance", priceDelta: 20 },
      ],
    },
  ],
  "Dog Walking": [
    {
      id: "duration",
      label: "Walk duration",
      kind: "single",
      options: [
        { label: "30 minutes", value: "30 minutes" },
        { label: "45 minutes", value: "45 minutes", priceDelta: 35 },
        { label: "60 minutes", value: "60 minutes", priceDelta: 60 },
      ],
    },
    {
      id: "dogs",
      label: "Number of dogs",
      kind: "single",
      options: [
        { label: "1 dog", value: "1 dog" },
        { label: "2 dogs", value: "2 dogs", priceDelta: 45 },
        { label: "3 dogs", value: "3 dogs", priceDelta: 85 },
      ],
    },
    {
      id: "cadence",
      label: "Cadence",
      kind: "single",
      options: [
        { label: "Once-off", value: "Once-off" },
        { label: "Weekdays", value: "Weekdays", priceDelta: 20 },
        { label: "Custom routine", value: "Custom routine", priceDelta: 30 },
      ],
    },
  ],
  Makeup: [
    {
      id: "look",
      label: "Look",
      kind: "single",
      options: [
        { label: "Soft glam", value: "Soft glam" },
        { label: "Full glam", value: "Full glam", priceDelta: 110 },
        { label: "Bridal", value: "Bridal", priceDelta: 250 },
      ],
    },
    {
      id: "extras",
      label: "Extras",
      kind: "multi",
      options: [
        { label: "Lashes", value: "Lashes", priceDelta: 40 },
        { label: "Touch-up kit", value: "Touch-up kit", priceDelta: 60 },
        { label: "Preview trial", value: "Preview trial", priceDelta: 180 },
      ],
    },
  ],
  Nails: [
    {
      id: "set",
      label: "Nail service",
      kind: "single",
      options: [
        { label: "Gel overlay", value: "Gel overlay" },
        { label: "Gel polish", value: "Gel polish", priceDelta: 20 },
        { label: "Acrylic full set", value: "Acrylic full set", priceDelta: 120 },
      ],
    },
    {
      id: "artLevel",
      label: "Nail art",
      kind: "single",
      options: [
        { label: "None", value: "None" },
        { label: "Minimal art", value: "Minimal art", priceDelta: 35 },
        { label: "Detailed art", value: "Detailed art", priceDelta: 80 },
      ],
    },
  ],
  "Car Wash": [
    {
      id: "package",
      label: "Package",
      kind: "single",
      options: [
        { label: "Exterior wash", value: "Exterior wash" },
        { label: "Interior + exterior", value: "Interior + exterior", priceDelta: 60 },
        { label: "Full detail", value: "Full detail", priceDelta: 140 },
      ],
    },
    {
      id: "vehicle",
      label: "Vehicle size",
      kind: "single",
      options: [
        { label: "Sedan / hatch", value: "Sedan / hatch" },
        { label: "SUV", value: "SUV", priceDelta: 40 },
        { label: "Bakkie / van", value: "Bakkie / van", priceDelta: 55 },
      ],
    },
    {
      id: "wax",
      label: "Protection",
      kind: "toggle",
      toggleLabel: "Add wax / paint protection",
      priceDelta: 70,
    },
  ],
  Massage: [
    {
      id: "style",
      label: "Massage type",
      kind: "single",
      options: [
        { label: "Swedish", value: "Swedish" },
        { label: "Deep tissue", value: "Deep tissue", priceDelta: 60 },
        { label: "Sports recovery", value: "Sports recovery", priceDelta: 80 },
      ],
    },
    {
      id: "duration",
      label: "Session length",
      kind: "single",
      options: [
        { label: "60 minutes", value: "60 minutes" },
        { label: "90 minutes", value: "90 minutes", priceDelta: 140 },
      ],
    },
    {
      id: "table",
      label: "Setup",
      kind: "toggle",
      toggleLabel: "Therapist brings a portable table",
      priceDelta: 45,
    },
  ],
  Appliances: [
    {
      id: "appliance",
      label: "Appliance",
      kind: "single",
      options: [
        { label: "Fridge", value: "Fridge" },
        { label: "Washing machine", value: "Washing machine", priceDelta: 35 },
        { label: "Oven / stove", value: "Oven / stove", priceDelta: 60 },
        { label: "Dishwasher", value: "Dishwasher", priceDelta: 45 },
      ],
    },
    {
      id: "issue",
      label: "What is happening?",
      kind: "single",
      options: [
        { label: "Diagnostic only", value: "Diagnostic only" },
        { label: "Not cooling / heating", value: "Not cooling / heating", priceDelta: 60 },
        { label: "Leaking", value: "Leaking", priceDelta: 45 },
        { label: "Not draining / spinning", value: "Not draining / spinning", priceDelta: 55 },
      ],
    },
  ],
  Moving: [
    {
      id: "propertySize",
      label: "Move size",
      kind: "single",
      options: [
        { label: "Studio / 1 room", value: "Studio / 1 room" },
        { label: "1 - 2 bedrooms", value: "1 - 2 bedrooms", priceDelta: 180 },
        { label: "3+ bedrooms", value: "3+ bedrooms", priceDelta: 380 },
      ],
    },
    {
      id: "crew",
      label: "Crew",
      kind: "single",
      options: [
        { label: "2 movers", value: "2 movers" },
        { label: "3 movers", value: "3 movers", priceDelta: 120 },
        { label: "4 movers", value: "4 movers", priceDelta: 240 },
      ],
    },
    {
      id: "stairs",
      label: "Access",
      kind: "toggle",
      toggleLabel: "There are stairs involved",
      priceDelta: 85,
    },
  ],
  Painting: [
    {
      id: "rooms",
      label: "Scope",
      kind: "single",
      options: [
        { label: "1 room", value: "1 room" },
        { label: "2 rooms", value: "2 rooms", priceDelta: 150 },
        { label: "3 rooms", value: "3 rooms", priceDelta: 300 },
      ],
    },
    {
      id: "materials",
      label: "Materials",
      kind: "single",
      options: [
        { label: "I have paint already", value: "I have paint already" },
        { label: "Bring paint and materials", value: "Bring paint and materials", priceDelta: 180 },
      ],
    },
    {
      id: "repairs",
      label: "Prep work",
      kind: "toggle",
      toggleLabel: "Patch and prep walls first",
      priceDelta: 95,
    },
  ],
  HVAC: [
    {
      id: "serviceType",
      label: "Visit type",
      kind: "single",
      options: [
        { label: "Filter service", value: "Filter service" },
        { label: "Cooling diagnostic", value: "Cooling diagnostic", priceDelta: 120 },
        { label: "Full maintenance", value: "Full maintenance", priceDelta: 180 },
      ],
    },
    {
      id: "units",
      label: "Units",
      kind: "single",
      options: [
        { label: "1 unit", value: "1 unit" },
        { label: "2 units", value: "2 units", priceDelta: 90 },
        { label: "3+ units", value: "3+ units", priceDelta: 160 },
      ],
    },
    {
      id: "urgentCooling",
      label: "Urgency",
      kind: "toggle",
      toggleLabel: "No cooling right now",
      priceDelta: 70,
    },
  ],
  Security: [
    {
      id: "package",
      label: "Security request",
      kind: "single",
      options: [
        { label: "Site assessment", value: "Site assessment" },
        { label: "Camera install", value: "Camera install", priceDelta: 350 },
        { label: "Alarm upgrade", value: "Alarm upgrade", priceDelta: 240 },
      ],
    },
    {
      id: "property",
      label: "Property type",
      kind: "single",
      options: [
        { label: "Apartment", value: "Apartment" },
        { label: "House", value: "House", priceDelta: 40 },
        { label: "Business", value: "Business", priceDelta: 90 },
      ],
    },
    {
      id: "monitoring",
      label: "Support",
      kind: "toggle",
      toggleLabel: "Discuss monitoring options on-site",
      priceDelta: 120,
    },
  ],
  Carpentry: [
    {
      id: "task",
      label: "Task",
      kind: "single",
      options: [
        { label: "Door repair", value: "Door repair" },
        { label: "Shelving install", value: "Shelving install", priceDelta: 80 },
        { label: "Cupboard fix", value: "Cupboard fix", priceDelta: 60 },
        { label: "Custom fitting", value: "Custom fitting", priceDelta: 180 },
      ],
    },
    {
      id: "visitType",
      label: "Visit type",
      kind: "single",
      options: [
        { label: "Repair only", value: "Repair only" },
        { label: "Measure and quote", value: "Measure and quote", priceDelta: 40 },
        { label: "Supply and fit", value: "Supply and fit", priceDelta: 140 },
      ],
    },
    {
      id: "materialsReady",
      label: "Materials",
      kind: "toggle",
      toggleLabel: "I already have the materials on-site",
    },
  ],
};

const bookingArrivalWindows = ["ASAP", "Morning", "Midday", "After work", "Weekend"];
const bookingContactPreferences = ["In-app chat", "Call on arrival", "SMS updates"];

function getBookingFieldsForService(service: DemoService) {
  return bookingFieldConfigByCategory[service.category] ?? [];
}

function buildBookingFieldDefaults(fields: BookingFieldDefinition[]) {
  return Object.fromEntries(
    fields.map((field) => {
      if (field.kind === "single") return [field.id, field.options?.[0]?.value ?? ""];
      if (field.kind === "multi") return [field.id, []];
      return [field.id, false];
    }),
  ) as BookingDraftValues;
}

function parseRandPriceValue(priceLabel: string) {
  const numeric = Number(priceLabel.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatRand(value: number) {
  return `R${Math.round(value).toLocaleString("en-ZA")}`;
}

function computeBookingEstimate(service: DemoService, fields: BookingFieldDefinition[], values: BookingDraftValues) {
  return fields.reduce((total, field) => {
    const currentValue = values[field.id];
    if (field.kind === "single") {
      const match = field.options?.find((option) => option.value === currentValue);
      return total + (match?.priceDelta ?? 0);
    }
    if (field.kind === "multi") {
      const selected = Array.isArray(currentValue) ? currentValue : [];
      return (
        total +
        (field.options ?? [])
          .filter((option) => selected.includes(option.value))
          .reduce((sum, option) => sum + (option.priceDelta ?? 0), 0)
      );
    }

    return total + (currentValue ? field.priceDelta ?? 0 : 0);
  }, parseRandPriceValue(service.price));
}

function formatScheduledFor(dateValue: string, arrivalWindow: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const scheduledDate = new Date(year, (month || 1) - 1, day || 1);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  const dayLabel = sameDay(scheduledDate, today)
    ? "Today"
    : sameDay(scheduledDate, tomorrow)
      ? "Tomorrow"
      : scheduledDate.toLocaleDateString("en-ZA", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

  return `${dayLabel}, ${arrivalWindow}`;
}

function getInitialEtaForWindow(arrivalWindow: string) {
  if (arrivalWindow === "ASAP") return "Awaiting fastest pro";
  if (arrivalWindow === "Weekend") return "Weekend slot pending";
  return `${arrivalWindow} slot pending`;
}

function getChecklistForService(service: DemoService) {
  return [
    { label: "Request submitted", complete: true },
    { label: `${service.provider.split(" ")[0]} reviewing details`, complete: false },
    { label: "Arrival window confirmed", complete: false },
    { label: "Service completed", complete: false },
  ];
}

function findProviderAvatar(service: DemoService) {
  const matchingBooking = demoBookings.find((booking) => booking.provider === service.provider);
  if (matchingBooking) return matchingBooking.avatarUrl;
  const matchingPost = demoFeedPosts.find((post) => post.provider === service.provider);
  return matchingPost?.avatarUrl ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80";
}

function getFieldSummary(field: BookingFieldDefinition, value: string | string[] | boolean) {
  if (field.kind === "multi") {
    const selected = Array.isArray(value) ? value : [];
    if (selected.length === 0) return "No add-ons selected";
    return (
      field.options
        ?.filter((option) => selected.includes(option.value))
        .map((option) => option.label)
        .join(", ") ?? "No add-ons selected"
    );
  }

  if (field.kind === "toggle") {
    return value ? field.toggleLabel ?? "Included" : "Not included";
  }

  return field.options?.find((option) => option.value === value)?.label ?? String(value ?? "");
}

function getMapCategoryTone(category: string) {
  const tones: Record<
    string,
    { dot: string; activePin: string; activeChip: string; activeCard: string; badge: string }
  > = {
    Plumbing: {
      dot: "bg-cyan-300",
      activePin: "border-cyan-200 bg-cyan-400 text-slate-950",
      activeChip: "border-cyan-300/35 bg-cyan-300/18 text-cyan-100",
      activeCard: "border-cyan-300/45 bg-cyan-400/10",
      badge: "bg-cyan-400/14 text-cyan-100",
    },
    Cleaning: {
      dot: "bg-emerald-300",
      activePin: "border-emerald-200 bg-emerald-400 text-slate-950",
      activeChip: "border-emerald-300/35 bg-emerald-300/18 text-emerald-100",
      activeCard: "border-emerald-300/45 bg-emerald-400/10",
      badge: "bg-emerald-400/14 text-emerald-100",
    },
    Electrical: {
      dot: "bg-amber-300",
      activePin: "border-amber-200 bg-amber-300 text-slate-950",
      activeChip: "border-amber-300/35 bg-amber-300/18 text-amber-100",
      activeCard: "border-amber-300/45 bg-amber-300/10",
      badge: "bg-amber-300/14 text-amber-100",
    },
    Gardening: {
      dot: "bg-lime-300",
      activePin: "border-lime-200 bg-lime-300 text-slate-950",
      activeChip: "border-lime-300/35 bg-lime-300/18 text-lime-100",
      activeCard: "border-lime-300/45 bg-lime-300/10",
      badge: "bg-lime-300/14 text-lime-100",
    },
    Hair: {
      dot: "bg-fuchsia-300",
      activePin: "border-fuchsia-200 bg-fuchsia-300 text-slate-950",
      activeChip: "border-fuchsia-300/35 bg-fuchsia-300/18 text-fuchsia-100",
      activeCard: "border-fuchsia-300/45 bg-fuchsia-300/10",
      badge: "bg-fuchsia-300/14 text-fuchsia-100",
    },
    Makeup: {
      dot: "bg-rose-300",
      activePin: "border-rose-200 bg-rose-300 text-slate-950",
      activeChip: "border-rose-300/35 bg-rose-300/18 text-rose-100",
      activeCard: "border-rose-300/45 bg-rose-300/10",
      badge: "bg-rose-300/14 text-rose-100",
    },
    "Pool Cleaning": {
      dot: "bg-sky-300",
      activePin: "border-sky-200 bg-sky-300 text-slate-950",
      activeChip: "border-sky-300/35 bg-sky-300/18 text-sky-100",
      activeCard: "border-sky-300/45 bg-sky-300/10",
      badge: "bg-sky-300/14 text-sky-100",
    },
    "Dog Washing": {
      dot: "bg-orange-300",
      activePin: "border-orange-200 bg-orange-300 text-slate-950",
      activeChip: "border-orange-300/35 bg-orange-300/18 text-orange-100",
      activeCard: "border-orange-300/45 bg-orange-300/10",
      badge: "bg-orange-300/14 text-orange-100",
    },
    "Dog Walking": {
      dot: "bg-violet-300",
      activePin: "border-violet-200 bg-violet-300 text-slate-950",
      activeChip: "border-violet-300/35 bg-violet-300/18 text-violet-100",
      activeCard: "border-violet-300/45 bg-violet-300/10",
      badge: "bg-violet-300/14 text-violet-100",
    },
  };

  return (
    tones[category] ?? {
      dot: "bg-cyan-300",
      activePin: "border-cyan-200 bg-cyan-400 text-slate-950",
      activeChip: "border-cyan-300/35 bg-cyan-300/18 text-cyan-100",
      activeCard: "border-cyan-300/45 bg-cyan-400/10",
      badge: "bg-cyan-400/14 text-cyan-100",
    }
  );
}

export default function DemoPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeRole = useAuthStore((state) => state.user?.activeRole);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [address, setAddress] = useState("Sandton City, 83 Rivonia Road, Sandhurst, Sandton");
  const [addressBook, setAddressBook] = useState(demoAddressBook);
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] = useState<FinderSuggestion>(
    inferSuggestionFromAddress("Sandton City, 83 Rivonia Road, Sandhurst, Sandton", demoAddressBook),
  );
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const [addressFinderStatus, setAddressFinderStatus] = useState<string | null>(null);
  const [savedAddressStatus, setSavedAddressStatus] = useState<string | null>(null);
  const [addressSearchResults, setAddressSearchResults] = useState<FinderSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [bookings, setBookings] = useState(demoBookings);
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
  const [bookingFlow, setBookingFlow] = useState<BookingFlowState | null>(null);
  const [bookingFlowStatus, setBookingFlowStatus] = useState<string | null>(null);
  const [addressEditorOpen, setAddressEditorOpen] = useState(false);
  const [addressEditorMode, setAddressEditorMode] = useState<AddressEditorMode>("create");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    label: "",
    value: "",
    note: "",
  });
  const [addressFormSuggestion, setAddressFormSuggestion] = useState<FinderSuggestion | null>(null);
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

  useEffect(() => {
    if (!savedAddressStatus) return;
    const timeout = window.setTimeout(() => setSavedAddressStatus(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [savedAddressStatus]);

  useEffect(() => {
    if (!bookingFlowStatus) return;
    const timeout = window.setTimeout(() => setBookingFlowStatus(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [bookingFlowStatus]);

  useEffect(() => {
    if (!addressEditorOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddressEditorOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addressEditorOpen]);

  useEffect(() => {
    if (!bookingFlow) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBookingFlow(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bookingFlow]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || activeRole !== "CUSTOMER") return;

    void (async () => {
      try {
        const { data } = await customerApi.getAddresses();
        if (cancelled || data.length === 0) return;

        const mapped = data.map((addressItem) => {
          const suggestion = findSuggestionForAddress(addressItem.value, demoAddressBook);
          return {
            id: addressItem.id,
            label: addressItem.label,
            value: addressItem.value,
            note: addressItem.note ?? "",
            neighborhood: suggestion?.neighborhood,
            lat: suggestion?.lat,
            lng: suggestion?.lng,
          } satisfies AddressBookItem;
        });
        const defaultAddress = data.find((addressItem) => addressItem.defaultAddress) ?? data[0];
        const defaultSuggestion = inferSuggestionFromAddress(defaultAddress.value, mapped);

        setAddressBook(mapped);
        setAddress(defaultAddress.value);
        setSelectedAddressSuggestion(defaultSuggestion);
      } catch {
        // Demo stays usable with seeded address shortcuts if the backend account has no saved data yet.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeRole, isAuthenticated]);

  const activeAddressSuggestion = useMemo(
    () =>
      address.trim().toLowerCase() === selectedAddressSuggestion.value.trim().toLowerCase()
        ? selectedAddressSuggestion
        : inferSuggestionFromAddress(address, addressBook),
    [address, addressBook, selectedAddressSuggestion],
  );
  const addressSuggestions = useMemo(() => {
    const query = address.trim().toLowerCase();
    const savedMatches = addressBook
      .map((saved) => createFinderSuggestionFromSavedAddress(saved))
      .filter((suggestion): suggestion is FinderSuggestion => Boolean(suggestion))
      .filter(
        (suggestion) =>
          suggestion.value.toLowerCase().includes(query) ||
          suggestion.neighborhood.toLowerCase().includes(query) ||
          suggestion.label.toLowerCase().includes(query),
      );
    const localMatches = finderSuggestions.filter(
      (suggestion) =>
        suggestion.value.toLowerCase().includes(query) ||
        suggestion.neighborhood.toLowerCase().includes(query) ||
        suggestion.label.toLowerCase().includes(query),
    );

    if (!query) return [...savedMatches, ...localMatches, ...addressSearchResults];

    const merged = [...addressSearchResults, ...savedMatches, ...localMatches];
    return merged.filter(
      (suggestion, index, allSuggestions) =>
        allSuggestions.findIndex((candidate) => candidate.value === suggestion.value) === index,
    );
  }, [address, addressBook, addressSearchResults]);
  const serviceCategoryOptions = useMemo(
    () => Array.from(new Set(homeServices.map((service) => service.category))),
    [],
  );
  const mapCategoryOptions = useMemo(() => ["All", ...serviceCategoryOptions], [serviceCategoryOptions]);
  const activeSavedAddress = useMemo(
    () => addressBook.find((item) => item.value === address) ?? null,
    [address, addressBook],
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
  const activeBookingCount = useMemo(
    () => bookings.filter((booking) => booking.status !== "COMPLETED").length,
    [bookings],
  );
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
  const selectedMapService = useMemo(
    () => mapVisibleServices.find((service) => service.id === selectedMapServiceId) ?? null,
    [mapVisibleServices, selectedMapServiceId],
  );
  const mapPins = useMemo(() => {
    if (!selectedMapService) return [];

    return [selectedMapService].map((service, index) => {
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
  }, [selectedMapService]);
  const selectedMapMarker = useMemo(() => {
    if (selectedMapService) {
      const suggestion = getSuggestionByNeighborhood(selectedMapService.neighborhood);
      return { lat: suggestion.lat, lng: suggestion.lng };
    }

    return null;
  }, [selectedMapService]);
  const sandtonMapUrl = useMemo(
    () => buildOsmEmbedUrl(SANDTON_BOUNDS, selectedMapMarker),
    [selectedMapMarker],
  );
  const sandtonMapExternalUrl = useMemo(
    () => buildOsmOpenUrl(selectedMapMarker),
    [selectedMapMarker],
  );
  const bookingFlowService = useMemo(
    () => (bookingFlow ? homeServices.find((service) => service.id === bookingFlow.serviceId) ?? null : null),
    [bookingFlow],
  );
  const bookingFields = useMemo(
    () => (bookingFlowService ? getBookingFieldsForService(bookingFlowService) : []),
    [bookingFlowService],
  );
  const bookingEstimate = useMemo(
    () =>
      bookingFlow && bookingFlowService
        ? computeBookingEstimate(bookingFlowService, bookingFields, bookingFlow.values)
        : 0,
    [bookingFields, bookingFlow, bookingFlowService],
  );
  const selectedBookingAddress = useMemo(
    () =>
      bookingFlow ? addressBook.find((addressItem) => addressItem.value === bookingFlow.addressValue) ?? null : null,
    [addressBook, bookingFlow],
  );
  const selectedPaymentMethod = useMemo(
    () =>
      bookingFlow
        ? demoPaymentMethods.find((method) => method.id === bookingFlow.paymentMethodId) ?? null
        : null,
    [bookingFlow],
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

  const openBookingWorkflow = (serviceId: string) => {
    const service = homeServices.find((item) => item.id === serviceId);
    if (!service) return;

    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    const isUrgentService = ["Plumbing", "Electrical"].includes(service.category);
    const defaultPayment = demoPaymentMethods.find((method) => method.default)?.id ?? demoPaymentMethods[0]?.id ?? "";

    setBookingFlow({
      serviceId: service.id,
      step: 1,
      values: buildBookingFieldDefaults(getBookingFieldsForService(service)),
      scheduledDate: localDate,
      arrivalWindow: isUrgentService ? "ASAP" : preferredWindow === "After work" ? "After work" : "Morning",
      addressValue: activeSavedAddress?.value ?? address,
      paymentMethodId: defaultPayment,
      notes: "",
      contactPreference: notificationMode === "Push + SMS" ? "SMS updates" : "In-app chat",
    });
    setBookingFlowStatus(null);
  };

  const updateBookingFieldValue = (field: BookingFieldDefinition, nextValue: string) => {
    if (!bookingFlow) return;

    setBookingFlow((current) => {
      if (!current) return current;

      const previousValue = current.values[field.id];
      let value: string | string[] | boolean = nextValue;

      if (field.kind === "multi") {
        const selected = Array.isArray(previousValue) ? previousValue : [];
        value = selected.includes(nextValue)
          ? selected.filter((item) => item !== nextValue)
          : [...selected, nextValue];
      } else if (field.kind === "toggle") {
        value = !(previousValue === true);
      }

      return {
        ...current,
        values: {
          ...current.values,
          [field.id]: value,
        },
      };
    });
  };

  const setBookingFlowField = <K extends keyof BookingFlowState>(field: K, value: BookingFlowState[K]) => {
    setBookingFlow((current) => (current ? { ...current, [field]: value } : current));
  };

  const continueBookingFlow = () => {
    if (!bookingFlow) return;

    if (bookingFlow.step === 2 && !bookingFlow.addressValue.trim()) {
      setBookingFlowStatus("Choose an address for this booking before continuing.");
      return;
    }

    if (bookingFlow.step === 2 && !bookingFlow.scheduledDate) {
      setBookingFlowStatus("Choose a service date before continuing.");
      return;
    }

    if (bookingFlow.step === 3 && !bookingFlow.paymentMethodId) {
      setBookingFlowStatus("Select a payment method to keep going.");
      return;
    }

    setBookingFlow((current) => (current ? { ...current, step: Math.min(4, current.step + 1) } : current));
    setBookingFlowStatus(null);
  };

  const confirmBookingWorkflow = () => {
    if (!bookingFlow || !bookingFlowService) return;

    const bookingId = `booking-${Date.now()}`;
    const providerShortName = bookingFlowService.provider.split(" ")[0];
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const summaryLines = bookingFields
      .map((field) => ({
        label: field.label,
        value: getFieldSummary(field, bookingFlow.values[field.id]),
      }))
      .filter((item) => item.value && item.value !== "No add-ons selected" && item.value !== "Not included");

    const newBooking = {
      id: bookingId,
      service: bookingFlowService.title,
      provider: bookingFlowService.provider,
      providerRole: bookingFlowService.category,
      status: "REQUESTED" as const,
      eta: getInitialEtaForWindow(bookingFlow.arrivalWindow),
      scheduledFor: formatScheduledFor(bookingFlow.scheduledDate, bookingFlow.arrivalWindow),
      price: formatRand(bookingEstimate),
      address: bookingFlow.addressValue,
      progress: 18,
      accent: bookingFlowService.accent,
      imageUrl: bookingFlowService.imageUrl,
      avatarUrl: findProviderAvatar(bookingFlowService),
      checklist: getChecklistForService(bookingFlowService),
      thread: [
        {
          id: `${bookingId}-provider`,
          sender: providerShortName,
          text: `Thanks for the booking request for ${bookingFlowService.title}. I'm reviewing your details now and will confirm the arrival window shortly.`,
          time: timeLabel,
        },
        {
          id: `${bookingId}-summary`,
          sender: "You",
          text: `Request summary: ${summaryLines
            .slice(0, 3)
            .map((item) => `${item.label}: ${item.value}`)
            .join(" | ") || "Standard service setup"}`,
          time: timeLabel,
          own: true,
        },
        ...(bookingFlow.notes.trim()
          ? [
              {
                id: `${bookingId}-notes`,
                sender: "You",
                text: bookingFlow.notes.trim(),
                time: timeLabel,
                own: true,
              },
            ]
          : []),
      ],
    };

    setBookings((current) => [newBooking, ...current]);
    setBookingMessages((current) => ({
      ...current,
      [bookingId]: newBooking.thread,
    }));
    setSelectedBookingId(bookingId);
    setBookingComposer("");
    setBookingFlow(null);
    setServiceGridOpen(false);
    setExpandedServiceId(null);
    setActiveTab("bookings");
    setBookingFlowStatus(`${bookingFlowService.title} requested. You can now track and message the provider.`);
  };

  const resolveAddressCandidate = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    const exactSearchMatch = addressSearchResults.find(
      (suggestion) =>
        suggestion.value.toLowerCase() === normalized ||
        suggestion.label.toLowerCase() === normalized,
    );
    if (exactSearchMatch) return exactSearchMatch;

    if (selectedAddressSuggestion.value.trim().toLowerCase() === normalized) {
      return selectedAddressSuggestion;
    }

    return findSuggestionForAddress(value, addressBook);
  };

  const applyAddressSuggestion = (suggestion: FinderSuggestion) => {
    setAddress(suggestion.value);
    setSelectedAddressSuggestion(suggestion);
    setAddressSuggestionsOpen(false);
    setAddressFinderStatus(`Showing services closest to ${suggestion.neighborhood}`);
  };

  const updateProfileField = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const updateAddressFormField = (field: keyof AddressFormState, value: string) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
    if (field === "value") {
      setAddressFormSuggestion(resolveAddressCandidate(value));
    }
  };

  const closeAddressEditor = () => {
    setAddressEditorOpen(false);
    setEditingAddressId(null);
    setAddressFormSuggestion(null);
  };

  const openCreateAddressEditor = (prefill?: {
    label?: string;
    value?: string;
    note?: string;
    suggestion?: FinderSuggestion | null;
  }) => {
    setAddressEditorMode("create");
    setEditingAddressId(null);
    setAddressForm({
      label: prefill?.label ?? `Saved ${activeAddressSuggestion.neighborhood}`,
      value: prefill?.value ?? address,
      note: prefill?.note ?? "",
    });
    setAddressFormSuggestion(prefill?.suggestion ?? resolveAddressCandidate(prefill?.value ?? address));
    setAddressEditorOpen(true);
  };

  const openEditAddressEditor = (addressItem: AddressBookItem) => {
    setAddressEditorMode("edit");
    setEditingAddressId(addressItem.id);
    setAddressForm({
      label: addressItem.label,
      value: addressItem.value,
      note: addressItem.note,
    });
    setAddressFormSuggestion(
      createFinderSuggestionFromSavedAddress(addressItem) ?? resolveAddressCandidate(addressItem.value),
    );
    setAddressEditorOpen(true);
  };

  const saveCurrentLocationToAddressBook = () => {
    const suggestion = resolveAddressCandidate(address);
    if (!suggestion) {
      setAddressSuggestionsOpen(true);
      setAddressFinderStatus("Choose or search an address first, then save it.");
      return;
    }

    const existing = addressBook.find(
      (addressItem) => addressItem.value.trim().toLowerCase() === suggestion.value.trim().toLowerCase(),
    );

    if (existing) {
      openEditAddressEditor(existing);
      setSavedAddressStatus(`Editing saved location for ${existing.label}.`);
      return;
    }

    openCreateAddressEditor({
      label: `Saved ${suggestion.neighborhood}`,
      value: suggestion.value,
      note: "",
      suggestion,
    });
  };

  const saveAddressEntry = async () => {
    const suggestion = addressFormSuggestion ?? resolveAddressCandidate(addressForm.value);
    const trimmedLabel = addressForm.label.trim();
    const trimmedValue = addressForm.value.trim();
    const trimmedNote = addressForm.note.trim();

    if (!trimmedLabel || !trimmedValue) {
      setSavedAddressStatus("Add a label and address before saving.");
      return;
    }

    if (!suggestion) {
      setSavedAddressStatus("Search or choose a real location before saving this address.");
      return;
    }

    const defaultAddress =
      activeSavedAddress?.value.trim().toLowerCase() === address.trim().toLowerCase() ||
      address.trim().toLowerCase() === trimmedValue.toLowerCase() ||
      addressBook.length === 0;

    const nextEntry: AddressBookItem = {
      id: editingAddressId ?? `address-${Date.now()}`,
      label: trimmedLabel,
      value: trimmedValue,
      note: trimmedNote || `Best matched around ${suggestion.neighborhood}.`,
      neighborhood: suggestion.neighborhood,
      lat: suggestion.lat,
      lng: suggestion.lng,
    };

    try {
      if (isAuthenticated && activeRole === "CUSTOMER") {
        if (addressEditorMode === "edit" && editingAddressId) {
          const response = await customerApi.updateAddress(editingAddressId, {
            label: trimmedLabel,
            value: trimmedValue,
            note: trimmedNote || undefined,
            defaultAddress,
          });
          nextEntry.id = response.data.id;
        } else {
          const response = await customerApi.createAddress({
            label: trimmedLabel,
            value: trimmedValue,
            note: trimmedNote || undefined,
            defaultAddress,
          });
          nextEntry.id = response.data.id;
        }
      }

      const previousActiveValue =
        addressEditorMode === "edit"
          ? addressBook.find((addressItem) => addressItem.id === editingAddressId)?.value ?? null
          : null;

      setAddressBook((current) => {
        if (addressEditorMode === "edit") {
          const updated = current.map((addressItem) =>
            addressItem.id === editingAddressId ? nextEntry : addressItem,
          );
          return defaultAddress
            ? [nextEntry, ...updated.filter((addressItem) => addressItem.id !== nextEntry.id)]
            : updated;
        }

        return defaultAddress ? [nextEntry, ...current] : [...current, nextEntry];
      });

      if (
        address.trim().toLowerCase() === trimmedValue.toLowerCase() ||
        (previousActiveValue &&
          address.trim().toLowerCase() === previousActiveValue.trim().toLowerCase()) ||
        defaultAddress
      ) {
        setAddress(trimmedValue);
        setSelectedAddressSuggestion(suggestion);
      }

      setSavedAddressStatus(
        addressEditorMode === "edit"
          ? `${trimmedLabel} updated in saved locations.`
          : `${trimmedLabel} added to saved locations.`,
      );
      closeAddressEditor();
    } catch {
      setSavedAddressStatus("We couldn't save that address right now. Please try again.");
    }
  };

  const deleteSavedAddress = async (addressId: string) => {
    const addressItem = addressBook.find((entry) => entry.id === addressId);
    if (!addressItem) return;

    try {
      if (isAuthenticated && activeRole === "CUSTOMER") {
        await customerApi.deleteAddress(addressId);
      }

      setAddressBook((current) => current.filter((entry) => entry.id !== addressId));

      if (editingAddressId === addressId) {
        closeAddressEditor();
      }

      setSavedAddressStatus(`${addressItem.label} removed from saved locations.`);
    } catch {
      setSavedAddressStatus("We couldn't delete that address right now. Please try again.");
    }
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
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={saveCurrentLocationToAddressBook}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80"
                        >
                          Save location
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
                  {addressBook.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        applyAddressSuggestion(
                          createFinderSuggestionFromSavedAddress(item) ??
                            finderSuggestions.find((suggestion) => suggestion.value === item.value) ??
                            inferSuggestionFromAddress(item.value, addressBook),
                        )
                      }
                      className="min-h-11 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/72"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={saveCurrentLocationToAddressBook}
                    className="min-h-11 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100"
                  >
                    Save location
                  </button>
                </div>
                <p className="mt-3 text-xs text-white/50">
                  Auto-matched area: {activeAddressSuggestion.neighborhood}
                </p>
                {addressFinderStatus ? (
                  <p role="status" className="mt-1 text-xs text-cyan-200">
                    {addressFinderStatus}
                  </p>
                ) : null}
                {savedAddressStatus ? (
                  <p role="status" className="mt-1 text-xs text-cyan-200">
                    {savedAddressStatus}
                  </p>
                ) : null}
                {activeSavedAddress ? (
                  <p className="mt-1 text-xs text-white/42">
                    Saved as {activeSavedAddress.label}. Tap `Save location` to rename or update it.
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

                    {mapPins.map((service) => {
                      const tone = getMapCategoryTone(service.category);
                      return (
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
                                ? tone.activePin
                                : "border-white/14 bg-black/45"
                            }`}
                          >
                            <MapPin className="h-4 w-4" />
                          </span>
                        </button>
                      );
                    })}

                    {mapVisibleServices.length === 0 ? (
                      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[20px] border border-dashed border-white/10 bg-black/35 p-4 text-center">
                        <p className="text-sm font-semibold">No pins for this filter yet</p>
                        <p className="mt-1 text-xs text-white/52">
                          Try another category or clear your search to repopulate the map.
                        </p>
                      </div>
                    ) : !selectedMapService ? (
                      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[20px] border border-dashed border-white/10 bg-black/35 p-4 text-center">
                        <p className="text-sm font-semibold">Tap a service to drop its pin</p>
                        <p className="mt-1 text-xs text-white/52">
                          The map stays clean until a service is selected below.
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] ${getMapCategoryTone(selectedMapService.category).badge}`}
                            >
                              {selectedMapService.category}
                            </span>
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/72">
                              {selectedMapService.dynamicEta}
                            </span>
                          </div>
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
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {mapVisibleServices.slice(0, 8).map((service) => {
                    const active = selectedMapService?.id === service.id;
                    const tone = getMapCategoryTone(service.category);
                    return (
                      <button
                        key={`map-service-${service.id}`}
                        type="button"
                        onClick={() => setSelectedMapServiceId(service.id)}
                        className={`shrink-0 rounded-full px-3 py-2 text-xs ${
                          active ? tone.activeChip : "border border-white/10 bg-black/20 text-white/72"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                          <span>{service.title}</span>
                        </span>
                      </button>
                    );
                  })}
                  {selectedMapService ? (
                    <button
                      type="button"
                      onClick={() => setSelectedMapServiceId(null)}
                      className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/72"
                    >
                      Clear pin
                    </button>
                  ) : null}
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
                                      openBookingWorkflow(service.id);
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
                        onClick={() => {
                          const matchedService =
                            homeServices.find((service) => service.provider === item.provider) ?? null;
                          if (matchedService) {
                            openBookingWorkflow(matchedService.id);
                          } else {
                            setActiveTab("bookings");
                          }
                        }}
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
                                onClick={() => {
                                  const matchingService =
                                    homeServices.find((service) => service.provider === post.provider) ??
                                    filteredServices.find((service) => service.provider === post.provider) ??
                                    null;
                                  if (matchingService) {
                                    openBookingWorkflow(matchingService.id);
                                  }
                                }}
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
                  {activeBookingCount} active
                </button>
              </div>
              {bookingFlowStatus ? (
                <p role="status" className="mt-3 text-sm text-cyan-200">
                  {bookingFlowStatus}
                </p>
              ) : null}

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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-200" />
                    <p className="text-sm font-semibold">Saved addresses</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateAddressEditor()}
                    className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100"
                  >
                    Add new
                  </button>
                </div>
                <div className="space-y-3">
                  {addressBook.map((addressItem) => {
                    const active = address === addressItem.value;
                    return (
                      <div
                        key={addressItem.id}
                        className={`rounded-[18px] px-4 py-3 transition-colors ${
                          active ? "border border-cyan-300/45 bg-cyan-400/10" : "bg-black/20"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            applyAddressSuggestion(
                              createFinderSuggestionFromSavedAddress(addressItem) ??
                                finderSuggestions.find(
                                  (suggestion) => suggestion.value === addressItem.value,
                                ) ??
                                inferSuggestionFromAddress(addressItem.value, addressBook),
                            )
                          }
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{addressItem.label}</p>
                                {addressItem.neighborhood ? (
                                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/55">
                                    {addressItem.neighborhood}
                                  </span>
                                ) : null}
                              </div>
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
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditAddressEditor(addressItem)}
                            className="min-h-10 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/78"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSavedAddress(addressItem.id)}
                            className="min-h-10 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/62"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {savedAddressStatus ? (
                  <p role="status" className="mt-3 text-xs text-cyan-200">
                    {savedAddressStatus}
                  </p>
                ) : null}
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
        {bookingFlow && bookingFlowService ? (
          <motion.div
            className="fixed inset-0 z-50 bg-black/78 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBookingFlow(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Book ${bookingFlowService.title}`}
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: "spring", stiffness: 230, damping: 26 }}
              className="mx-auto mt-5 w-[calc(100%-1.25rem)] max-w-[470px] overflow-hidden rounded-[30px] border border-white/10 bg-[#07111f] text-white shadow-[0_28px_72px_rgba(0,0,0,0.48)]"
              style={{
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={`relative overflow-hidden bg-gradient-to-br ${bookingFlowService.accent} p-5 text-slate-950`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{ backgroundImage: `url(${bookingFlowService.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-700">Book now</p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                        {bookingFlowService.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">
                        {bookingFlowService.provider} | {bookingFlowService.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingFlow(null)}
                      className="rounded-full bg-slate-950/10 px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-800">
                    <span className="rounded-full bg-slate-950/10 px-3 py-1.5">
                      {serviceTravelMinutes(bookingFlowService.id, activeAddressSuggestion)} min away
                    </span>
                    <span className="rounded-full bg-slate-950/10 px-3 py-1.5">
                      {formatRand(bookingEstimate)} est.
                    </span>
                    <span className="rounded-full bg-slate-950/10 px-3 py-1.5">
                      {bookingFlow.step}/4
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4">
                <div className="mb-5 grid grid-cols-4 gap-2">
                  {[
                    { step: 1, label: "Details" },
                    { step: 2, label: "Schedule" },
                    { step: 3, label: "Checkout" },
                    { step: 4, label: "Review" },
                  ].map((item) => {
                    const active = bookingFlow.step === item.step;
                    const complete = bookingFlow.step > item.step;
                    return (
                      <div key={item.step} className="text-center">
                        <div
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                            complete
                              ? "bg-emerald-300 text-slate-950"
                              : active
                                ? "bg-cyan-300 text-slate-950"
                                : "bg-white/10 text-white/55"
                          }`}
                        >
                          {item.step}
                        </div>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/44">
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {bookingFlow.step === 1 ? (
                  <div className="space-y-5">
                    {bookingFields.length > 0 ? (
                      bookingFields.map((field) => {
                        const currentValue = bookingFlow.values[field.id];
                        return (
                          <div key={field.id}>
                            <p className="text-sm font-semibold">{field.label}</p>
                            {field.helper ? (
                              <p className="mt-1 text-xs text-white/45">{field.helper}</p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {field.kind === "toggle" ? (
                                <button
                                  type="button"
                                  onClick={() => updateBookingFieldValue(field, "toggle")}
                                  className={`min-h-11 rounded-[18px] px-4 py-3 text-sm ${
                                    currentValue
                                      ? "bg-cyan-300 text-slate-950"
                                      : "border border-white/10 bg-white/8 text-white/76"
                                  }`}
                                >
                                  {field.toggleLabel}
                                </button>
                              ) : (
                                field.options?.map((option) => {
                                  const active =
                                    field.kind === "multi"
                                      ? Array.isArray(currentValue) && currentValue.includes(option.value)
                                      : currentValue === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => updateBookingFieldValue(field, option.value)}
                                      className={`min-h-11 rounded-[18px] px-4 py-3 text-sm ${
                                        active
                                          ? "bg-cyan-300 text-slate-950"
                                          : "border border-white/10 bg-white/8 text-white/76"
                                      }`}
                                    >
                                      <span>{option.label}</span>
                                      {option.priceDelta ? (
                                        <span className="ml-2 text-xs opacity-70">
                                          +{formatRand(option.priceDelta)}
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 text-sm text-white/74">
                        This service uses the standard request flow. Continue to choose the schedule and confirm the job.
                      </div>
                    )}
                  </div>
                ) : null}

                {bookingFlow.step === 2 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold">Choose a date</p>
                      <Input
                        type="date"
                        value={bookingFlow.scheduledDate}
                        onChange={(event) => setBookingFlowField("scheduledDate", event.target.value)}
                        className="mt-3 h-12 rounded-[18px] border-white/10 bg-white/8 text-white"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Arrival window</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bookingArrivalWindows.map((windowLabel) => (
                          <button
                            key={windowLabel}
                            type="button"
                            onClick={() => setBookingFlowField("arrivalWindow", windowLabel)}
                            className={`min-h-11 rounded-full px-4 py-2 text-sm ${
                              bookingFlow.arrivalWindow === windowLabel
                                ? "bg-cyan-300 text-slate-950"
                                : "border border-white/10 bg-white/8 text-white/76"
                            }`}
                          >
                            {windowLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">Service address</p>
                        <button
                          type="button"
                          onClick={saveCurrentLocationToAddressBook}
                          className="text-xs font-semibold text-cyan-200"
                        >
                          Save current
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {[...addressBook, { id: "current-home", label: "Current home", value: address, note: "Using the live address from Home" }].filter(
                          (item, index, array) =>
                            array.findIndex((candidate) => candidate.value === item.value) === index,
                        ).map((addressItem) => {
                          const active = bookingFlow.addressValue === addressItem.value;
                          return (
                            <button
                              key={addressItem.id}
                              type="button"
                              onClick={() => setBookingFlowField("addressValue", addressItem.value)}
                              className={`w-full rounded-[20px] px-4 py-3 text-left ${
                                active
                                  ? "border border-cyan-300/45 bg-cyan-400/10"
                                  : "border border-white/10 bg-white/8"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium">{addressItem.label}</p>
                                  <p className="mt-1 text-xs text-white/52">{addressItem.value}</p>
                                </div>
                                {active ? (
                                  <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {bookingFlow.step === 3 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold">Payment method</p>
                      <div className="mt-3 space-y-3">
                        {demoPaymentMethods.map((method) => {
                          const active = bookingFlow.paymentMethodId === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setBookingFlowField("paymentMethodId", method.id)}
                              className={`flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left ${
                                active
                                  ? "border border-cyan-300/45 bg-cyan-400/10"
                                  : "border border-white/10 bg-white/8"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {method.brand} ending in {method.last4}
                                </p>
                                <p className="mt-1 text-xs text-white/52">
                                  {method.holder} | expires {method.expiry}
                                </p>
                              </div>
                              {active ? (
                                <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                                  Selected
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Updates</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bookingContactPreferences.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setBookingFlowField("contactPreference", option)}
                            className={`min-h-11 rounded-full px-4 py-2 text-sm ${
                              bookingFlow.contactPreference === option
                                ? "bg-emerald-300 text-slate-950"
                                : "border border-white/10 bg-white/8 text-white/76"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Notes for the provider</p>
                      <textarea
                        value={bookingFlow.notes}
                        onChange={(event) => setBookingFlowField("notes", event.target.value)}
                        placeholder="Add gate codes, pet notes, parking info, inspiration references, or anything else helpful."
                        className="mt-3 min-h-[120px] w-full rounded-[20px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none"
                      />
                    </div>
                  </div>
                ) : null}

                {bookingFlow.step === 4 ? (
                  <div className="space-y-4">
                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/44">Service summary</p>
                      <div className="mt-3 space-y-3">
                        {bookingFields.map((field) => (
                          <div key={field.id} className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-white/56">{field.label}</span>
                            <span className="max-w-[12rem] text-right font-medium">
                              {getFieldSummary(field, bookingFlow.values[field.id])}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-white/56">Scheduled</span>
                          <span className="max-w-[12rem] text-right font-medium">
                            {formatScheduledFor(bookingFlow.scheduledDate, bookingFlow.arrivalWindow)}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-white/56">Address</span>
                          <span className="max-w-[12rem] text-right font-medium">
                            {selectedBookingAddress?.label ?? "Selected address"} | {bookingFlow.addressValue}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-white/56">Payment</span>
                          <span className="font-medium">
                            {selectedPaymentMethod
                              ? `${selectedPaymentMethod.brand} ${selectedPaymentMethod.last4}`
                              : "Select payment"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                          <span className="text-white/56">Updates</span>
                          <span className="font-medium">{bookingFlow.contactPreference}</span>
                        </div>
                      </div>
                    </div>

                    {bookingFlow.notes.trim() ? (
                      <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/44">Notes</p>
                        <p className="mt-2 text-sm leading-6 text-white/78">{bookingFlow.notes}</p>
                      </div>
                    ) : null}

                    <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(142,247,214,0.16),rgba(125,211,252,0.14),rgba(251,191,36,0.12))] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/48">
                            Estimated total
                          </p>
                          <p className="mt-2 text-2xl font-semibold">{formatRand(bookingEstimate)}</p>
                        </div>
                        <div className="text-right text-xs text-white/58">
                          <p>{serviceTravelMinutes(bookingFlowService.id, activeAddressSuggestion)} min average arrival</p>
                          <p className="mt-1">Final quote can adjust if the provider adds parts or labor.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {bookingFlowStatus ? (
                  <p role="status" className="mt-4 text-sm text-cyan-200">
                    {bookingFlowStatus}
                  </p>
                ) : null}

                <div className="mt-5 flex gap-3">
                  {bookingFlow.step > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setBookingFlow((current) =>
                          current ? { ...current, step: Math.max(1, current.step - 1) } : current,
                        )
                      }
                      className="min-h-12 rounded-full border border-white/10 px-4 text-sm text-white/78"
                    >
                      Back
                    </button>
                  ) : null}
                  <Button
                    className="min-h-12 flex-1 rounded-full bg-white text-slate-950 hover:bg-white/92"
                    onClick={() => {
                      if (bookingFlow.step === 4) {
                        confirmBookingWorkflow();
                      } else {
                        continueBookingFlow();
                      }
                    }}
                  >
                    {bookingFlow.step === 4 ? "Confirm booking" : "Continue"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {addressEditorOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-black/78 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddressEditor}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={addressEditorMode === "edit" ? "Edit saved address" : "Save location"}
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: "spring", stiffness: 230, damping: 26 }}
              className="mx-auto mt-8 w-[calc(100%-2rem)] max-w-[460px] rounded-[28px] border border-white/10 bg-[#07111f] p-5 text-white shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
              style={{
                paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))",
                paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                    {addressEditorMode === "edit" ? "Edit saved address" : "Save location"}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    {addressEditorMode === "edit"
                      ? "Update this saved place"
                      : "Add this location to your shortcuts"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeAddressEditor}
                  className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/78"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                    Label
                  </p>
                  <Input
                    value={addressForm.label}
                    onChange={(event) => updateAddressFormField("label", event.target.value)}
                    placeholder="Home, Office, Mom..."
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                    Address
                  </p>
                  <Input
                    value={addressForm.value}
                    onChange={(event) => updateAddressFormField("value", event.target.value)}
                    placeholder="Paste or confirm the full address"
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                  />
                  <p className="mt-2 text-xs text-white/42">
                    Tip: search or confirm the address on the home tab first for the most accurate saved location.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                    Note for the pro
                  </p>
                  <Input
                    value={addressForm.note}
                    onChange={(event) => updateAddressFormField("note", event.target.value)}
                    placeholder="Gate code, entrance, parking, concierge..."
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddressForm((current) => ({ ...current, value: address }));
                    setAddressFormSuggestion(selectedAddressSuggestion);
                  }}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/78"
                >
                  Use current home location
                </button>
                {addressFormSuggestion ? (
                  <span className="rounded-full bg-cyan-400/12 px-3 py-2 text-xs text-cyan-100">
                    Matched near {addressFormSuggestion.neighborhood}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/52">
                    Not matched yet
                  </span>
                )}
              </div>

              {savedAddressStatus ? (
                <p role="status" className="mt-4 text-xs text-cyan-200">
                  {savedAddressStatus}
                </p>
              ) : null}

              <div className="mt-5 flex gap-3">
                <Button
                  className="min-h-12 flex-1 rounded-full bg-white text-slate-950 hover:bg-white/92"
                  onClick={() => void saveAddressEntry()}
                >
                  <Check className="h-4 w-4" />
                  {addressEditorMode === "edit" ? "Save changes" : "Save location"}
                </Button>
                <button
                  type="button"
                  onClick={closeAddressEditor}
                  className="min-h-12 rounded-full border border-white/10 px-4 text-sm text-white/78"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
                  {mapPins.map((service) => {
                    const tone = getMapCategoryTone(service.category);
                    return (
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
                              ? tone.activePin
                              : "border-white/18 bg-black/52"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                        </span>
                      </button>
                    );
                  })}
                  {!selectedMapService ? (
                    <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[22px] border border-dashed border-white/10 bg-black/38 p-4 text-center">
                      <p className="text-sm font-semibold">Tap a service below to place its pin</p>
                      <p className="mt-1 text-xs text-white/52">
                        The map stays uncluttered until you select one of the services in the list.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-white/52">
                  {selectedMapService ? (
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${getMapCategoryTone(selectedMapService.category).dot}`} />
                      <span>
                        {selectedMapService.title} pinned in {selectedMapService.neighborhood}
                      </span>
                    </div>
                  ) : (
                    <span>Choose a service below to preview exactly where it would appear on the map.</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {selectedMapService ? (
                    <button
                      type="button"
                      onClick={() => setSelectedMapServiceId(null)}
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/80"
                    >
                      Clear pin
                    </button>
                  ) : null}
                  <a
                    href={sandtonMapExternalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/80"
                  >
                    Open in OSM
                  </a>
                </div>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto pb-2">
                {mapVisibleServices.slice(0, 8).map((service) => {
                  const active = selectedMapService?.id === service.id;
                  const tone = getMapCategoryTone(service.category);
                  return (
                    <button
                      key={`expanded-card-${service.id}`}
                      type="button"
                      onClick={() => setSelectedMapServiceId(service.id)}
                      className={`flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left ${
                        active ? `border ${tone.activeCard}` : "border border-white/8 bg-white/8"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                          <p className="text-sm font-semibold">{service.title}</p>
                        </div>
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
