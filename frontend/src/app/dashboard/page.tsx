"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  MessageSquare,
  Settings,
  MapPin,
  Clock,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/booking/BookingStatusStepper";
import type { BookingStatus } from "@/lib/constants";
import { useAuthStore } from "@/store/auth.store";
import { bookingsApi, providersApi } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface Booking {
  id: string;
  reference: string;
  provider: { id: string; name: string; avatar?: string };
  service: string;
  scheduledAt: string;
  status: string;
  price?: number;
}

interface Provider {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  category: string;
  distanceKm?: number;
  startingPrice?: number;
}

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommended, setRecommended] = useState<Provider[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsRes, providersRes] = await Promise.all([
          bookingsApi.getAll({ page: 0, size: 5 }),
          providersApi.getAll({ page: 0, size: 6, sort: "recommended" }),
        ]);
        setBookings(bookingsRes.data.content ?? []);
        setRecommended(providersRes.data.content ?? []);
      } catch {
        // Keep the dashboard stable even when the API is unavailable.
      }
    };

    void load();
  }, []);

  const summary = useMemo(
    () => ({
      totalBookings: bookings.length,
      completedBookings: bookings.filter((booking) => booking.status === "COMPLETED").length,
      upcomingBookings: bookings.filter(
        (booking) => booking.status === "REQUESTED" || booking.status === "ACCEPTED",
      ).length,
      activeMessages: bookings.filter(
        (booking) =>
          booking.status === "REQUESTED" ||
          booking.status === "ACCEPTED" ||
          booking.status === "IN_PROGRESS",
      ).length,
    }),
    [bookings],
  );

  return (
    <DashboardLayout requiredRole="CUSTOMER">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-1 text-stone-500">
              Here&apos;s what&apos;s happening with your bookings
            </p>
          </div>
          <Button variant="primary" asChild>
            <Link href="/explore">
              <MapPin className="h-4 w-4" />
              Find Providers
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{summary.totalBookings}</p>
                  <p className="text-xs text-stone-500">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{summary.completedBookings}</p>
                  <p className="text-xs text-stone-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{summary.upcomingBookings}</p>
                  <p className="text-xs text-stone-500">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <MessageSquare className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{summary.activeMessages}</p>
                  <p className="text-xs text-stone-500">Live Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/bookings">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <CalendarCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No bookings yet</p>
                  <Button variant="primary" size="sm" className="mt-3" asChild>
                    <Link href="/explore">Find Providers</Link>
                  </Button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition-colors hover:border-stone-200"
                  >
                    <Avatar
                      src={booking.provider.avatar}
                      name={booking.provider.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-stone-900">
                          {booking.provider.name}
                        </span>
                        <BookingStatusBadge status={booking.status as BookingStatus} />
                      </div>
                      <p className="text-xs text-stone-500">
                        {booking.service} · {formatRelativeTime(booking.scheduledAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {booking.price ? (
                        <p className="text-sm font-bold text-stone-900">
                          {formatCurrency(booking.price)}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-stone-400">{booking.reference}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Recommended for You</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/explore">Browse All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommended.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition-colors hover:border-stone-200"
                >
                  <Avatar src={provider.avatar} name={provider.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-stone-900">
                        {provider.name}
                      </span>
                      <Badge variant="success" className="py-0 text-[10px]">
                        Verified
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-stone-500">{provider.category}</span>
                      <span className="text-stone-200">·</span>
                      <span className="text-xs font-medium text-amber-500">
                        ★ {provider.rating}
                      </span>
                      <span className="text-stone-200">·</span>
                      <span className="text-xs text-stone-400">
                        ({provider.reviewCount})
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {provider.startingPrice ? (
                      <p className="text-sm font-bold text-stone-900">
                        {formatCurrency(provider.startingPrice)}
                      </p>
                    ) : null}
                    <Button variant="primary" size="sm" className="mt-1" asChild>
                      <Link href={`/providers/${provider.id}`}>Book</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Button variant="outline" className="flex h-auto flex-col gap-2 p-4" asChild>
                <Link href="/explore">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm">Browse Services</span>
                </Link>
              </Button>
              <Button variant="outline" className="flex h-auto flex-col gap-2 p-4" asChild>
                <Link href="/dashboard/bookings">
                  <CalendarCheck className="h-5 w-5" />
                  <span className="text-sm">My Bookings</span>
                </Link>
              </Button>
              <Button variant="outline" className="flex h-auto flex-col gap-2 p-4" asChild>
                <Link href="/dashboard/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="flex h-auto flex-col gap-2 p-4" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
