"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, MessageSquare, Star, MapPin, Clock, TrendingUp } from "lucide-react";
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
        // silently handle errors
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Welcome back, {user?.firstName}!</h1>
            <p className="text-stone-500 mt-1">Here&apos;s what&apos;s happening with your bookings</p>
          </div>
          <Button variant="primary" asChild>
            <Link href="/browse">
              <MapPin className="h-4 w-4" />
              Find Providers
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">12</p>
                  <p className="text-xs text-stone-500">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">3</p>
                  <p className="text-xs text-stone-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">2</p>
                  <p className="text-xs text-stone-500">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">5</p>
                  <p className="text-xs text-stone-500">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/bookings">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bookings yet</p>
                  <Button variant="primary" size="sm" className="mt-3" asChild>
                    <Link href="/browse">Find Providers</Link>
                  </Button>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-200 transition-colors">
                    <Avatar src={b.provider.avatar} name={b.provider.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900 truncate">{b.provider.name}</span>
                        <BookingStatusBadge status={b.status as BookingStatus} />
                      </div>
                      <p className="text-xs text-stone-500">{b.service} • {formatRelativeTime(b.scheduledAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {b.price && <p className="text-sm font-bold text-stone-900">{formatCurrency(b.price)}</p>}
                      <p className="text-[10px] text-stone-400">{b.reference}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recommended Providers */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Recommended for You</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/browse">Browse All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommended.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-200 transition-colors">
                  <Avatar src={p.avatar} name={p.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-stone-900 truncate">{p.name}</span>
                      <Badge variant="success" className="text-[10px] py-0">Verified</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-500">{p.category}</span>
                      <span className="text-stone-200">·</span>
                      <span className="text-xs text-amber-500 font-medium">★ {p.rating}</span>
                      <span className="text-stone-200">·</span>
                      <span className="text-xs text-stone-400">({p.reviewCount})</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {p.startingPrice && <p className="text-sm font-bold text-stone-900">{formatCurrency(p.startingPrice)}</p>}
                    <Button variant="primary" size="sm" className="mt-1" asChild>
                      <Link href={`/providers/${p.id}`}>Book</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/browse">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm">Browse Services</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/dashboard/bookings">
                  <CalendarCheck className="h-5 w-5" />
                  <span className="text-sm">My Bookings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/dashboard/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/dashboard/reviews">
                  <Star className="h-5 w-5" />
                  <span className="text-sm">Reviews</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
