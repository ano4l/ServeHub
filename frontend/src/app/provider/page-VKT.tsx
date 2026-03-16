"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Wallet,
  Wrench,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingStatusBadge } from "@/components/booking/BookingStatusStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { bookingsApi, providersApi, walletApi, type BookingListItem, type ProviderProfileItem, type ServiceOfferingItem } from "@/lib/api";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/utils";

function verificationVariant(status?: string) {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "PENDING_REVIEW":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
      return "danger";
    default:
      return "default";
  }
}

export default function ProviderDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderProfileItem | null>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [services, setServices] = useState<ServiceOfferingItem[]>([]);
  const [wallet, setWallet] = useState<{
    available: number;
    pending: number;
    totalEarnings: number;
    thisMonth: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await providersApi.getProfile();
        const profile = profileRes.data;
        setProvider(profile);

        const [bookingsRes, offeringsRes, walletRes] = await Promise.all([
          bookingsApi.getAll(),
          providersApi.getOfferings(profile.id),
          walletApi.getBalance(),
        ]);

        setBookings(bookingsRes.data.content ?? []);
        setServices(offeringsRes.data ?? []);
        setWallet(walletRes.data);
      } catch {
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const pendingBookings = bookings.filter((booking) => booking.status === "REQUESTED");
  const activeBookings = bookings.filter((booking) => booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS");
  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED");
  const recentBookings = bookings.slice(0, 5);

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={provider?.profileImageUrl} name={provider?.fullName} size="xl" />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                          {provider?.fullName ?? "Provider workspace"}
                        </h1>
                        <Badge variant={verificationVariant(provider?.verificationStatus)}>
                          {provider?.verificationStatus === "PENDING_REVIEW" ? "Pending review" : provider?.verificationStatus ?? "Setup in progress"}
                        </Badge>
                      </div>
                      <p className="max-w-2xl text-sm text-slate-500">
                        {provider?.bio ?? "Manage requests, services, earnings, and customer conversations from one workspace."}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {provider?.city ?? "Set your service city"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {provider?.serviceRadiusKm ?? 0} km coverage
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" />
                          {provider ? `${provider.averageRating.toFixed(1)} rating` : "No rating yet"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/provider/settings">Edit profile</Link>
                    </Button>
                    <Button variant="primary" asChild>
                      <Link href="/provider/services">Manage services</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Pending requests",
                      value: pendingBookings.length,
                      detail: "Need a response",
                      icon: CalendarClock,
                    },
                    {
                      label: "Active jobs",
                      value: activeBookings.length,
                      detail: "On the calendar",
                      icon: BriefcaseBusiness,
                    },
                    {
                      label: "Completed",
                      value: completedBookings.length,
                      detail: "Delivered successfully",
                      icon: Wrench,
                    },
                    {
                      label: "Available balance",
                      value: wallet ? formatCurrency(wallet.available) : "R0",
                      detail: wallet ? `${formatCurrency(wallet.pending)} pending` : "Wallet syncing",
                      icon: Wallet,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-[24px] border border-white/70 bg-white/55 px-4 py-4 shadow-[0_14px_32px_rgba(79,98,129,0.12)]">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                          <div className="rounded-2xl border border-slate-200/60 bg-white/85 p-2 text-slate-500">
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/55 bg-[linear-gradient(180deg,rgba(11,24,45,0.96),rgba(22,42,77,0.96))] p-5 text-white shadow-[0_24px_50px_rgba(8,18,38,0.28)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/60">Today at a glance</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-sky-100/65">This month</p>
                        <p className="mt-1 text-2xl font-semibold">{wallet ? formatCurrency(wallet.thisMonth) : "R0"}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-2 text-sky-100">
                        <Wallet className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {pendingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{booking.customer.name}</p>
                            <p className="mt-1 text-xs text-sky-100/65">{booking.service}</p>
                          </div>
                          <BookingStatusBadge status={booking.status} />
                        </div>
                        <p className="mt-3 text-xs text-sky-100/65">{formatDateTime(booking.scheduledAt)}</p>
                      </div>
                    ))}
                    {pendingBookings.length === 0 && (
                      <div className="rounded-[22px] border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-sky-100/65">
                        No new requests waiting right now.
                      </div>
                    )}
                  </div>
                  <Button variant="accent" className="w-full" asChild>
                    <Link href="/provider/bookings">Open bookings board</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Recent bookings</CardTitle>
                <CardDescription>Latest activity across your provider account.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/provider/bookings">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-[24px] border border-white/60 bg-white/55 animate-pulse" />
                ))
              ) : recentBookings.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                  Your incoming bookings will appear here as customers start booking your services.
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center gap-4 rounded-[24px] border border-white/65 bg-white/60 px-4 py-4">
                    <Avatar name={booking.customer.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{booking.customer.name}</p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{booking.service}</p>
                      <p className="mt-1 text-xs text-slate-400">{booking.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{booking.price ? formatCurrency(booking.price) : "Quote pending"}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(booking.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Your services</CardTitle>
                <CardDescription>Keep your pricing and turnaround current.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/provider/services">Edit catalog</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-[22px] border border-white/60 bg-white/55 animate-pulse" />
                ))
              ) : services.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                  Add your first service to start receiving bookings.
                </div>
              ) : (
                services.slice(0, 5).map((service) => (
                  <div key={service.id} className="rounded-[22px] border border-white/65 bg-white/60 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{service.serviceName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{service.category}</p>
                      </div>
                      <Badge variant="info">{service.pricingType.replaceAll("_", " ")}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                      <span>{formatCurrency(service.price)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {service.estimatedDurationMinutes} min
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/provider/messages",
              title: "Customer conversations",
              description: "Reply faster and keep jobs moving.",
              icon: MessageSquare,
            },
            {
              href: "/provider/wallet",
              title: "Payouts and balance",
              description: "Track earnings and request payouts.",
              icon: Wallet,
            },
            {
              href: "/provider/reviews",
              title: "Ratings and reviews",
              description: "See what customers are saying.",
              icon: Star,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.href}>
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/70 bg-white/75 text-slate-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <Button variant="outline" className="mt-auto" asChild>
                    <Link href={item.href}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
