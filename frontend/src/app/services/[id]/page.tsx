"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Shield,
  ChevronRight,
  Heart,
  Share2,
  Plus,
  ShoppingCart,
  Check,
  Zap,
  ThumbsUp,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { CartDrawer, CartFab } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import {
  getServiceById,
  getCategoryById,
  getServicesByCategory,
} from "@/lib/services-directory";
import { cn } from "@/lib/utils";

const MOCK_REVIEWS = [
  { id: 1, name: "Thandi M.", rating: 5, date: "2 days ago", text: "Absolutely fantastic service! Arrived on time, very professional, and left everything spotless. Will definitely book again.", avatar: "TM" },
  { id: 2, name: "James K.", rating: 5, date: "1 week ago", text: "Great communication from start to finish. Fair pricing and quality work. Highly recommended!", avatar: "JK" },
  { id: 3, name: "Priya N.", rating: 4, date: "2 weeks ago", text: "Good service overall. The provider was friendly and efficient. Only minor issue was a slight delay in arrival.", avatar: "PN" },
  { id: 4, name: "David L.", rating: 5, date: "3 weeks ago", text: "This is my third time using this service and it never disappoints. Consistent quality every time.", avatar: "DL" },
  { id: 5, name: "Sarah B.", rating: 4, date: "1 month ago", text: "Very happy with the result. The provider went above and beyond what I expected. Would use again.", avatar: "SB" },
];

