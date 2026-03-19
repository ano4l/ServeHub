"use client";
import { Star, MapPin, ShieldCheck, Clock, Zap, ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface ProviderCardData {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  distanceKm?: number;
  startingPrice?: number;
  verified: boolean;
  category: string;
  responseTime?: string;
  completionRate?: number;
  bio?: string;
  tags?: string[];
  availableNow?: boolean;
}

interface ProviderCardProps {
  provider: ProviderCardData;
  onBook?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  addedToCart?: boolean;
  className?: string;
}

export function ProviderCard({ provider, onBook, onAddToCart, addedToCart, className }: ProviderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group rounded-2xl bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-md hover:shadow-stone-900/5 transition-all duration-200 overflow-hidden",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar
              src={provider.avatar}
              name={provider.name}
              size="lg"
              online={provider.availableNow}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/providers/${provider.id}`}
                className="font-semibold text-stone-900 hover:text-stone-700 truncate text-sm"
              >
                {provider.name}
              </Link>
              {provider.verified && (
                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              {provider.availableNow && (
                <Badge variant="success" className="text-[10px] py-0">
                  Available
                </Badge>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{provider.category}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-stone-700">{provider.rating.toFixed(1)}</span>
                <span className="text-xs text-stone-400">({provider.reviewCount})</span>
              </div>
              {provider.distanceKm !== undefined && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-stone-400" />
                  <span className="text-xs text-stone-500">{provider.distanceKm.toFixed(1)} km</span>
                </div>
              )}
              {provider.responseTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-stone-400" />
                  <span className="text-xs text-stone-500">{provider.responseTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {provider.bio && (
          <p className="mt-3 text-xs text-stone-500 leading-relaxed line-clamp-2">{provider.bio}</p>
        )}

        {provider.tags && provider.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {provider.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-t border-stone-100">
        <div>
          {provider.startingPrice !== undefined ? (
            <div>
              <span className="text-xs text-stone-400">From</span>
              <span className="ml-1 font-bold text-stone-900">
                {formatCurrency(provider.startingPrice)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-stone-400">Price on request</span>
          )}
        </div>
        <div className="flex gap-2">
          {onAddToCart && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAddToCart(provider.id)}
              className={addedToCart ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""}
            >
              {addedToCart ? (
                <><Check className="h-3.5 w-3.5" /> Added</>
              ) : (
                <><ShoppingCart className="h-3.5 w-3.5" /> Cart</>
              )}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            asChild
          >
            <Link href={`/providers/${provider.id}`}>View Profile</Link>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onBook?.(provider.id)}
          >
            <Zap className="h-3.5 w-3.5" />
            Book
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
