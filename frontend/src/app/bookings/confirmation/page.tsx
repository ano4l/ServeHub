"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Check,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bookingsApi, type BookingListItem } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

function statusVariant(status: BookingListItem["status"]) {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "IN_PROGRESS":
      return "info";
    case "COMPLETED":
    case "REVIEWABLE":
      return "success";
    case "DECLINED":
    case "CANCELLED":
      return "danger";
    case "REQUESTED":
    default:
      return "warning";
  }
}

function statusLabel(status: BookingListItem["status"]) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (value) => value.toUpperCase());
}

function BookingConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingListItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const bookingId = searchParams.get("id");
        const response = bookingId
          ? await bookingsApi.getById(bookingId)
          : await bookingsApi.getAll({ size: 1 });

        if (cancelled) {
          return;
        }

        setBooking("content" in response.data ? response.data.content?.[0] ?? null : response.data);
      } catch {
        if (!cancelled) {
          setBooking(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleCopyReference = async () => {
    if (!booking) {
      return;
    }

    try {
      await navigator.clipboard.writeText(booking.reference);
      addToast({ type: "success", message: "Booking reference copied." });
    } catch {
      addToast({ type: "error", message: "We couldn't copy that reference." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
        <AppTabs />
        <div className="relative mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 pb-24 pt-8 sm:px-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
            <p className="mt-4 text-white/70">Loading your booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
        <AppTabs />
        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
          <div className="mt-10 text-center">
            <h1 className="text-2xl font-semibold">Booking not found</h1>
            <p className="mt-2 text-white/70">We couldn&apos;t find a saved demo booking for that reference.</p>
            <Button onClick={() => router.push("/book")} className="mt-6 bg-cyan-500 hover:bg-cyan-600">
              Book a service
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-400/20">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Booking saved</h1>
          <p className="mt-2 text-white/70">This appointment is being stored locally in your browser for demo walkthroughs.</p>
          <div className="mt-3">
            <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Card className="border-white/20 bg-white/5">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm text-white/50">Booking reference</p>
                <p className="font-mono text-lg font-semibold">{booking.reference}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyReference} className="text-white/70 hover:text-white">
                Copy
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/50">Service</p>
                  <p className="mt-1 text-xl font-semibold">{booking.service}</p>
                  <p className="mt-1 text-sm text-white/70">{booking.provider.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
                    {booking.serviceCategory ? <Badge variant="info">{booking.serviceCategory}</Badge> : null}
                    {booking.providerRating ? (
                      <span>
                        {booking.providerRating.toFixed(1)} stars
                        {booking.providerReviewCount ? ` (${booking.providerReviewCount} reviews)` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-cyan-100">
                    {booking.price ? formatCurrency(booking.price) : "Quote pending"}
                  </p>
                  <p className="mt-1 text-xs text-white/50">{booking.estimatedDuration ?? "Duration to be confirmed"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold">Schedule</h3>
              <div className="mt-3 flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium">{formatDateTime(booking.scheduledAt)}</p>
                  <p className="text-sm text-white/70">{statusLabel(booking.status)} appointment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold">Location</h3>
              <div className="mt-3 flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium">Service address</p>
                  <p className="text-sm text-white/70">{booking.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {booking.notes ? (
            <Card className="border-white/20 bg-white/5">
              <CardContent className="p-4">
                <h3 className="font-semibold">Notes</h3>
                <p className="mt-3 text-sm text-white/70">{booking.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-semibold">Contact</h3>
              <div className="mt-3 space-y-2">
                {booking.providerPhone ? (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm">{booking.providerPhone}</span>
                  </div>
                ) : null}
                {booking.providerEmail ? (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm">{booking.providerEmail}</span>
                  </div>
                ) : null}
                {user?.phone ? (
                  <div className="flex items-center gap-3 text-white/65">
                    <Phone className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm">Customer: {user.phone}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => router.push(`/dashboard/bookings?booking=${booking.id}`)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message provider
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/bookings")}
              className="border-white/35 text-white hover:bg-white/10"
            >
              View all bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="border-white/35 text-white hover:bg-white/10"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-4">
          <h4 className="font-medium text-yellow-100">Demo mode notes</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            <li>This booking is stored in local browser storage only.</li>
            <li>Provider status updates, messages, and cancellations persist on this device.</li>
            <li>You can create more appointments from the cart or provider profile pages.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
          <AppTabs />
          <div className="relative mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 pb-24 pt-8 sm:px-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
              <p className="mt-4 text-white/70">Loading your booking details...</p>
            </div>
          </div>
        </div>
      }
    >
      <BookingConfirmationContent />
    </Suspense>
  );
}
