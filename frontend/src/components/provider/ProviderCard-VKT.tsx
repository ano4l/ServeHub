"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin, ShieldCheck, Star, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

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
  className?: string;
}

export function ProviderCard({ provider, onBook, className }: ProviderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("liquid-panel glass-hairline overflow-hidden rounded-[30px] shadow-[0_16px_40px_rgba(61,89,131,0.14)]", className)}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Avatar src={provider.avatar} name={provider.name} size="lg" online={provider.availableNow} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={`/providers/${provider.id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-sky-800">
                {provider.name}
              </Link>
              {provider.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-sky-500" />}
              {provider.availableNow && (
                <Badge variant="success" className="border-emerald-200 bg-emerald-100/80 text-[10px] py-0 text-emerald-700">
                  Live
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{provider.category}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-slate-700">{provider.rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({provider.reviewCount})</span>
              </div>
              {provider.distanceKm !== undefined && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {provider.distanceKm.toFixed(1)} km
                </div>
              )}
              {provider.responseTime && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {provider.responseTime}
                </div>
              )}
            </div>
          </div>
        </div>

        {provider.bio && <p className="mt-4 text-sm leading-6 text-slate-600 line-clamp-2">{provider.bio}</p>}

        {provider.tags && provider.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {provider.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border border-white/80 bg-white/58 px-3 py-1 text-[11px] font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/70 bg-white/42 px-5 py-4">
        <div>
          {provider.startingPrice !== undefined ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Starting from</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(provider.startingPrice)}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Price on request</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/providers/${provider.id}`}>Profile</Link>
          </Button>
          <Button variant="primary" size="sm" onClick={() => onBook?.(provider.id)}>
            <Zap className="h-3.5 w-3.5" />
            Book
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
