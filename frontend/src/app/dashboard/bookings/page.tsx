"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CircleSlash,
  Clock3,
  MapPin,
  ReceiptText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import {
  BookingStatusBadge,
  BookingStatusStepper,
} from "@/components/booking/BookingStatusStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { bookingsApi, type BookingListItem } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

const FILTERS = [
  "ALL",
  "REQUESTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const;

type BookingFilter = typeof FILTERS[number];

interface BookingEventItem {
  id: string;
  eventType: string;
  detail: string;
  occurredAt: string;
}

async function fetchCustomerBookings() {
  const response = await bookingsApi.getAll();
  return response.data.content ?? [];
}

export default function CustomerBookingsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBookingEvents, setSelectedBookingEvents] = useState<BookingEventItem[]>([]);
  const [filter, setFilter] = useState<BookingFilter>("ALL");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await fetchCustomerBookings());
    } catch {
      addToast({ type: "error", message: "We couldn't load your bookings." });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((booking) => booking.status === filter);

  useEffect(() => {
    if (!filteredBookings.length) {
      setSelectedBookingId(null);
      return;
    }

    if (
      !selectedBookingId ||
      !filteredBookings.some((booking) => booking.id === selectedBookingId)
    ) {
      setSelectedBookingId(filteredBookings[0].id);
    }
  }, [filteredBookings, selectedBookingId]);

  const selectedBooking =
    filteredBookings.find((booking) => booking.id === selectedBookingId) ?? null;

  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedBooking) {
        setSelectedBookingEvents([]);
        return;
      }

      setEventLoading(true);
      try {
        const response = await bookingsApi.getEvents(selectedBooking.id);
        setSelectedBookingEvents(
          (response.data ?? []).map((item: BookingEventItem) => ({
            id: String(item.id),
            eventType: item.eventType,
            detail: item.detail,
            occurredAt: item.occurredAt,
          })),
        );
      } catch {
        setSelectedBookingEvents([]);
      } finally {
        setEventLoading(false);
      }
    };

    void loadEvents();
  }, [selectedBooking]);

  const handleCancel = async () => {
    if (!selectedBooking) {
      return;
    }

    const reason = window.prompt(
      "Why are you cancelling this booking?",
      "My plans changed",
    );

    if (!reason) {
      return;
    }

    setActionLoading(true);
    try {
      await bookingsApi.cancel(selectedBooking.id, reason);
      addToast({ type: "success", message: "Booking cancelled." });
      await loadBookings();
    } catch {
      addToast({ type: "error", message: "We couldn't cancel this booking." });
    } finally {
      setActionLoading(false);
    }
  };

  const summary = {
    active: bookings.filter(
      (booking) =>
        booking.status === "REQUESTED" ||
        booking.status === "ACCEPTED" ||
        booking.status === "IN_PROGRESS",
    ).length,
    completed: bookings.filter((booking) => booking.status === "COMPLETED").length,
    cancelled: bookings.filter(
      (booking) => booking.status === "CANCELLED" || booking.status === "DECLINED",
    ).length,
  };

  return (
    <DashboardLayout requiredRole="CUSTOMER">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track job status, manage active requests, and message providers from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{summary.active} active</Badge>
            <Badge variant="success">{summary.completed} completed</Badge>
            <Badge variant="warning">{summary.cancelled} closed</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <button
                key={item}
                type="button"
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
              <CardTitle>Booking list</CardTitle>
              <CardDescription>
                Select a booking to view the timeline, location, and conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[24px] border border-white/65 bg-white/55"
                  />
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
                      type="button"
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_24px_36px_rgba(15,23,42,0.18)]"
                          : "border-white/65 bg-white/60 text-slate-900 hover:bg-white/82"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={booking.provider.name}
                          src={booking.provider.avatar}
                          size="md"
                          className={active ? "ring-2 ring-white/30" : ""}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate font-semibold">{booking.provider.name}</p>
                            <BookingStatusBadge status={booking.status} />
                          </div>
                          <p
                            className={`mt-1 text-sm ${
                              active ? "text-white/75" : "text-slate-500"
                            }`}
                          >
                            {booking.service}
                          </p>
                          <div
                            className={`mt-3 flex flex-wrap items-center gap-3 text-xs ${
                              active ? "text-white/70" : "text-slate-400"
                            }`}
                          >
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
                  {selectedBooking
                    ? "Review the current status, address, and booking timeline."
                    : "Choose a booking from the list to continue."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedBooking ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                    Pick a booking on the left to review it.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-white/65 bg-white/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                              {selectedBooking.service}
                            </h2>
                            <BookingStatusBadge status={selectedBooking.status} />
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Reference {selectedBooking.reference}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedBooking.price
                              ? formatCurrency(selectedBooking.price)
                              : "Quote pending"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(selectedBooking.scheduledAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <BookingStatusStepper status={selectedBooking.status} />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Provider
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Avatar
                            name={selectedBooking.provider.name}
                            src={selectedBooking.provider.avatar}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {selectedBooking.provider.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              Chat is linked below
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Location
                        </p>
                        <p className="mt-3 inline-flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          {selectedBooking.address}
                        </p>
                      </div>
                    </div>

                    {selectedBooking.notes ? (
                      <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Notes
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {selectedBooking.notes}
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Booking timeline
                        </p>
                        {selectedBookingEvents.length > 0 ? (
                          <Badge variant="outline">
                            <Clock3 className="h-3.5 w-3.5" />
                            {selectedBookingEvents.length} updates
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-3">
                        {eventLoading ? (
                          <div className="text-sm text-slate-500">Loading timeline...</div>
                        ) : selectedBookingEvents.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            No event history has been recorded for this booking yet.
                          </div>
                        ) : (
                          selectedBookingEvents.map((event) => (
                            <div key={event.id} className="rounded-[18px] bg-white/70 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-slate-900">
                                  {event.eventType.replaceAll("_", " ")}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {formatDateTime(event.occurredAt)}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {(selectedBooking.status === "REQUESTED" ||
                      selectedBooking.status === "ACCEPTED") && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          loading={actionLoading}
                          onClick={() => void handleCancel()}
                        >
                          <CircleSlash className="h-4 w-4" />
                          Cancel booking
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedBooking ? (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Booking chat</CardTitle>
                  <CardDescription>
                    Messages here stay attached to this booking thread.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[420px]">
                    <ChatWindow
                      bookingId={selectedBooking.id}
                      bookingRef={selectedBooking.reference}
                      otherParty={{
                        id: selectedBooking.provider.id,
                        name: selectedBooking.provider.name,
                        avatar: selectedBooking.provider.avatar,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
