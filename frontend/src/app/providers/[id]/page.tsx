"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  bookingsApi,
  customerApi,
  providersApi,
  reviewsApi,
  type CustomerAddressItem,
  type ProviderProfileItem,
  type ServiceOfferingItem,
} from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

interface ReviewItem {
  id: number;
  bookingId: number;
  customerId: number;
  customerName: string;
  providerId: number;
  rating: number;
  qualityRating?: number;
  punctualityRating?: number;
  professionalismRating?: number;
  comment?: string;
  providerResponse?: string;
  createdAt: string;
}

function getDefaultBookingDate() {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

export default function ProviderProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  const providerId = params.id;

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [provider, setProvider] = useState<ProviderProfileItem | null>(null);
  const [offerings, setOfferings] = useState<ServiceOfferingItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddressItem[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState(getDefaultBookingDate());
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [providerRes, offeringsRes, reviewsRes] = await Promise.all([
          providersApi.getById(providerId),
          providersApi.getOfferings(providerId),
          reviewsApi.getForProvider(providerId),
        ]);

        const providerData = providerRes.data;
        const offeringsData = offeringsRes.data ?? [];

        setProvider(providerData);
        setOfferings(offeringsData);
        setReviews(reviewsRes.data.content ?? []);
        setSelectedOfferingId((current) => current || offeringsData[0]?.id || "");
      } catch {
        addToast({ type: "error", message: "We couldn't load this provider profile." });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [addToast, providerId]);

  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated || user?.activeRole !== "CUSTOMER") {
        return;
      }

      try {
        const response = await customerApi.getAddresses();
        setSavedAddresses(response.data);
        const defaultAddress = response.data.find((item) => item.defaultAddress) ?? response.data[0];
        if (defaultAddress) {
          setBookingAddress((current) => current || defaultAddress.value);
        }
      } catch {
        // Booking should still work with a manually entered address.
      }
    };

    void loadAddresses();
  }, [isAuthenticated, user]);

  const selectedOffering = useMemo(
    () => offerings.find((offering) => offering.id === selectedOfferingId) ?? null,
    [offerings, selectedOfferingId],
  );

  const handleBookingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOffering) {
      addToast({ type: "info", message: "Choose a service before booking." });
      return;
    }

    if (!isAuthenticated) {
      addToast({ type: "info", message: "Sign in as a customer to place a booking." });
      router.push("/login");
      return;
    }

    if (user?.activeRole !== "CUSTOMER") {
      addToast({ type: "info", message: "Switch to your customer role to book services." });
      return;
    }

    const scheduledAt = new Date(`${bookingDate}T${bookingTime}`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      addToast({ type: "error", message: "Choose a future booking date and time." });
      return;
    }

    if (!bookingAddress.trim()) {
      addToast({ type: "error", message: "Enter the service address for this booking." });
      return;
    }

    setBookingLoading(true);
    try {
      await bookingsApi.create({
        offeringId: selectedOffering.id,
        scheduledAt: scheduledAt.toISOString(),
        address: bookingAddress.trim(),
        notes: bookingNotes.trim() || undefined,
        bookingType: "AT_CUSTOMER",
      });
      addToast({ type: "success", message: "Booking request submitted." });
      router.push("/dashboard/bookings");
    } catch {
      addToast({ type: "error", message: "We couldn't place that booking right now." });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(142,247,214,0.22),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_52%,#f7f2ea_100%)] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" asChild>
            <Link href="/browse">
              <ArrowLeft className="h-4 w-4" />
              Back to browse
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/messages">Open messages</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/bookings">View bookings</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="h-[420px] animate-pulse rounded-[32px] border border-white/60 bg-white/70" />
            <div className="h-[420px] animate-pulse rounded-[32px] border border-white/60 bg-white/70" />
          </div>
        ) : !provider ? (
          <Card>
            <CardContent className="px-6 py-14 text-center text-sm text-slate-500">
              This provider is unavailable right now.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-[linear-gradient(135deg,#0f2a4a_0%,#2662a9_58%,#8ef7d6_100%)] px-6 py-8 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={provider.profileImageUrl}
                          name={provider.fullName}
                          size="xl"
                          className="ring-4 ring-white/20"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-3xl font-semibold">{provider.fullName}</h1>
                            {provider.verificationStatus === "VERIFIED" ? (
                              <Badge variant="success">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Verified
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 max-w-2xl text-sm text-white/78">{provider.bio}</p>
                          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/82">
                            <span className="inline-flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {provider.city}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="h-4 w-4" />
                              {provider.responseTimeMinutes ?? 30} min response
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/14 bg-white/10 px-4 py-4">
                        <div className="flex items-center gap-2 text-amber-200">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-lg font-semibold">
                            {provider.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/70">
                          {provider.reviewCount} reviews
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/50">
                          Service radius
                        </p>
                        <p className="mt-1 text-sm text-white/82">
                          {provider.serviceRadiusKm} km
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-6 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/65 bg-white/65 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Available services
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{offerings.length}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/65 bg-white/65 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Latest review
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {reviews[0]?.comment || "Customer reviews will appear here as bookings close."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Book this provider</CardTitle>
                  <CardDescription>
                    Choose a service, time slot, and address to place a live booking request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleBookingSubmit}>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="offering"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Service
                      </label>
                      <select
                        id="offering"
                        value={selectedOfferingId}
                        onChange={(event) => setSelectedOfferingId(event.target.value)}
                        className="liquid-panel glass-hairline surface-ring w-full rounded-[22px] border border-white/65 px-3.5 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                      >
                        {offerings.map((offering) => (
                          <option key={offering.id} value={offering.id}>
                            {offering.serviceName} - {formatCurrency(offering.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Date"
                        type="date"
                        value={bookingDate}
                        onChange={(event) => setBookingDate(event.target.value)}
                      />
                      <Input
                        label="Time"
                        type="time"
                        value={bookingTime}
                        onChange={(event) => setBookingTime(event.target.value)}
                      />
                    </div>

                    {savedAddresses.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">Saved addresses</p>
                        <div className="flex flex-wrap gap-2">
                          {savedAddresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => setBookingAddress(address.value)}
                              className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                                bookingAddress === address.value
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-white/70 bg-white/70 text-slate-600 hover:bg-white"
                              }`}
                            >
                              {address.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="booking-address"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Service address
                      </label>
                      <textarea
                        id="booking-address"
                        rows={3}
                        value={bookingAddress}
                        onChange={(event) => setBookingAddress(event.target.value)}
                        placeholder="Enter the address where the provider should arrive."
                        className="liquid-panel glass-hairline surface-ring w-full rounded-[22px] border border-white/65 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:bg-white/85 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="booking-notes"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Notes
                      </label>
                      <textarea
                        id="booking-notes"
                        rows={4}
                        value={bookingNotes}
                        onChange={(event) => setBookingNotes(event.target.value)}
                        placeholder="Share gate codes, access notes, or anything helpful for the provider."
                        className="liquid-panel glass-hairline surface-ring w-full rounded-[22px] border border-white/65 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:bg-white/85 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-white"
                      />
                    </div>

                    <div className="rounded-[24px] border border-white/65 bg-white/65 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Booking summary
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>
                          <span className="font-medium text-slate-900">Service:</span>{" "}
                          {selectedOffering?.serviceName || "Choose a service"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">When:</span>{" "}
                          {formatDateTime(`${bookingDate}T${bookingTime}`)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Price:</span>{" "}
                          {selectedOffering ? formatCurrency(selectedOffering.price) : "TBD"}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      loading={bookingLoading}
                      disabled={!selectedOffering || offerings.length === 0}
                      className="w-full"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Request booking
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Services and reviews</CardTitle>
                <CardDescription>
                  Browse the provider&apos;s live offerings and recent customer feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-3">
                  {offerings.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                      This provider has no published offerings yet.
                    </div>
                  ) : (
                    offerings.map((offering) => {
                      const active = offering.id === selectedOfferingId;
                      return (
                        <button
                          key={offering.id}
                          type="button"
                          onClick={() => setSelectedOfferingId(offering.id)}
                          className={`w-full rounded-[24px] border px-4 py-4 text-left transition-colors ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-white/65 bg-white/60 text-slate-900 hover:bg-white/82"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{offering.serviceName}</p>
                              <p
                                className={`mt-1 text-sm ${
                                  active ? "text-white/72" : "text-slate-500"
                                }`}
                              >
                                {offering.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(offering.price)}
                              </p>
                              <p
                                className={`mt-1 text-xs ${
                                  active ? "text-white/70" : "text-slate-400"
                                }`}
                              >
                                {offering.estimatedDurationMinutes} min
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                      No reviews yet for this provider.
                    </div>
                  ) : (
                    reviews.slice(0, 4).map((review) => (
                      <div key={review.id} className="rounded-[24px] border border-white/65 bg-white/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{review.customerName}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(review.createdAt)}
                            </p>
                          </div>
                          <Badge variant="warning">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {review.rating}/5
                          </Badge>
                        </div>
                        {review.comment ? (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {review.comment}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
