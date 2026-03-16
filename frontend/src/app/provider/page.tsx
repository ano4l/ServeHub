"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, TrendingUp, Clock, Star, Wallet, MessageSquare, Users, ArrowRight, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/booking/BookingStatusStepper";
import { useAuthStore } from "@/store/auth.store";
import { bookingsApi, walletApi } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface Booking {
  id: string;
  reference: string;
  customer: { id: string; name: string; avatar?: string };
  service: string;
  scheduledAt: string;
  status: string;
  price?: number;
  bookingType: string;
}

interface WalletStats {
  available: number;
  pending: number;
  totalEarnings: number;
  thisMonth: number;
}

export default function ProviderDashboard() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsRes, walletRes] = await Promise.all([
          bookingsApi.getAll({ page: 0, size: 5 }),
          walletApi.getBalance(),
        ]);
        setBookings(bookingsRes.data.content ?? []);
        setWallet(walletRes.data);
      } catch {
        // silently handle errors
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayBookings = bookings.filter(b => {
    const today = new Date().toDateString();
    return new Date(b.scheduledAt).toDateString() === today;
  });

  const pendingBookings = bookings.filter(b => b.status === "REQUESTED");

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Provider Dashboard</h1>
            <p className="text-stone-500 mt-1">Manage your bookings and earnings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/provider/calendar">Calendar View</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href="/provider/services">Manage Services</Link>
            </Button>
          </div>
        </div>

        {/* Alert for pending bookings */}
        {pendingBookings.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  You have {pendingBookings.length} booking request{pendingBookings.length > 1 ? "s" : ""} pending
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Respond quickly to improve your rating</p>
              </div>
              <Button variant="primary" size="sm" asChild>
                <Link href="/provider/bookings?status=REQUESTED">Review Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{todayBookings.length}</p>
                  <p className="text-xs text-stone-500">Today&apos;s Bookings</p>
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
                  <p className="text-2xl font-bold text-stone-900">{wallet?.thisMonth ? formatCurrency(wallet.thisMonth) : "R0"}</p>
                  <p className="text-xs text-stone-500">This Month</p>
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
                  <p className="text-2xl font-bold text-stone-900">{pendingBookings.length}</p>
                  <p className="text-xs text-stone-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Star className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">4.8</p>
                  <p className="text-xs text-stone-500">Avg Rating</p>
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
                <Link href="/provider/bookings">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bookings yet</p>
                  <Button variant="primary" size="sm" className="mt-3" asChild>
                    <Link href="/provider/services">Set up your services</Link>
                  </Button>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-200 transition-colors">
                    <div className="shrink-0">
                      <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-semibold text-stone-600">
                        {b.customer.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900 truncate">{b.customer.name}</span>
                        <BookingStatusBadge status={b.status as any} />
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

          {/* Wallet Overview */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Earnings Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/provider/wallet">View Wallet</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium">Available Balance</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">
                    {wallet?.available ? formatCurrency(wallet.available) : "R0"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium">Pending</p>
                  <p className="text-xl font-bold text-amber-900 mt-1">
                    {wallet?.pending ? formatCurrency(wallet.pending) : "R0"}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-600 font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">
                  {wallet?.totalEarnings ? formatCurrency(wallet.totalEarnings) : "R0"}
                </p>
                <p className="text-xs text-stone-500 mt-1">Since joining</p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/provider/wallet">
                  <Wallet className="h-4 w-4" />
                  Manage Wallet
                </Link>
              </Button>
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
                <Link href="/provider/bookings">
                  <CalendarCheck className="h-5 w-5" />
                  <span className="text-sm">Bookings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/provider/services">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Services</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/provider/wallet">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm">Wallet</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                <Link href="/provider/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Messages</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
