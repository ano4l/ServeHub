"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProviderCard, type ProviderCardData } from "@/components/provider/ProviderCard";
import { ProviderCardSkeleton } from "@/components/ui/skeleton";
import { providersApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

const defaultFilters = {
  verifiedOnly: false,
  availableToday: false,
  minRating: 0,
  maxPrice: undefined as number | undefined,
  distance: 25,
};

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useUIStore();
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "recommended");
  const [filters, setFilters] = useState({
    verifiedOnly: searchParams.get("verified") === "true",
    availableToday: searchParams.get("available") === "true",
    minRating: searchParams.get("rating") ? Number(searchParams.get("rating")) : 0,
    maxPrice: searchParams.get("price") ? Number(searchParams.get("price")) : undefined,
    distance: searchParams.get("distance") ? Number(searchParams.get("distance")) : 25,
  });

  const categoryOptions = useMemo(() => {
    const liveCategories = Array.from(
      new Set(
        providers
          .map((provider) => provider.category)
          .filter((category) => category && category !== "General services"),
      ),
    );

    if (selectedCategory && !liveCategories.includes(selectedCategory)) {
      return [selectedCategory, ...liveCategories];
    }

    return liveCategories;
  }, [providers, selectedCategory]);

  const filteredProviders = useMemo(() => {
    let filtered = [...providers];

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (provider) =>
          provider.name.toLowerCase().includes(query) ||
          provider.category.toLowerCase().includes(query) ||
          provider.bio?.toLowerCase().includes(query) ||
          provider.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (provider) => provider.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    if (filters.verifiedOnly) {
      filtered = filtered.filter((provider) => provider.verified);
    }

    if (filters.availableToday) {
      filtered = filtered.filter((provider) => provider.availableNow);
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter((provider) => provider.rating >= filters.minRating);
    }

    if (filters.maxPrice !== undefined) {
      const maxPrice = filters.maxPrice;
      filtered = filtered.filter(
        (provider) => provider.startingPrice === undefined || provider.startingPrice <= maxPrice,
      );
    }

    filtered.sort((left, right) => {
      switch (sortBy) {
        case "nearest":
          return (left.distanceKm ?? Number.POSITIVE_INFINITY) -
            (right.distanceKm ?? Number.POSITIVE_INFINITY);
        case "cheapest":
          return (left.startingPrice ?? Number.POSITIVE_INFINITY) -
            (right.startingPrice ?? Number.POSITIVE_INFINITY);
        case "top-rated":
          if (right.rating !== left.rating) {
            return right.rating - left.rating;
          }
          return right.reviewCount - left.reviewCount;
        case "recommended":
        default: {
          const leftScore =
            (left.verified ? 10 : 0) + left.rating * 2 + Math.log(left.reviewCount + 1);
          const rightScore =
            (right.verified ? 10 : 0) + right.rating * 2 + Math.log(right.reviewCount + 1);
          return rightScore - leftScore;
        }
      }
    });

    return filtered;
  }, [filters, providers, search, selectedCategory, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategory) {
      count += 1;
    }
    if (filters.verifiedOnly) {
      count += 1;
    }
    if (filters.availableToday) {
      count += 1;
    }
    if (filters.minRating > 0) {
      count += 1;
    }
    if (filters.maxPrice !== undefined) {
      count += 1;
    }
    if (filters.distance !== defaultFilters.distance) {
      count += 1;
    }

    return count;
  }, [filters, selectedCategory]);

  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string }[] = [];

    if (selectedCategory) {
      pills.push({ key: "category", label: selectedCategory });
    }
    if (filters.verifiedOnly) {
      pills.push({ key: "verifiedOnly", label: "Verified only" });
    }
    if (filters.availableToday) {
      pills.push({ key: "availableToday", label: "Available today" });
    }
    if (filters.minRating > 0) {
      pills.push({ key: "minRating", label: `${filters.minRating}+ stars` });
    }
    if (filters.maxPrice !== undefined) {
      pills.push({ key: "maxPrice", label: `Under R${filters.maxPrice}` });
    }
    if (filters.distance !== defaultFilters.distance) {
      pills.push({ key: "distance", label: `Within ${filters.distance} km` });
    }

    return pills;
  }, [filters, selectedCategory]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await providersApi.getAll({
          lat: -33.9249,
          lng: 18.4241,
          radius: filters.distance,
          categoryId: selectedCategory || undefined,
          verifiedOnly: filters.verifiedOnly,
          availableToday: filters.availableToday,
          minRating: filters.minRating || undefined,
          maxPrice: filters.maxPrice,
          sort: sortBy,
        });
        setProviders(response.data.content ?? []);
      } catch {
        addToast({ type: "error", message: "Failed to load providers." });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [addToast, filters, selectedCategory, sortBy]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtersOpen]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSelectedCategory("");
    setSortBy("recommended");
  };

  const clearSearchAndFilters = () => {
    setSearch("");
    resetFilters();
  };

  const toggleQuickFilter = (
    key: "verifiedOnly" | "availableToday" | "minRating" | "maxPrice",
  ) => {
    if (key === "minRating") {
      setFilters((current) => ({
        ...current,
        minRating: current.minRating >= 4 ? 0 : 4,
      }));
      return;
    }

    if (key === "maxPrice") {
      setFilters((current) => ({
        ...current,
        maxPrice: current.maxPrice === 500 ? undefined : 500,
      }));
      return;
    }

    setFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const clearFilterPill = (key: string) => {
    switch (key) {
      case "category":
        setSelectedCategory("");
        break;
      case "verifiedOnly":
        setFilters((current) => ({ ...current, verifiedOnly: false }));
        break;
      case "availableToday":
        setFilters((current) => ({ ...current, availableToday: false }));
        break;
      case "minRating":
        setFilters((current) => ({ ...current, minRating: 0 }));
        break;
      case "maxPrice":
        setFilters((current) => ({ ...current, maxPrice: undefined }));
        break;
      case "distance":
        setFilters((current) => ({ ...current, distance: defaultFilters.distance }));
        break;
      default:
        break;
    }
  };

  const handleBook = (providerId: string) => {
    router.push(`/providers/${providerId}`);
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <AppTabs />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6">
        <div className="mt-4 rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/55">
                Explore
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                Find the right provider without losing the feed.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Search stays compact, quick filters stay one tap away, and the deeper controls open
                in their own panel instead of swallowing the page.
              </p>
            </div>
            <Badge variant="info" className="rounded-full px-3 py-1">
              {loading
                ? "Refreshing providers"
                : `${filteredProviders.length} provider${filteredProviders.length === 1 ? "" : "s"}`}
            </Badge>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 mt-5 border-y border-stone-200/80 bg-stone-50/92 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search providers, services, neighborhoods..."
                leftIcon={<Search className="h-4 w-4" />}
                rightIcon={
                  search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="rounded-full p-0.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null
                }
                className="h-12 rounded-full border-stone-200 bg-white pr-10"
              />
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <Button
                variant={filtersOpen ? "primary" : "secondary"}
                size="lg"
                onClick={() => setFiltersOpen((current) => !current)}
                className="relative rounded-full"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/18 px-1.5 text-[11px]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
              <div className="min-w-[160px]">
                <label className="sr-only" htmlFor="sort-by">
                  Sort providers
                </label>
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-11 w-full appearance-none rounded-full border border-stone-200 bg-white pl-9 pr-4 text-sm text-stone-700 shadow-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="nearest">Nearest</option>
                    <option value="cheapest">Cheapest</option>
                    <option value="top-rated">Top rated</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {categoryOptions.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-sm font-medium transition",
                  !selectedCategory
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900",
                )}
              >
                All providers
              </button>
              {categoryOptions.slice(0, 8).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-sm font-medium transition",
                    selectedCategory === category
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "verifiedOnly", label: "Verified", active: filters.verifiedOnly },
              { key: "availableToday", label: "Available today", active: filters.availableToday },
              { key: "minRating", label: "4+ stars", active: filters.minRating >= 4 },
              { key: "maxPrice", label: "Under R500", active: filters.maxPrice === 500 },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  toggleQuickFilter(
                    item.key as "verifiedOnly" | "availableToday" | "minRating" | "maxPrice",
                  )
                }
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition",
                  item.active
                    ? "border-amber-300 bg-amber-100 text-amber-900"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-800",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {activeFilterPills.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilterPills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => clearFilterPill(pill.key)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
                >
                  {pill.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-stone-500 transition hover:text-stone-800"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-40 bg-stone-950/35 backdrop-blur-sm"
              aria-label="Close filters"
            />
            <motion.aside
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-x-4 bottom-4 top-24 z-50 ml-auto overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_32px_90px_rgba(28,25,23,0.24)] sm:left-auto sm:w-[420px]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between border-b border-stone-200 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Filters</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Fine-tune the list without pushing the page around.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFiltersOpen(false)}
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                  {categoryOptions.length > 0 ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="panel-category">
                        Category
                      </label>
                      <select
                        id="panel-category"
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
                      >
                        <option value="">All categories</option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="panel-rating">
                        Minimum rating
                      </label>
                      <select
                        id="panel-rating"
                        value={filters.minRating}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            minRating: Number(event.target.value),
                          }))
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
                      >
                        <option value="0">Any rating</option>
                        <option value="3">3+ stars</option>
                        <option value="4">4+ stars</option>
                        <option value="4.5">4.5+ stars</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="panel-price">
                        Max price
                      </label>
                      <select
                        id="panel-price"
                        value={filters.maxPrice ?? ""}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            maxPrice: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
                      >
                        <option value="">Any price</option>
                        <option value="200">Under R200</option>
                        <option value="500">Under R500</option>
                        <option value="1000">Under R1000</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="panel-distance">
                      Distance
                    </label>
                    <select
                      id="panel-distance"
                      value={filters.distance}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          distance: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
                    >
                      <option value="5">Within 5 km</option>
                      <option value="10">Within 10 km</option>
                      <option value="25">Within 25 km</option>
                      <option value="50">Within 50 km</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          verifiedOnly: !current.verifiedOnly,
                        }))
                      }
                      className={cn(
                        "flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition",
                        filters.verifiedOnly
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-medium">Verified only</span>
                        <span
                          className={cn(
                            "mt-1 block text-xs",
                            filters.verifiedOnly ? "text-white/70" : "text-stone-500",
                          )}
                        >
                          Prioritize vetted providers.
                        </span>
                      </span>
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          filters.verifiedOnly ? "bg-emerald-300" : "bg-stone-300",
                        )}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          availableToday: !current.availableToday,
                        }))
                      }
                      className={cn(
                        "flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition",
                        filters.availableToday
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-medium">Available today</span>
                        <span
                          className={cn(
                            "mt-1 block text-xs",
                            filters.availableToday ? "text-white/70" : "text-stone-500",
                          )}
                        >
                          Surface providers ready to take work now.
                        </span>
                      </span>
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          filters.availableToday ? "bg-emerald-300" : "bg-stone-300",
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="border-t border-stone-200 bg-stone-50 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button onClick={() => setFiltersOpen(false)} className="rounded-full">
                      {loading
                        ? "Updating..."
                        : `Show ${filteredProviders.length} provider${filteredProviders.length === 1 ? "" : "s"}`}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {loading
                ? "Refreshing provider list"
                : `${filteredProviders.length} provider${filteredProviders.length === 1 ? "" : "s"} ready to browse`}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {search
                ? `Showing matches for "${search}".`
                : "Use search for names, services, or neighborhoods."}
            </p>
          </div>
          {sortBy !== "recommended" ? (
            <Badge variant="warning" className="rounded-full px-3 py-1">
              Sorted by {sortBy.replace("-", " ")}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => <ProviderCardSkeleton key={index} />)
          ) : filteredProviders.length === 0 ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-stone-300 bg-white/75 px-6 py-16 text-center shadow-sm">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Search className="h-6 w-6 text-stone-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">No providers found</h3>
              <p className="mt-2 text-sm text-stone-500">
                Try widening the filters or clearing the search to bring more results back in.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
                <Button onClick={clearSearchAndFilters}>Reset search and filters</Button>
              </div>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onBook={handleBook} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <BrowsePageContent />
    </Suspense>
  );
}
