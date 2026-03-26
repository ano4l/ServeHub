"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RotateCcw,
  Star,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { bookingsApi, type BookingListItem } from "@/lib/api";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";

function statusConfig(status: BookingListItem["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return { label: "In progress", color: "bg-blue-400/15 text-blue-200 border-blue-400/30", dot: "bg-blue-400" };
    case "ACCEPTED":
      return { label: "Confirmed", color: "bg-green-400/15 text-green-200 border-green-400/30", dot: "bg-green-400" };
    case "REQUESTED":
      return { label: "Pending", color: "bg-amber-400/15 text-amber-200 border-amber-400/30", dot: "bg-amber-400" };
    case "COMPLETED":
    case "REVIEWABLE":
      return { label: "Completed", color: "bg-white/8 text-white/55 border-white/15", dot: "bg-white/40" };
    case "DECLINED":
    case "CANCELLED":
      return { label: "Cancelled", color: "bg-red-400/15 text-red-200 border-red-400/30", dot: "bg-red-400" };
    case "EXPIRED":
    default:
      return { label: "Closed", color: "bg-white/8 text-white/55 border-white/15", dot: "bg-white/40" };
  }
}

function bookingProgress(status: BookingListItem["status"]) {
  switch (status) {
    case "REQUESTED":
      return 18;
    case "ACCEPTED":
      return 46;
    case "IN_PROGRESS":
      return 74;
    case "COMPLETED":
    case "REVIEWABLE":
      return 100;
    default:
      return 0;
  }
}

function isActiveBooking(status: BookingListItem["status"]) {
  return status === "REQUESTED" || status === "ACCEPTED" || status === "IN_PROGRESS";
}

function toServiceItem(booking: BookingListItem) {
  return {
    id: Number(booking.serviceOfferingId.replace(/[^\d]/g, "")) || Number(booking.id),
    name: booking.service,
    categoryId: booking.serviceCategory?.toLowerCase().replace(/\s+/g, "-") || "demo-service",
    imageUrl: booking.imageUrl || "",
    description: booking.notes || `Rebook ${booking.service}`,
    priceRange: booking.price ? formatCurrency(booking.price) : "Quote pending",
    duration: booking.estimatedDuration || "1-2 hrs",
    rating: booking.providerRating || 4.8,
  };
}

function formatPhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export default function BookingsPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const addItem = useCartStore((state) => state.addItem);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingsApi.getAll({ size: 24 });
      const items = response.data.content ?? [];
      setBookings(items);
      setExpandedId((current) => current ?? items[0]?.id ?? null);
    } catch {
      addToast({ type: "error", message: "We couldn't load your demo bookings." });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => isActiveBooking(booking.status)),
    [bookings],
  );
  const pastBookings = useMemo(
    () => bookings.filter((booking) => !isActiveBooking(booking.status)),
    [bookings],
  );
  const liveBooking = activeBookings.find((booking) => booking.status === "IN_PROGRESS") ?? activeBookings[0] ?? null;

  const handleAction = async (booking: BookingListItem, action: "details" | "rebook" | "chat" | "call" | "rate") => {
    if (action === "details") {
      router.push(`/bookings/confirmation?id=${booking.id}`);
      return;
    }

    if (action === "chat") {
      router.push(`/dashboard/bookings?booking=${booking.id}`);
      return;
    }

    if (action === "call") {
      if (!booking.providerPhone) {
        addToast({ type: "info", message: "No demo phone number is available for this provider yet." });
        return;
      }

      window.location.href = `tel:${formatPhoneNumber(booking.providerPhone)}`;
      return;
    }

    if (action === "rebook") {
      addItem(toServiceItem(booking));
      addToast({ type: "success", message: `${booking.service} added back to your cart.` });
      router.push("/book");
      return;
    }

    const rating = window.prompt("How many stars would you give this service? (1-5)", "5");
    if (!rating) {
      return;
    }

    const feedback = window.prompt("Any short feedback to save with this demo booking?", "Fast, professional, and easy to book.");
    addToast({
      type: "success",
      message: feedback
        ? `Thanks. Your ${rating}-star demo review was captured.`
        : `Thanks. Your ${rating}-star demo review was captured.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-4 sm:px-6">
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/45">Bookings</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Your appointments</h1>
          <p className="mt-1 text-sm text-white/40">
            {activeBookings.length} active · {bookings.length} total
          </p>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[24px] border border-white/8 bg-white/5" />
            ))}
          </div>
        ) : (
          <>
            {liveBooking ? (
              <div className="mt-6 overflow-hidden rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/8 to-blue-600/8 backdrop-blur-md">
                <div className="relative h-24 overflow-hidden">
                  {liveBooking.imageUrl ? (
                    <img src={liveBooking.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-cyan-500/30 to-blue-600/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1525] via-[#0a1525]/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{liveBooking.service}</p>
                      <p className="truncate text-xs text-white/50">{liveBooking.provider.name}</p>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold", statusConfig(liveBooking.status).color)}>
                      {statusConfig(liveBooking.status).label}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <div className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-sm font-medium">{formatDateTime(liveBooking.scheduledAt)}</span>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-white/8">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                      style={{ width: `${bookingProgress(liveBooking.status)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-white/30">
                    <span>Requested</span>
                    <span>Confirmed</span>
                    <span>On-site</span>
                    <span>Done</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => void handleAction(liveBooking, "details")}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold text-slate-950 active:scale-95 transition-all"
                    >
                      <Navigation className="h-4 w-4" />
                      Track
                    </button>
                    <button
                      onClick={() => void handleAction(liveBooking, "chat")}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void handleAction(liveBooking, "call")}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 active:scale-95 transition-all"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeBookings.filter((booking) => booking.id !== liveBooking?.id).length > 0 ? (
              <section className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15">
                    <CalendarCheck2 className="h-3 w-3 text-cyan-300" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Upcoming</h2>
                  <div className="h-px flex-1 bg-white/6" />
                </div>
                <div className="space-y-3">
                  {activeBookings
                    .filter((booking) => booking.id !== liveBooking?.id)
                    .map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        expanded={expandedId === booking.id}
                        onToggle={() => setExpandedId((current) => (current === booking.id ? null : booking.id))}
                        onAction={(action) => void handleAction(booking, action)}
                      />
                    ))}
                </div>
              </section>
            ) : null}

            {pastBookings.length > 0 ? (
              <section className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8">
                    <Clock className="h-3 w-3 text-white/40" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">Past</h2>
                  <div className="h-px flex-1 bg-white/6" />
                </div>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      expanded={expandedId === booking.id}
                      onToggle={() => setExpandedId((current) => (current === booking.id ? null : booking.id))}
                      onAction={(action) => void handleAction(booking, action)}
                      dimmed
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {bookings.length === 0 ? (
              <div className="mt-12 rounded-[24px] border border-dashed border-white/10 bg-white/3 p-10 text-center">
                <CalendarCheck2 className="mx-auto h-10 w-10 text-white/15" />
                <p className="mt-3 font-medium text-white/60">No bookings yet</p>
                <p className="mt-1 text-sm text-white/30">Book a service to get started</p>
                <button
                  onClick={() => router.push("/explore")}
                  className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-950 active:scale-95 transition-all"
                >
                  Browse services
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  expanded,
  onToggle,
  onAction,
  dimmed,
}: {
  booking: BookingListItem;
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: "details" | "rebook" | "chat" | "call" | "rate") => void;
  dimmed?: boolean;
}) {
  const config = statusConfig(booking.status);
  const active = isActiveBooking(booking.status);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full overflow-hidden rounded-[20px] border text-left transition-all active:scale-[0.98]",
        expanded ? "border-white/12 bg-white/6 backdrop-blur-sm" : "border-white/6 bg-white/3 hover:bg-white/5",
        dimmed && "opacity-75 hover:opacity-100",
      )}
    >
      <div className="flex gap-0">
        <div className="relative h-auto w-20 flex-shrink-0 overflow-hidden sm:w-24">
          {booking.imageUrl ? (
            <img src={booking.imageUrl} alt="" className={cn("h-full w-full object-cover", dimmed && "grayscale-[40%]")} />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-cyan-500/30 to-blue-700/30" />
          )}
          <div className="absolute left-2 top-2">
            <div className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-[#0a1525]", config.dot)} />
          </div>
        </div>

        <div className="min-w-0 flex-1 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{booking.service}</p>
              <p className="mt-0.5 truncate text-xs text-white/45">{booking.provider.name}</p>
            </div>
            <span className={cn("flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", config.color)}>
              {config.label}
            </span>
          </div>

          {active ? (
            <div className="mt-2.5 h-1 rounded-full bg-white/8">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                style={{ width: `${bookingProgress(booking.status)}%` }}
              />
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-white/35">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(booking.scheduledAt)}
              </span>
              {booking.providerRating ? (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  {booking.providerRating.toFixed(1)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/70">
                {booking.price ? formatCurrency(booking.price) : "Quote pending"}
              </span>
              <ChevronRight className={cn("h-3.5 w-3.5 text-white/25 transition-transform", expanded && "rotate-90")} />
            </div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-white/6 px-4 py-3.5">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300/70" />
            <span className="text-xs text-white/55">{booking.address}</span>
          </div>
          {booking.estimatedDuration ? (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 flex-shrink-0 text-cyan-300/70" />
              <span className="text-xs text-white/55">{booking.estimatedDuration}</span>
            </div>
          ) : null}
          <div className="flex gap-2 pt-1">
            {active ? (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("details");
                  }}
                  className="flex-1 rounded-full bg-white/8 px-4 py-2 text-xs font-medium text-white hover:bg-white/12 active:scale-95 transition-all"
                >
                  View details
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("chat");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:bg-white/8 active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("call");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:bg-white/8 active:scale-95"
                >
                  <Phone className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}

            {booking.status === "COMPLETED" || booking.status === "REVIEWABLE" ? (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("rebook");
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-xs font-medium text-white hover:bg-white/12 active:scale-95 transition-all"
                >
                  <RotateCcw className="h-3 w-3" />
                  Rebook
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction("rate");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-amber-300/70 hover:bg-white/8 active:scale-95"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}

            {booking.status === "CANCELLED" || booking.status === "DECLINED" ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onAction("rebook");
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-xs font-medium text-white hover:bg-white/12 active:scale-95 transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Book again
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </button>
  );
}
