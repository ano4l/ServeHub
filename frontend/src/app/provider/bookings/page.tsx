"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  Clock3,
  MapPin,
  PlayCircle,
  ReceiptText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { BookingStatusBadge } from "@/components/booking/BookingStatusStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { bookingsApi, type BookingListItem } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

const FILTERS = ["ALL", "REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "DECLINED", "CANCELLED"] as const;
type BookingFilter = typeof FILTERS[number];

async function fetchProviderBookings() {
  const res = await bookingsApi.getAll();
  return res.data.content ?? [];
}

export default function ProviderBookingsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingFilter>("ALL");

  const loadBookings = async () => {
    setLoading(true);
    try {
      setBookings(await fetchProviderBookings());
    } catch {
      addToast({ type: "error", message: "We couldn't load your provider bookings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const status = new URLSearchParams(window.location.search).get("status")?.toUpperCase() as BookingFilter | null;
    if (status && FILTERS.includes(status)) {
      setFilter(status);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        setBookings(await fetchProviderBookings());
      } catch {
        addToast({ type: "error", message: "We couldn't load your provider bookings." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [addToast]);

  const filteredBookings = filter === "ALL" ? bookings : bookings.filter((booking) => booking.status === filter);

  useEffect(() => {
    if (!filteredBookings.length) {
      setSelectedBookingId(null);
      return;
    }

    if (!selectedBookingId || !filteredBookings.some((booking) => booking.id === selectedBookingId)) {
      setSelectedBookingId(filteredBookings[0].id);
    }
  }, [filteredBookings, selectedBookingId]);

  const selectedBooking = filteredBookings.find((booking) => booking.id === selectedBookingId) ?? null;

  const handleAction = async (action: "accept" | "decline" | "start" | "complete" | "cancel") => {
    if (!selectedBooking) {
      return;
    }

    setActionLoading(action);
    try {
      if (action === "accept") {
        await bookingsApi.accept(selectedBooking.id);
      }

      if (action === "decline") {
        const reason = window.prompt("Why are you declining this booking?", "Unavailable at requested time");
        if (!reason) {
          setActionLoading(null);
          return;
        }
        await bookingsApi.decline(selectedBooking.id, reason);
      }

      if (action === "start") {
        await bookingsApi.start(selectedBooking.id);
      }

      if (action === "complete") {
        await bookingsApi.complete(selectedBooking.id);
      }

      if (action === "cancel") {
        const reason = window.prompt("Why are you cancelling this booking?", "Unexpected schedule conflict");
        if (!reason) {
          setActionLoading(null);
          return;
        }
        await bookingsApi.cancel(selectedBooking.id, reason);
      }

      addToast({ type: "success", message: "Booking updated successfully." });
      await loadBookings();
    } catch {
      addToast({ type: "error", message: "We couldn't update this booking right now." });
    } finally {
      setActionLoading(null);
    }
  };

  const summary = {
    requested: bookings.filter((booking) => booking.status === "REQUESTED").length,
    active: bookings.filter((booking) => booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS").length,
    completed: bookings.filter((booking) => booking.status === "COMPLETED").length,
  };

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Provider bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Review requests, update job status, and chat with customers from one board.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">{summary.requested} pending</Badge>
            <Badge variant="info">{summary.active} active</Badge>
            <Badge variant="success">{summary.completed} completed</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-white/70 bg-white/60 text-slate-600 hover:bg-white/85"
                }`}
              >
                {item === "ALL" ? "All" : item.replaceAll("_", " ")}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="min-h-[620px]">
            <CardHeader>
              <CardTitle>Booking queue</CardTitle>
              <CardDescription>Select a booking to see the full job brief and conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-[24px] border border-white/65 bg-white/55 animate-pulse" />
                ))
              ) : filteredBookings.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                  No bookings match this filter yet.
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const active = booking.id === selectedBookingId;
                  return (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_24px_36px_rgba(15,23,42,0.18)]"
                          : "border-white/65 bg-white/60 text-slate-900 hover:bg-white/82"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={booking.customer.name} size="md" className={active ? "ring-2 ring-white/30" : ""} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate font-semibold">{booking.customer.name}</p>
                            <BookingStatusBadge status={booking.status} />
                          </div>
                          <p className={`mt-1 text-sm ${active ? "text-white/75" : "text-slate-500"}`}>{booking.service}</p>
                          <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs ${active ? "text-white/70" : "text-slate-400"}`}>
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {formatDateTime(booking.scheduledAt)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <ReceiptText className="h-3.5 w-3.5" />
                              {booking.price ? formatCurrency(booking.price) : "Quote pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedBooking ? "Booking details" : "Select a booking"}</CardTitle>
                <CardDescription>
                  {selectedBooking ? "Everything you need before accepting or completing this job." : "Choose a booking from the queue to continue."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedBooking ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                    Pick a booking on the left to review it.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 rounded-[24px] border border-white/65 bg-white/60 p-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">{selectedBooking.service}</h2>
                          <BookingStatusBadge status={selectedBooking.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Reference {selectedBooking.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedBooking.price ? formatCurrency(selectedBooking.price) : "Quote pending"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(selectedBooking.scheduledAt)}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer</p>
                        <div className="mt-3 flex items-center gap-3">
                          <Avatar name={selectedBooking.customer.name} size="md" />
                          <div>
                            <p className="font-semibold text-slate-900">{selectedBooking.customer.name}</p>
                            <p className="text-sm text-slate-500">Chat is linked below</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Location</p>
                        <p className="mt-3 inline-flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          {selectedBooking.address}
                        </p>
                      </div>
                    </div>

                    {selectedBooking.notes && (
                      <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer notes</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{selectedBooking.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.status === "REQUESTED" && (
                        <>
                          <Button loading={actionLoading === "accept"} onClick={() => void handleAction("accept")}>
                            <CheckCircle2 className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button variant="outline" loading={actionLoading === "decline"} onClick={() => void handleAction("decline")}>
                            <CircleSlash className="h-4 w-4" />
                            Decline
                          </Button>
                        </>
                      )}

                      {selectedBooking.status === "ACCEPTED" && (
                        <>
                          <Button loading={actionLoading === "start"} onClick={() => void handleAction("start")}>
                            <PlayCircle className="h-4 w-4" />
                            Start job
                          </Button>
                          <Button variant="outline" loading={actionLoading === "cancel"} onClick={() => void handleAction("cancel")}>
                            Cancel
                          </Button>
                        </>
                      )}

                      {selectedBooking.status === "IN_PROGRESS" && (
                        <Button loading={actionLoading === "complete"} onClick={() => void handleAction("complete")}>
                          <CheckCircle2 className="h-4 w-4" />
                          Mark complete
                        </Button>
                      )}

                      <Badge variant="outline" className="ml-auto px-3 py-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        Live booking thread
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedBooking && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Booking chat</CardTitle>
                  <CardDescription>Messages sent here are tied directly to this booking.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[420px]">
                    <ChatWindow
                      bookingId={selectedBooking.id}
                      bookingRef={selectedBooking.reference}
                      otherParty={{
                        id: selectedBooking.customer.id,
                        name: selectedBooking.customer.name,
                        avatar: selectedBooking.customer.avatar,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
