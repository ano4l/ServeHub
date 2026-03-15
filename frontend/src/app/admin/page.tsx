"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarCheck, TrendingUp, AlertTriangle, ShieldCheck, Star, MessageSquare, BarChart3, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  pendingVerifications: number;
  openDisputes: number;
  revenue: number;
  avgRating: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  severity?: "low" | "medium" | "high";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          adminApi.getAnalytics(),
          adminApi.getAuditLogs({ page: 0, size: 10 }),
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data.content ?? []);
      } catch {
        // silently handle errors
      }
    };
    load();
  }, []);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":   return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
      default:       return "text-stone-600 bg-stone-50 border-stone-200";
    }
  };

  return (
    <DashboardLayout requiredRole="ADMIN">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Admin Dashboard</h1>
            <p className="text-stone-500 mt-1">Platform overview and operations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/analytics">Analytics</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href="/admin/verifications">Review Queue</Link>
            </Button>
          </div>
        </div>

        {/* Alert for pending items */}
        {stats && (stats.pendingVerifications > 0 || stats.openDisputes > 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    {stats.pendingVerifications} verification{stats.pendingVerifications > 1 ? "s" : ""} pending • {stats.openDisputes} dispute{stats.openDisputes > 1 ? "s" : ""} open
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">Action required to maintain platform quality</p>
                </div>
                <div className="flex gap-2">
                  {stats.pendingVerifications > 0 && (
                    <Button variant="primary" size="sm" asChild>
                      <Link href="/admin/verifications">Review Providers</Link>
                    </Button>
                  )}
                  {stats.openDisputes > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/disputes">Handle Disputes</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.totalUsers.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-stone-500">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.totalProviders.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-stone-500">Providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.totalBookings.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-stone-500">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.revenue ? formatCurrency(stats.revenue) : "R0"}</p>
                  <p className="text-xs text-stone-500">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.pendingVerifications ?? "0"}</p>
                  <p className="text-xs text-stone-500">Pending Verifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.openDisputes ?? "0"}</p>
                  <p className="text-xs text-stone-500">Open Disputes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Star className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.avgRating ?? "0.0"}★</p>
                  <p className="text-xs text-stone-500">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/audit-logs">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl border border-stone-100">
                    <Badge 
                      variant="outline" 
                      className={getSeverityColor(activity.severity)}
                    >
                      {activity.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-900">{activity.description}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/admin/users">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">User Management</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/admin/verifications">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm">Verifications</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/admin/disputes">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">Disputes</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm">Analytics</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/admin/categories">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm">Categories</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/admin/notifications">
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-sm">Notifications</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
