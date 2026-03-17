"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Navigation, Home, Briefcase, Loader2, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOME_ADDRESS_FIXTURES } from "@/lib/app-home-fixtures";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Search for an address...",
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("recentAddresses") || "[]");
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value
  useEffect(() => {
    if (value !== query && !isFocused) {
      setQuery(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: q,
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "za",
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "ServeHub/1.0",
          },
        }
      );

      if (res.ok) {
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      }
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setSuggestions([]);
      setIsOpen(isFocused && (recentSearches.length > 0 || HOME_ADDRESS_FIXTURES.length > 0));
      return;
    }

    debounceRef.current = setTimeout(() => searchAddress(val), 350);
  };

  const selectAddress = (address: string, lat?: number, lng?: number) => {
    setQuery(address);
    onChange(address, lat, lng);
    setIsOpen(false);
    setSuggestions([]);

    // Save to recent searches
    if (typeof window !== "undefined") {
      try {
        const recent = JSON.parse(localStorage.getItem("recentAddresses") || "[]") as string[];
        const updated = [address, ...recent.filter((a) => a !== address)].slice(0, 5);
        localStorage.setItem("recentAddresses", JSON.stringify(updated));
      } catch {}
    }
  };

  const formatSuggestion = (result: NominatimResult) => {
    const parts = result.display_name.split(",").map((s) => s.trim());
    const primary = parts.slice(0, 2).join(", ");
    const secondary = parts.slice(2, 4).join(", ");
    return { primary, secondary };
  };

  const clearInput = () => {
    setQuery("");
    onChange("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const showSavedAddresses = isFocused && query.length < 3 && suggestions.length === 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input */}
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          ) : (
            <MapPin className="h-4 w-4 text-white/40" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full rounded-2xl border bg-white/5 py-3.5 pl-11 pr-10 text-sm text-white",
            "placeholder:text-white/35 transition-all outline-none",
            isFocused
              ? "border-cyan-400/50 bg-white/8 ring-1 ring-cyan-400/20"
              : "border-white/10 hover:border-white/20",
          )}
        />
        {query && (
          <button
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#0c1a2e]/98 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Saved addresses section */}
          {showSavedAddresses && (
            <>
              <div className="px-4 pt-3 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  Saved places
                </p>
              </div>
              {HOME_ADDRESS_FIXTURES.map((addr) => {
                const IconComponent = addr.label === "Home" ? Home : addr.label === "Office" ? Briefcase : MapPin;
                return (
                  <button
                    key={addr.id}
                    onClick={() => selectAddress(addr.value, addr.lat, addr.lng)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/6 active:bg-white/10"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                      <IconComponent className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90">{addr.label}</p>
                      <p className="truncate text-xs text-white/45">{addr.value}</p>
                    </div>
                  </button>
                );
              })}

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <>
                  <div className="mx-4 border-t border-white/6" />
                  <div className="px-4 pt-3 pb-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                      Recent
                    </p>
                  </div>
                  {recentSearches.slice(0, 3).map((addr, i) => (
                    <button
                      key={i}
                      onClick={() => selectAddress(addr)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/6 active:bg-white/10"
                    >
                      <Clock className="h-4 w-4 flex-shrink-0 text-white/30" />
                      <span className="truncate text-sm text-white/65">{addr}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}

          {/* Search results */}
          {suggestions.length > 0 && (
            <>
              {!showSavedAddresses && (
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    Results
                  </p>
                </div>
              )}
              {suggestions.map((result) => {
                const { primary, secondary } = formatSuggestion(result);
                return (
                  <button
                    key={result.place_id}
                    onClick={() =>
                      selectAddress(
                        result.display_name,
                        parseFloat(result.lat),
                        parseFloat(result.lon),
                      )
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/6 active:bg-white/10"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/6">
                      <Navigation className="h-4 w-4 text-white/50" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90 truncate">{primary}</p>
                      <p className="text-xs text-white/40 truncate">{secondary}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Loading state */}
          {isLoading && suggestions.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400/60" />
              <span className="ml-2 text-sm text-white/40">Searching…</span>
            </div>
          )}

          {/* No results */}
          {!isLoading && query.length >= 3 && suggestions.length === 0 && (
            <div className="py-6 text-center">
              <MapPin className="mx-auto h-6 w-6 text-white/15" />
              <p className="mt-2 text-sm text-white/40">No addresses found</p>
              <p className="text-xs text-white/25">Try a different search term</p>
            </div>
          )}

          {/* Use current location */}
          <div className="border-t border-white/6 p-2">
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      try {
                        const res = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
                          { headers: { "User-Agent": "ServeHub/1.0" } }
                        );
                        if (res.ok) {
                          const data = await res.json();
                          selectAddress(
                            data.display_name,
                            pos.coords.latitude,
                            pos.coords.longitude,
                          );
                        }
                      } catch {}
                    },
                    () => {},
                    { enableHighAccuracy: true }
                  );
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/6 active:bg-white/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
                <Navigation className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-blue-300">Use current location</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
