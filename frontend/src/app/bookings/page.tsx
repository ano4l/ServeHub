"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { cn } from "@/lib/utils";

type BookingStatus = "in_progress" | "confirmed" | "requested" | "completed" | "cancelled";

interface MockBooking {
  id: string;
  service: string;
  provider: string;
  providerInitial: string;
  status: BookingStatus;
  date: string;
  time: string;
  address: string;
  price: string;
  rating: number;
  reviews: number;
  progress: number;
  eta?: string;
  providerPhone?: string;
  category: string;
  imageUrl: string;
}

const MOCK_BOOKINGS: MockBooking[] = [
  {
    id: "BK-001",
    service: "Emergency plumbing repair",
    provider: "Mpho Flow Fix",
    providerInitial: "M",
    status: "in_progress",
    date: "Today",
    time: "14:00",
    address: "83 Rivonia Road, Sandton",
    price: "R420",
    rating: 4.9,
    reviews: 248,
    progress: 65,
    eta: "Arriving in 12 min",
    providerPhone: "+27 83 123 4567",
    category: "Plumbing",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "BK-002",
    service: "Move-out deep clean",
    provider: "Fresh Fold Crew",
    providerInitial: "F",
    status: "confirmed",
    date: "Tomorrow",
    time: "09:00",
    address: "15 Tyrwhitt Avenue, Rosebank",
    price: "R360",
    rating: 4.7,
    reviews: 164,
    progress: 40,
    eta: "Confirmed for 9:00 AM",
    category: "Cleaning",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-2364de5c7b07?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "BK-003",
    service: "Backup power install",
    provider: "Nandi Spark Works",
    providerInitial: "N",
    status: "requested",
    date: "18 Mar",
    time: "10:00",
    address: "The Marc, Sandton",
    price: "R650",
    rating: 4.8,
    reviews: 92,
    progress: 15,
    eta: "Awaiting confirmation",
    category: "Electrical",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "BK-004",
    service: "Garden maintenance",
    provider: "GreenThumb SA",
    providerInitial: "G",
    status: "completed",
    date: "12 Mar",
    time: "08:00",
    address: "22 Jan Smuts Ave, Rosebank",
    price: "R280",
    rating: 4.6,
    reviews: 78,
    progress: 100,
    category: "Gardening",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "BK-005",
    service: "Interior wall repaint",
    provider: "ColourCraft Pro",
    providerInitial: "C",
    status: "completed",
    date: "8 Mar",
    time: "07:00",
    address: "10 Oxford Road, Parktown",
    price: "R1,200",
    rating: 4.9,
    reviews: 156,
    progress: 100,
    category: "Painting",
    imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "BK-006",
    service: "Aircon service",
    provider: "CoolAir Solutions",
    providerInitial: "C",
    status: "cancelled",
    date: "5 Mar",
    time: "11:00",
    address: "Melrose Arch, Johannesburg",
    price: "R450",
    rating: 4.5,
    reviews: 43,
    progress: 0,
    category: "HVAC",
    imageUrl: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=400&q=80",
  },
];

function getStatusConfig(status: BookingStatus) {
  switch (status) {
    case "in_progress":
      return { label: "In Progress", color: "bg-blue-400/15 text-blue-200 border-blue-400/30", icon: Navigation, dot: "bg-blue-400" };
    case "confirmed":
      return { label: "Confirmed", color: "bg-green-400/15 text-green-200 border-green-400/30", icon: CheckCircle2, dot: "bg-green-400" };
    case "requested":
      return { label: "Pending", color: "bg-amber-400/15 text-amber-200 border-amber-400/30", icon: Clock, dot: "bg-amber-400" };
    case "completed":
      return { label: "Completed", color: "bg-white/8 text-white/55 border-white/15", icon: CheckCircle2, dot: "bg-white/40" };
    case "cancelled":
      return { label: "Cancelled", color: "bg-red-400/15 text-red-200 border-red-400/30", icon: XCircle, dot: "bg-red-400" };
  }
}

