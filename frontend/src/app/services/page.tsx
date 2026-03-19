"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Star,
  X,
  Zap,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { cn } from "@/lib/utils";
import {
  SERVICE_CATEGORIES,
  ALL_SERVICES,
  type ServiceCategory,
  type ServiceItem,
} from "@/lib/services-directory";

export default function ServicesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !selectedCategoryId) return null; // show category grid
    let results = selectedCategoryId
      ? ALL_SERVICES.filter((s) => s.categoryId === selectedCategoryId)
      : ALL_SERVICES;
    if (q) {
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          SERVICE_CATEGORIES.find((c) => c.id === s.categoryId)
            ?.name.toLowerCase()
            .includes(q),
      );
    }
    return results;
  }, [query, selectedCategoryId]);

  const selectedCategory = selectedCategoryId
    ? SERVICE_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null
    : null;

  const handleServiceTap = (service: ServiceItem) => {
    const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
    sessionStorage.setItem(
      "bookingData",
      JSON.stringify({
        service: service.name,
        category: cat?.name ?? "",
      }),
    );
    router.push("/book");
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%)]" />
      <AppTabs />

      <div className="relative mx-auto max-w-3xl pb-24">
        {/* ─── Sticky header ─── */}
        <div className="sticky top-0 z-40 bg-[#07111f]/95 backdrop-blur-xl">
          <div className="px-4 pb-3 pt-4 sm:px-6">
            {/* Top bar */}
            <div className="flex items-center gap-3">
              {selectedCategoryId ? (
                <button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setQuery("");
                  }}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/8 active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5 text-white/70" />
                </button>
              ) : null}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    selectedCategory
                      ? `Search ${selectedCategory.name}…`
                      : "Search all 100 services…"
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/6 pl-11 pr-10 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-white/20 focus:bg-white/8"
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Horizontal category chips (always visible) */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setQuery("");
                }}
                className={cn(
                  "flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-all active:scale-95",
                  !selectedCategoryId
                    ? "bg-white text-[#07111f]"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/8",
                )}
              >
                All
              </button>
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    "flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-all active:scale-95",
                    selectedCategoryId === cat.id
                      ? "bg-white text-[#07111f]"
                      : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/8",
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span className="hidden sm:inline">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="h-px bg-white/6" />
        </div>

        {/* ─── Content ─── */}
        <div className="px-4 pt-5 sm:px-6">
          {/* Category grid (default view) */}
          {filtered === null && !selectedCategoryId ? (
            <>
              {/* Popular services */}
              <div className="mb-8">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h2 className="text-[15px] font-semibold">Popular right now</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ALL_SERVICES.filter((s) => s.popular)
                    .slice(0, 9)
                    .map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onTap={handleServiceTap}
                      />
                    ))}
                </div>
              </div>

              {/* All categories */}
              <h2 className="text-[15px] font-semibold">All categories</h2>
              <p className="mt-1 text-xs text-white/40">
                {SERVICE_CATEGORIES.length} categories · {ALL_SERVICES.length} services
              </p>
              <div className="mt-4 space-y-3">
                {SERVICE_CATEGORIES.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    onTap={() => setSelectedCategoryId(cat.id)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {/* Category detail view */}
          {selectedCategory && filtered ? (
            <>
              {/* Category hero */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCategory.emoji}</span>
                  <div>
                    <h1 className="text-xl font-semibold">{selectedCategory.name}</h1>
                    <p className="text-sm text-white/40">
                      {selectedCategory.services.length} services available
                    </p>
                  </div>
                </div>
              </div>

              {/* Service grid */}
              {filtered.length === 0 ? (
                <EmptyState query={query} onClear={() => setQuery("")} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filtered.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onTap={handleServiceTap}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}

          {/* Search results (no category selected) */}
          {query && !selectedCategoryId && filtered ? (
            <>
              <p className="mb-4 text-sm text-white/40">
                {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
              </p>
              {filtered.length === 0 ? (
                <EmptyState query={query} onClear={() => setQuery("")} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filtered.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onTap={handleServiceTap}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Service card (Uber Eats style) ───
function ServiceCard({
  service,
  onTap,
}: {
  service: ServiceItem;
  onTap: (s: ServiceItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);

  return (
    <button
      onClick={() => onTap(service)}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 text-left transition-all active:scale-[0.97] hover:border-white/15 hover:bg-white/6"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
        <img
          src={service.imageUrl}
          alt={service.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-all duration-500",
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          )}
        />
        {/* Shimmer placeholder */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/20 to-transparent" />
        {service.popular && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Star className="h-2.5 w-2.5 fill-current" />
            Popular
          </div>
        )}
      </div>
      {/* Label */}
      <div className="p-3">
        <p className="text-[13px] font-medium leading-tight text-white/90 line-clamp-2">
          {service.name}
        </p>
        {cat && (
          <p className="mt-1 text-[11px] text-white/35">{cat.emoji} {cat.name}</p>
        )}
      </div>
    </button>
  );
}

// ─── Category row ───
function CategoryRow({
  category,
  onTap,
}: {
  category: ServiceCategory;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4 text-left transition-all active:scale-[0.98] hover:border-white/12 hover:bg-white/6"
    >
      <div
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl",
          category.color,
        )}
      >
        {category.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{category.name}</p>
        <p className="mt-0.5 text-xs text-white/40">
          {category.services.length} services
        </p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/25" />
    </button>
  );
}

// ─── Empty state ───
function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/6">
        <Search className="h-6 w-6 text-white/25" />
      </div>
      <p className="mt-4 font-medium text-white/60">No services found</p>
      <p className="mt-1 text-sm text-white/30">
        No match for &ldquo;{query}&rdquo;. Try a different term.
      </p>
      <button
        onClick={onClear}
        className="mt-4 rounded-full bg-white/8 px-5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/12"
      >
        Clear search
      </button>
    </div>
  );
}