const MOCK_FAQS = [
  { q: "How does pricing work?", a: "Pricing is based on the scope of work. You'll receive a firm quote from the provider before any work begins — no surprises." },
  { q: "Can I cancel or reschedule?", a: "Yes, free cancellation up to 2 hours before your scheduled time. Rescheduling is always free." },
  { q: "Are providers verified?", a: "All providers on ServeHub go through ID verification, background checks, and skills assessment before being listed." },
  { q: "What if I'm not satisfied?", a: "We offer a satisfaction guarantee. If you're not happy, we'll work with the provider to resolve it or offer a refund." },
];

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = Number(params.id);
  const { addItem, items } = useCartStore();
  const { addToast } = useUIStore();

  const [liked, setLiked] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const service = useMemo(() => getServiceById(serviceId), [serviceId]);
  const category = useMemo(
    () => (service ? getCategoryById(service.categoryId) : undefined),
    [service],
  );
  const relatedServices = useMemo(() => {
    if (!service) return [];
    return getServicesByCategory(service.categoryId)
      .filter((s) => s.id !== service.id)
      .slice(0, 6);
  }, [service]);

  const isInCart = items.some((i) => i.service.id === serviceId);

  const handleAddToCart = () => {
    if (!service) return;
    addItem(service);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleShare = async () => {
    if (!service) {
      return;
    }

    const shareUrl = typeof window !== "undefined" ? window.location.href : `/services/${service.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: service.name,
          text: `${service.name} on ServeHub`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        addToast({ type: "success", message: "Service link copied to your clipboard." });
      }
    } catch {
      addToast({ type: "info", message: "Share was dismissed." });
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex flex-col items-center justify-center">
        <p className="text-lg font-medium">Service not found</p>
        <button
          onClick={() => router.push("/services")}
          className="mt-4 rounded-full bg-white/10 px-5 py-2 text-sm transition hover:bg-white/15"
        >
          Browse all services
        </button>
      </div>
    );
  }

  const visibleReviews = showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.06),transparent_28%)]" />
      <AppTabs />
      <CartDrawer />
      <CartFab />

      <div className="relative mx-auto max-w-3xl pb-32">
        {/* ═══ Hero image ═══ */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/5">
          <img
            src={service.imageUrl.replace("w=400", "w=800").replace("q=80", "q=85")}
            alt={service.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
            )}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/40 to-transparent" />

          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white transition hover:bg-black/60"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition",
                  liked
                    ? "bg-red-500/30 text-red-400"
                    : "bg-black/40 text-white hover:bg-black/60",
                )}
              >
                <Heart className={cn("h-5 w-5", liked && "fill-current")} />
              </button>
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white transition hover:bg-black/60"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Category badge */}
          {category && (
            <div className="absolute bottom-4 left-4">
              <span className="rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-xs font-medium text-white/80">
                {category.emoji} {category.name}
              </span>
            </div>
          )}
        </div>

        {/* ═══ Service info ═══ */}
        <div className="px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {service.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/50">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              <span className="font-medium text-white">
                {service.rating.toFixed(1)}
              </span>
              <span>({Math.floor(service.rating * 47)}+ reviews)</span>
            </span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {service.duration}
            </span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Comes to you
            </span>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            {service.description}
          </p>

          {/* Price + Add to cart */}
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/35">
                Price range
              </p>
              <p className="mt-0.5 text-xl font-bold text-cyan-300">
                {service.priceRange}
              </p>
              <p className="mt-0.5 text-[11px] text-white/30">
                Final quote after provider review
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addedFeedback}
              className={cn(
                "flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-semibold transition-all active:scale-[0.96]",
                addedFeedback
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isInCart
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500",
              )}
            >
              {addedFeedback ? (
                <>
                  <Check className="h-4 w-4" /> Added!
                </>
              ) : isInCart ? (
                <>
                  <Plus className="h-4 w-4" /> Add another
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Add to cart
                </>
              )}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              {
                icon: Shield,
                label: "Verified pros",
                sub: "Background checked",
              },
              {
                icon: Zap,
                label: "Quick response",
                sub: "Usually < 30 min",
              },
              {
                icon: ThumbsUp,
                label: "Satisfaction",
                sub: "Guaranteed",
              },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center rounded-2xl border border-white/6 bg-white/3 p-3 text-center"
              >
                <badge.icon className="h-5 w-5 text-cyan-400/70" />
                <p className="mt-1.5 text-xs font-medium text-white/70">
                  {badge.label}
                </p>
                <p className="text-[10px] text-white/30">{badge.sub}</p>
              </div>
            ))}
          </div>

          {/* ═══ What's included ═══ */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">What&apos;s included</h2>
            <div className="mt-3 space-y-2">
              {[
                "Professional service provider at your location",
                "All standard tools and equipment",
                "Clean-up after the job is done",
                "7-day workmanship guarantee",
                "In-app communication with your provider",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ Reviews ═══ */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reviews</h2>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-current text-amber-400" />
                <span className="font-medium">{service.rating.toFixed(1)}</span>
                <span className="text-white/40">
                  ({Math.floor(service.rating * 47)}+)
                </span>
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="mt-3 flex gap-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const pct =
                  stars === 5
                    ? 72
                    : stars === 4
                      ? 20
                      : stars === 3
                        ? 5
                        : stars === 2
                          ? 2
                          : 1;
                return (
                  <div key={stars} className="flex flex-1 flex-col items-center gap-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-amber-400/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/30">{stars}★</span>
                  </div>
                );
              })}
            </div>

            {/* Review cards */}
            <div className="mt-4 space-y-3">
              {visibleReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-white/6 bg-white/3 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-xs font-bold text-cyan-300">
                      {review.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/80">
                        {review.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-current text-amber-400"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-white/30">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>

            {!showAllReviews && MOCK_REVIEWS.length > 3 && (
              <button
                onClick={() => setShowAllReviews(true)}
                className="mt-3 w-full rounded-xl border border-white/8 bg-white/4 py-2.5 text-center text-sm font-medium text-white/60 transition hover:bg-white/6"
              >
                Show all {MOCK_REVIEWS.length} reviews
              </button>
            )}
          </div>

          {/* ═══ FAQ ═══ */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Frequently asked questions</h2>
            <div className="mt-3 space-y-2">
              {MOCK_FAQS.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full rounded-2xl border border-white/6 bg-white/3 p-4 text-left transition hover:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white/80">{faq.q}</p>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 flex-shrink-0 text-white/30 transition-transform",
                        expandedFaq === i && "rotate-90",
                      )}
                    />
                  </div>
                  {expandedFaq === i && (
                    <p className="mt-2 text-sm leading-relaxed text-white/45">
                      {faq.a}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ═══ Related services ═══ */}
          {relatedServices.length > 0 && (
            <div className="mt-8 mb-6">
              <h2 className="text-lg font-semibold">
                More in {category?.name}
              </h2>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {relatedServices.map((related) => (
                  <button
                    key={related.id}
                    onClick={() => router.push(`/services/${related.id}`)}
                    className="group w-[180px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/4 text-left transition-all active:scale-[0.97] hover:border-white/14"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                      <img
                        src={related.imageUrl}
                        alt={related.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-transparent to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-medium text-white/90 line-clamp-1">
                        {related.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-cyan-300/70">
                          {related.priceRange}
                        </span>
                        <span className="flex items-center gap-0.5 text-[11px] text-white/35">
                          <Star className="h-2.5 w-2.5 fill-current text-amber-400" />
                          {related.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Sticky bottom bar ═══ */}
        <div className="fixed bottom-16 left-0 right-0 z-50 px-4 sm:bottom-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0a1525]/95 p-3 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white line-clamp-1">
                  {service.name}
                </p>
                <p className="text-xs text-cyan-300">{service.priceRange}</p>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addedFeedback}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all active:scale-[0.96]",
                  addedFeedback
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500",
                )}
              >
                {addedFeedback ? (
                  <>
                    <Check className="h-4 w-4" /> Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" /> Add to cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
