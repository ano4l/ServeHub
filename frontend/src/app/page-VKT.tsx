"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  Compass,
  MapPin,
  Star,
  UserCircle2,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  providersApi,
  type ProviderListItem,
} from "@/lib/api";
import { EXPLORE_FEED_FIXTURES } from "@/lib/explore-feed-fixtures";
import { useAuthStore } from "@/store/auth.store";

const QUICK_ACTIONS = [
  {
    href: "/explore",
    icon: Compass,
    title: "Explore",
    description: "Scroll the service feed and jump into live provider profiles.",
  },
  {
    href: "/bookings",
    icon: CalendarCheck2,
    title: "Bookings",
    description: "Track upcoming jobs, status updates, and conversations.",
  },
  {
    href: "/profile",
    icon: UserCircle2,
    title: "Profile",
    description: "Manage your account, saved addresses, and payment details.",
  },
];

interface FeaturedProvider {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  category: string;
  bio?: string;
  tags: string[];
  availableNow: boolean;
}

function toProviderCard(provider: ProviderListItem): FeaturedProvider {
  return {
    id: provider.id,
    name: provider.name,
    avatar: provider.avatar,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    verified: provider.verified,
    category: provider.category,
    bio: provider.bio,
    tags: provider.tags,
    availableNow: provider.availableNow,
  };
}

const fallbackFeaturedProviders: FeaturedProvider[] = EXPLORE_FEED_FIXTURES.slice(0, 3).map(
  (post) => ({
    id: post.providerId,
    name: post.name,
    rating: post.rating,
    reviewCount: post.reviewCount,
    verified: post.verified,
    category: post.category,
    bio: post.caption,
    tags: [post.city, ...post.hashtags]
      .filter((tag): tag is string => Boolean(tag))
      .slice(0, 4),
    availableNow: post.availableNow,
  }),
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [featuredProviders, setFeaturedProviders] = useState<FeaturedProvider[]>(
    fallbackFeaturedProviders,
  );
  const [usingFallbackProviders, setUsingFallbackProviders] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProviders = async () => {
      try {
        const response = await providersApi.getAll({
          page: 0,
          size: 3,
          sort: "recommended",
        });
        if (cancelled) {
          return;
        }

        const liveProviders = (response.data.content ?? []).map(toProviderCard);
        if (liveProviders.length > 0) {
          setFeaturedProviders(liveProviders);
          setUsingFallbackProviders(false);
        } else {
          setFeaturedProviders(fallbackFeaturedProviders);
          setUsingFallbackProviders(true);
        }
      } catch {
        if (!cancelled) {
          setFeaturedProviders(fallbackFeaturedProviders);
          setUsingFallbackProviders(true);
        }
      }
    };

    void loadProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  const primaryCta = useMemo(() => {
    if (!hydrated || !isAuthenticated) {
      return {
        href: "/explore",
        label: "Open Explore",
      };
    }

    if (user?.activeRole === "PROVIDER") {
      return {
        href: "/provider",
        label: "Open Provider Hub",
      };
    }

    if (user?.activeRole === "ADMIN" || user?.activeRole === "SUPPORT") {
      return {
        href: "/admin",
        label: "Open Admin",
      };
    }

    return {
      href: "/dashboard",
      label: "Open Dashboard",
    };
  }, [hydrated, isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(142,247,214,0.15),transparent_28%),linear-gradient(180deg,#09101a_0%,#0b1118_38%,#111827_100%)] px-4 py-4 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-3 backdrop-blur-xl">
          <AppTabs />
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(9,16,26,0.94),rgba(24,56,108,0.88)_55%,rgba(37,184,154,0.34))] px-5 py-8 shadow-[0_30px_120px_rgba(8,15,32,0.4)] sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-white text-black hover:bg-white">
                  ServeHub
                </Badge>
                <Badge className="rounded-full border border-white/15 bg-white/8 text-white hover:bg-white/8">
                  Home is back
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/65">
                  Book local services faster
                </p>
                <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Browse, book, and manage everything without getting trapped in the explore feed.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
                  Start from a real homepage, jump into explore when you want the social feed, and keep bookings and profile one tap away.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => router.push(primaryCta.href)}>
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/explore")}
                >
                  See explore feed
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 transition hover:bg-white/12"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold">{action.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/66">
                      {action.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/28 p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
              Why this matters
            </p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/70">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Explore is now just explore</p>
                <p className="mt-2">
                  The TikTok-style feed still exists, but it is no longer pretending to be the whole app.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Bookings and profile are direct destinations</p>
                <p className="mt-2">
                  Those pages are routable again instead of being hidden behind dashboard-only navigation.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Home gives the app structure</p>
                <p className="mt-2">
                  You can now land somewhere intentional, then decide whether to browse, book, or update your account.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                  Featured providers
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Start with a real provider profile
                </h2>
              </div>
              {usingFallbackProviders ? (
                <Badge className="rounded-full border border-amber-200/20 bg-amber-400/10 text-amber-50 hover:bg-amber-400/10">
                  Sample picks
                </Badge>
              ) : (
                <Badge className="rounded-full border border-emerald-200/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/10">
                  Live picks
                </Badge>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {featuredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-[1.8rem] border border-white/10 bg-black/28 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={provider.avatar}
                      name={provider.name}
                      size="lg"
                      online={provider.availableNow}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-semibold text-white">
                          {provider.name}
                        </p>
                        {provider.verified ? (
                          <Badge className="rounded-full bg-white text-black hover:bg-white">
                            Verified
                          </Badge>
                        ) : null}
                        {provider.availableNow ? (
                          <Badge className="rounded-full border border-emerald-200/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/10">
                            Available
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/42">
                        {provider.category}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/66">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {provider.rating.toFixed(1)}
                        </span>
                        <span>{provider.reviewCount} reviews</span>
                        {provider.tags[0] ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {provider.tags[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {provider.bio ? (
                    <p className="mt-4 text-sm leading-6 text-white/70">
                      {provider.bio}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.tags.slice(0, 4).map((tag) => (
                      <span
                        key={`${provider.id}-${tag}`}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/72"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/providers/${provider.id}`}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/8 px-5 text-sm font-medium text-white transition hover:bg-white/12"
                    >
                      View profile
                    </Link>
                    <Button onClick={() => router.push(`/providers/${provider.id}`)}>
                      Book now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