export default function BookingsPage() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>("BK-001");

  const activeBookings = MOCK_BOOKINGS.filter((b) =>
    ["in_progress", "confirmed", "requested"].includes(b.status),
  );
  const pastBookings = MOCK_BOOKINGS.filter((b) =>
    ["completed", "cancelled"].includes(b.status),
  );
  const liveBooking = activeBookings.find((b) => b.status === "in_progress");

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-4 sm:px-6">
        {/* Header */}
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/45">Bookings</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Your appointments
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {activeBookings.length} active · {MOCK_BOOKINGS.length} total
          </p>
        </div>

        {/* ─── Live booking hero (Uber-style) ─── */}
        {liveBooking && (() => {
          const config = getStatusConfig(liveBooking.status);
          return (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/8 to-blue-600/8 backdrop-blur-md">
              {/* Image banner */}
              <div className="relative h-24 overflow-hidden">
                <img src={liveBooking.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1525] via-[#0a1525]/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold">{liveBooking.service}</p>
                    <p className="text-xs text-white/50">{liveBooking.provider}</p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold", config.color)}>
                    {config.label}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {/* Live ETA */}
                <div className="flex items-center gap-2 text-cyan-200">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                  </div>
                  <span className="text-sm font-medium">{liveBooking.eta}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 rounded-full bg-white/8">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                    style={{ width: `${liveBooking.progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/30">
                  <span>Requested</span>
                  <span>On the way</span>
                  <span>Arrived</span>
                  <span>Done</span>
                </div>

                {/* Quick actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push("/bookings/confirmation")}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold text-slate-950 active:scale-95 transition-all"
                  >
                    <Navigation className="h-4 w-4" />
                    Track
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 active:scale-95 transition-all">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 active:scale-95 transition-all">
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── Active / Upcoming section ─── */}
        {activeBookings.filter((b) => b.status !== "in_progress").length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15">
                <CalendarCheck2 className="h-3 w-3 text-cyan-300" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-white/60">
                Upcoming
              </h2>
              <div className="flex-1 h-px bg-white/6" />
            </div>
            <div className="space-y-3">
              {activeBookings
                .filter((b) => b.status !== "in_progress")
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    expanded={expandedId === booking.id}
                    onToggle={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    onAction={(action) => handleAction(router, booking, action)}
                  />
                ))}
            </div>
          </section>
        )}

        {/* ─── Past section ─── */}
        {pastBookings.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8">
                <Clock className="h-3 w-3 text-white/40" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-white/40">
                Past
              </h2>
              <div className="flex-1 h-px bg-white/6" />
            </div>
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  expanded={expandedId === booking.id}
                  onToggle={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                  onAction={(action) => handleAction(router, booking, action)}
                  dimmed
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {MOCK_BOOKINGS.length === 0 && (
          <div className="mt-12 rounded-[24px] border border-dashed border-white/10 bg-white/3 p-10 text-center">
            <CalendarCheck2 className="mx-auto h-10 w-10 text-white/15" />
            <p className="mt-3 font-medium text-white/60">No bookings yet</p>
            <p className="mt-1 text-sm text-white/30">
              Book a service to get started
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-950 active:scale-95 transition-all"
            >
              Browse services
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Booking Card Component ─── */
function BookingCard({
  booking,
  expanded,
  onToggle,
  onAction,
  dimmed,
}: {
  booking: MockBooking;
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: "details" | "rebook" | "chat" | "rate") => void;
  dimmed?: boolean;
}) {
  const config = getStatusConfig(booking.status);
  const isActive = ["in_progress", "confirmed", "requested"].includes(booking.status);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full overflow-hidden rounded-[20px] border text-left transition-all active:scale-[0.98]",
        expanded
          ? "border-white/12 bg-white/6 backdrop-blur-sm"
          : "border-white/6 bg-white/3 hover:bg-white/5",
        dimmed && "opacity-75 hover:opacity-100",
      )}
    >
      {/* Card with image */}
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="relative h-auto w-20 flex-shrink-0 overflow-hidden sm:w-24">
          <img
            src={booking.imageUrl}
            alt=""
            className={cn("h-full w-full object-cover", dimmed && "grayscale-[40%]")}
          />
          {/* Status dot overlay */}
          <div className="absolute top-2 left-2">
            <div className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-[#0a1525]", config.dot)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{booking.service}</p>
              <p className="text-xs text-white/45 mt-0.5 truncate">{booking.provider}</p>
            </div>
            <span className={cn("flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", config.color)}>
              {config.label}
            </span>
          </div>

          {/* Progress bar for active */}
          {isActive && (
            <div className="mt-2.5 h-1 rounded-full bg-white/8">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                style={{ width: `${booking.progress}%` }}
              />
            </div>
          )}

          {/* Meta row */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-white/35">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.date} · {booking.time}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                {booking.rating}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/70">{booking.price}</span>
              <ChevronRight className={cn("h-3.5 w-3.5 text-white/25 transition-transform", expanded && "rotate-90")} />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-white/6 px-4 py-3.5 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-cyan-300/70 mt-0.5 flex-shrink-0" />
            <span className="text-white/55 text-xs">{booking.address}</span>
          </div>
          {booking.eta && (
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-cyan-300/70 flex-shrink-0" />
              <span className="text-white/55 text-xs">{booking.eta}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {isActive && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction("details"); }}
                  className="flex-1 rounded-full bg-white/8 px-4 py-2 text-xs font-medium text-white hover:bg-white/12 active:scale-95 transition-all"
                >
                  View details
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction("chat"); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:bg-white/8 active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {booking.status === "completed" && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction("rebook"); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-xs font-medium text-white hover:bg-white/12 active:scale-95 transition-all"
                >
                  <RotateCcw className="h-3 w-3" />
                  Rebook
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction("rate"); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-amber-300/70 hover:bg-white/8 active:scale-95"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {booking.status === "cancelled" && (
              <button
                onClick={(e) => { e.stopPropagation(); onAction("rebook"); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-xs font-medium text-white hover:bg-white/12 active:scale-95 transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Book again
              </button>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

/* ─── Action handler ─── */
function handleAction(
  router: ReturnType<typeof useRouter>,
  booking: MockBooking,
  action: "details" | "rebook" | "chat" | "rate",
) {
  switch (action) {
    case "details":
      router.push("/bookings/confirmation");
      break;
    case "rebook": {
      const data = {
        provider: booking.provider,
        service: booking.service,
        category: booking.category,
        price: booking.price,
        imageUrl: booking.imageUrl,
      };
      sessionStorage.setItem("bookingData", JSON.stringify(data));
      router.push("/book");
      break;
    }
    case "chat":
    case "rate":
      break;
  }
}
