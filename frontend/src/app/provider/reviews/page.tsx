"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote, Star, ThumbsUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { providersApi, reviewsApi, type ProviderProfileItem } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
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

export default function ProviderReviewsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderProfileItem | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await providersApi.getProfile();
        const profile = profileRes.data;
        setProvider(profile);
        const reviewsRes = await reviewsApi.getForProvider(profile.id);
        setReviews(reviewsRes.data.content ?? []);
      } catch {
        addToast({ type: "error", message: "We couldn't load your customer reviews." });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [addToast]);

  const averageReviewMetric = (key: "qualityRating" | "punctualityRating" | "professionalismRating") => {
    const values = reviews.map((review) => review[key]).filter((value): value is number => typeof value === "number");
    if (!values.length) {
      return "0.0";
    }
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  };

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ratings and reviews</h1>
          <p className="mt-1 text-sm text-slate-500">Understand how customers rate your service quality, punctuality, and professionalism.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Average rating", value: provider ? provider.averageRating.toFixed(1) : "0.0", icon: Star },
            { label: "Quality", value: averageReviewMetric("qualityRating"), icon: ThumbsUp },
            { label: "Punctuality", value: averageReviewMetric("punctualityRating"), icon: MessageSquareQuote },
            { label: "Review count", value: String(provider?.reviewCount ?? reviews.length), icon: Star },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                    <div className="rounded-2xl border border-white/70 bg-white/85 p-2 text-slate-500">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent customer feedback</CardTitle>
            <CardDescription>These reviews come from completed bookings tied to your provider account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 rounded-[24px] border border-white/65 bg-white/55 animate-pulse" />
              ))
            ) : reviews.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                No reviews yet. Completed jobs will start populating this page.
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-[24px] border border-white/65 bg-white/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={review.customerName} size="md" />
                      <div>
                        <p className="font-semibold text-slate-900">{review.customerName}</p>
                        <p className="mt-1 text-sm text-slate-500">Booking #{review.bookingId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : ""}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(review.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.qualityRating != null && <Badge variant="info">Quality {review.qualityRating}/5</Badge>}
                    {review.punctualityRating != null && <Badge variant="info">Punctuality {review.punctualityRating}/5</Badge>}
                    {review.professionalismRating != null && <Badge variant="info">Professionalism {review.professionalismRating}/5</Badge>}
                  </div>

                  {review.comment && <p className="mt-4 text-sm leading-6 text-slate-600">{review.comment}</p>}

                  {review.providerResponse && (
                    <div className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Your response</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-900">{review.providerResponse}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
