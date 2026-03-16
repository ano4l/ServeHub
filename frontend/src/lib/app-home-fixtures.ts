export interface HomeAddressFixture {
  id: string;
  label: string;
  value: string;
  note: string;
  area: string;
  lat: number;
  lng: number;
}

export interface HomeServiceFixture {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  badge: string;
  priceLabel: string;
  accent: string;
  rating: number;
  reviews: number;
  neighborhood: string;
  lat: number;
  lng: number;
  tags: string[];
  availableNow: boolean;
  imageUrl: string;
}

export interface HomeBookingFixture {
  id: string;
  service: string;
  provider: string;
  statusLabel: string;
  etaLabel: string;
  scheduledLabel: string;
  address: string;
  progress: number;
}

export interface HomeOrderHistoryFixture {
  id: string;
  title: string;
  provider: string;
  dateLabel: string;
  priceLabel: string;
}

export const HOME_HIGHLIGHTS = [
  "Trusted providers near your address",
  "Book in minutes and message in the same flow",
  "Live ETA, status updates, and repeat booking built in",
];

export const HOME_ADDRESS_FIXTURES: HomeAddressFixture[] = [
  {
    id: "address-home",
    label: "Home",
    value: "Sandton City, 83 Rivonia Road, Sandhurst, Sandton",
    note: "Main Rivonia Road entrance",
    area: "Sandton",
    lat: -26.1073,
    lng: 28.0539,
  },
  {
    id: "address-office",
    label: "Office",
    value: "The Marc, 129 Rivonia Road, Sandown, Sandton",
    note: "Reception closes at 18:00",
    area: "Sandown",
    lat: -26.1052,
    lng: 28.0581,
  },
  {
    id: "address-weekend",
    label: "Weekend",
    value: "15 Tyrwhitt Avenue, Rosebank, Johannesburg",
    note: "Use the visitor parking on arrival",
    area: "Rosebank",
    lat: -26.1457,
    lng: 28.0413,
  },
  {
    id: "address-family",
    label: "Family",
    value: "Lonehill Boulevard, Lone Hill, Sandton",
    note: "Gate code available in notes",
    area: "Lone Hill",
    lat: -26.0116,
    lng: 28.0154,
  },
];

export const HOME_SERVICE_FIXTURES: HomeServiceFixture[] = [
  {
    id: "home-service-1",
    providerId: "sample-provider-plumbing",
    providerName: "Mpho Flow Fix",
    title: "Emergency plumbing",
    subtitle: "Leaks, geysers, and urgent repairs",
    description:
      "Burst pipes, blocked drains, and hot water callouts with quick response and visible job updates.",
    category: "Plumbing",
    badge: "Most booked",
    priceLabel: "From R420",
    accent: "from-cyan-300 via-sky-400 to-blue-700",
    rating: 4.9,
    reviews: 248,
    neighborhood: "Midrand",
    lat: -25.9992,
    lng: 28.1263,
    tags: ["Urgent", "Verified", "Warranty"],
    availableNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "home-service-2",
    providerId: "sample-provider-electrical",
    providerName: "Nandi Spark Works",
    title: "Backup power installs",
    subtitle: "Generator and inverter support",
    description:
      "Power changeovers, diagnostics, and same-week electrical support for homes and small offices.",
    category: "Electrical",
    badge: "Top rated",
    priceLabel: "From R650",
    accent: "from-amber-200 via-orange-400 to-rose-600",
    rating: 4.8,
    reviews: 191,
    neighborhood: "Sandton",
    lat: -26.1073,
    lng: 28.0539,
    tags: ["Verified", "Weekends", "Fast quote"],
    availableNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "home-service-3",
    providerId: "sample-provider-cleaning",
    providerName: "Fresh Fold Crew",
    title: "Move-out deep clean",
    subtitle: "Same-day home reset",
    description:
      "Turnover cleans, recurring home refreshes, and one-off deep cleaning with crew coordination in chat.",
    category: "Cleaning",
    badge: "Crew favorite",
    priceLabel: "From R360",
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    rating: 4.7,
    reviews: 164,
    neighborhood: "Rosebank",
    lat: -26.1457,
    lng: 28.0413,
    tags: ["Eco", "Same-day", "Repeatable"],
    availableNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-2364de5c7b07?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "home-service-4",
    providerId: "sample-provider-hvac",
    providerName: "Heatwave HVAC Co",
    title: "Office AC tune-up",
    subtitle: "Cooling, airflow, and service plans",
    description:
      "Split-unit cleaning, airflow balancing, and recurring maintenance for homes and workspaces.",
    category: "HVAC",
    badge: "Fast arrival",
    priceLabel: "From R540",
    accent: "from-fuchsia-400 via-rose-500 to-orange-600",
    rating: 4.8,
    reviews: 176,
    neighborhood: "Fourways",
    lat: -26.0018,
    lng: 28.0178,
    tags: ["Commercial", "Home", "Preventive"],
    availableNow: true,
    imageUrl:
      "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=900&q=80",
  },
];

export const HOME_BOOKING_FIXTURES: HomeBookingFixture[] = [
  {
    id: "home-booking-1",
    service: "Burst geyser repair",
    provider: "Mpho Flow Fix",
    statusLabel: "Arriving",
    etaLabel: "11 min",
    scheduledLabel: "Today, 10:00",
    address: "Sandton City, 83 Rivonia Road, Sandhurst, Sandton",
    progress: 74,
  },
  {
    id: "home-booking-2",
    service: "Move-out deep clean",
    provider: "Fresh Fold Crew",
    statusLabel: "Scheduled",
    etaLabel: "Tomorrow",
    scheduledLabel: "Tomorrow, 08:30",
    address: "15 Tyrwhitt Avenue, Rosebank, Johannesburg",
    progress: 38,
  },
  {
    id: "home-booking-3",
    service: "Generator changeover",
    provider: "Nandi Spark Works",
    statusLabel: "In progress",
    etaLabel: "On-site",
    scheduledLabel: "Today, 13:15",
    address: "The Marc, 129 Rivonia Road, Sandown, Sandton",
    progress: 88,
  },
];

export const HOME_ORDER_HISTORY_FIXTURES: HomeOrderHistoryFixture[] = [
  {
    id: "history-1",
    title: "Carpet refresh",
    provider: "Fresh Fold Crew",
    dateLabel: "Tue 4 Mar",
    priceLabel: "R520",
  },
  {
    id: "history-2",
    title: "Ceiling fan install",
    provider: "Nandi Spark Works",
    dateLabel: "Fri 28 Feb",
    priceLabel: "R780",
  },
  {
    id: "history-3",
    title: "Pressure wash",
    provider: "Greenline Gardens",
    dateLabel: "Sun 16 Feb",
    priceLabel: "R690",
  },
];
