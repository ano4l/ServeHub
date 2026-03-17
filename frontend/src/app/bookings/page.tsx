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
  AlertCircle,
  RotateCcw,
  Filter,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  },
];

const STATUS_FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "Active" },
  { value: "confirmed", label: "Upcoming" },
  { value: "requested", label: "Pending" },
  { value: "completed", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

function getStatusConfig(status: BookingStatus) {
  switch (status) {
    case "in_progress":
      return {
        label: "In Progress",
        color: "bg-blue-400/15 text-blue-200 border-blue-400/30",
        icon: Navigation,
        gradient: "from-blue-500 to-cyan-500",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        color: "bg-green-400/15 text-green-200 border-green-400/30",
        icon: CheckCircle2,
        gradient: "from-green-500 to-emerald-500",
      };
    case "requested":
      return {
        label: "Requested",
        color: "bg-amber-400/15 text-amber-200 border-amber-400/30",
        icon: Clock,
        gradient: "from-amber-500 to-orange-500",
      };
    case "completed":
      return {
        label: "Completed",
        color: "bg-white/10 text-white/70 border-white/20",
        icon: CheckCircle2,
        gradient: "from-gray-500 to-gray-600",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "bg-red-400/15 text-red-200 border-red-400/30",
        icon: XCircle,
        gradient: "from-red-500 to-rose-500",
      };
  }
}

export default function BookingsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>("BK-001");

  const filteredBookings =
    filter === "all" ? MOCK_BOOKINGS : MOCK_BOOKINGS.filter((b) => b.status === filter);

  const activeBookings = MOCK_BOOKINGS.filter((b) =>
    ["in_progress", "confirmed", "requested"].includes(b.status),
  );

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-4 sm:px-6">
        {/* Header */}
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Bookings</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Your appointments
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {activeBookings.length} active · {MOCK_BOOKINGS.length} total
          </p>
        </div>

        {/* Filters */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "min-h-[40px] whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all active:scale-95",
                filter === f.value
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Active booking hero (Uber-style live card) */}
        {filter === "all" && activeBookings.length > 0 && (
          <div className="mt-6">
            {activeBookings
              .filter((b) => b.status === "in_progress")
              .map((booking) => {
                const config = getStatusConfig(booking.status);
                return (
                  <div
                    key={booking.id}
                    className="rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-lg font-bold`}>
                          {booking.providerInitial}
                        </div>
                        <div>
                          <p className="font-semibold">{booking.service}</p>
                          <p className="text-sm text-white/60">{booking.provider}</p>
                        </div>
                      </div>
                      <Badge className={cn("rounded-full text-xs", config.color)}>
                        {config.label}
                      </Badge>
                    </div>

                    {/* Live ETA */}
                    <div className="mt-4 flex items-center gap-2 text-cyan-200">
                      <Navigation className="h-4 w-4" />
                      <span className="text-sm font-medium">{booking.eta}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>

                    {/* Quick actions */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full bg-white text-slate-950 hover:bg-white/90 active:scale-95"
                        onClick={() => router.push(`/bookings/confirmation`)}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Track
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-white/20 text-white hover:bg-white/10 active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-white/20 text-white hover:bg-white/10 active:scale-95"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Booking list */}
        <div className="mt-6 space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-white/5 p-8 text-center">
              <CalendarCheck2 className="mx-auto h-10 w-10 text-white/20" />
              <p className="mt-3 font-medium text-white/70">No bookings found</p>
              <p className="mt-1 text-sm text-white/40">
                Try a different filter or book a new service.
              </p>
              <Button
                className="mt-4 rounded-full"
                onClick={() => router.push("/explore")}
              >
                Browse services
              </Button>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const config = getStatusConfig(booking.status);
              const StatusIcon = config.icon;
              const isExpanded = expandedId === booking.id;
              const isActive = ["in_progress", "confirmed", "requested"].includes(
                booking.status,
              );

              // Skip the in_progress hero card from the list when showing all
              if (filter === "all" && booking.status === "in_progress") return null;

              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className={cn(
                    "w-full rounded-[20px] border p-4 text-left transition-all active:scale-[0.98]",
                    isExpanded
                      ? "border-white/15 bg-white/8 backdrop-blur-md"
                      : "border-white/8 bg-white/4 hover:bg-white/6",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-11 w-11 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold",
                          `bg-gradient-to-br ${config.gradient}`,
                        )}
                      >
                        {booking.providerInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{booking.service}</p>
                        <p className="text-sm text-white/55 truncate">{booking.provider}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={cn("rounded-full text-[11px]", config.color)}>
                        {config.label}
                      </Badge>
                      <span className="text-sm font-medium text-white/80">{booking.price}</span>
                    </div>
                  </div>

                  {/* Progress bar for active bookings */}
                  {isActive && (
                    <div className="mt-3 h-1.5 rounded-full bg-white/10">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", `bg-gradient-to-r ${config.gradient}`)}
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Collapsed info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.date} · {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-amber-300" />
                        {booking.rating}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                        <span className="text-white/70">{booking.address}</span>
                      </div>
                      {booking.eta && (
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-cyan-300 flex-shrink-0" />
                          <span className="text-white/70">{booking.eta}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        {isActive && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 rounded-full bg-white/10 text-white hover:bg-white/15 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push("/bookings/confirmation");
                              }}
                            >
                              View details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-white/15 text-white/70 hover:bg-white/10 active:scale-95"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === "completed" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 rounded-full bg-white/10 text-white hover:bg-white/15 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                const bookingData = {
                                  provider: booking.provider,
                                  service: booking.service,
                                  category: booking.category,
                                  price: booking.price,
                                };
                                sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
                                router.push("/book");
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Rebook
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-white/15 text-white/70 hover:bg-white/10 active:scale-95"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === "cancelled" && (
                          <Button
                            size="sm"
                            className="flex-1 rounded-full bg-white/10 text-white hover:bg-white/15 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              const bookingData = {
                                provider: booking.provider,
                                service: booking.service,
                                category: booking.category,
                                price: booking.price,
                              };
                              sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
                              router.push("/book");
                            }}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Book again
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
