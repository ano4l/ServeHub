"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Filter, Heart, MessageCircle, Play, Repeat2, Search, Sparkles, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { providersApi } from "@/lib/api";
import { SERVICE_CATEGORIES, USER_ROLES } from "@/lib/constants";
import { demoProviders } from "@/lib/demo-data";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

interface ApiProviderResponse {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  category: string;
  bio?: string;
  tags?: string[];
  availableNow?: boolean;
}

interface FeedComment {
  id: string;
  author: string;
  handle: string;
  text: string;
  timeAgo: string;
}

interface FeedPost extends ApiProviderResponse {
  postId: string;
  mediaType: "video" | "photo";
  headline: string;
  caption: string;
  hashtags: string[];
  publishedAt: string;
  likes: number;
  commentsCount: number;
  reposts: number;
  comments: FeedComment[];
  accent: string;
}

const FEED_BACKDROPS = [
  "from-orange-500 via-rose-500 to-fuchsia-700",
  "from-cyan-500 via-sky-600 to-indigo-700",
  "from-emerald-500 via-teal-600 to-cyan-800",
  "from-amber-400 via-orange-500 to-red-700",
];

function compactCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
  return `${value}`;
}

function buildBaseComments(provider: ApiProviderResponse, index: number): FeedComment[] {
  return [
    {
      id: `${provider.id}-comment-1`,
      author: "A. Mokoena",
      handle: "@amokoena",
      text: `This content makes ${provider.name} feel like a real brand, not just a listing.`,
      timeAgo: `${2 + index}h`,
    },
    {
      id: `${provider.id}-comment-2`,
      author: "N. Daniels",
      handle: "@ndaniels",
      text: `More businesses should post their actual process like this.`,
      timeAgo: `${5 + index}h`,
    },
  ];
}

function buildFeedPost(provider: ApiProviderResponse, index: number): FeedPost {
  const hashtags = provider.tags?.slice(0, 3).map((tag) => `#${tag.replace(/\s+/g, "")}`) ?? [];
  const comments = buildBaseComments(provider, index);

  return {
    ...provider,
    postId: `${provider.id}-post`,
    mediaType: index % 2 === 0 ? "video" : "photo",
    headline: provider.tags?.[0] ? `${provider.tags[0]} behind the scenes` : `${provider.category} content drop`,
    caption: provider.bio?.trim() || `${provider.name} is using the feed like a business social channel.`,
    hashtags: hashtags.length > 0 ? hashtags : [`#${provider.category.replace(/\s+/g, "")}`, "#ServeHub", "#BusinessContent"],
    publishedAt: `${index + 1}h ago`,
    likes: Math.round(provider.reviewCount * 40 + provider.rating * 120 + index * 41),
    commentsCount: comments.length + Math.max(6, Math.round(provider.reviewCount / 4)),
    reposts: Math.round(provider.reviewCount * 6 + 14 + index * 9),
    comments,
    accent: FEED_BACKDROPS[index % FEED_BACKDROPS.length],
  };
}

function toDemoProviderResponse(provider: (typeof demoProviders)[number]): ApiProviderResponse {
  return {
    id: provider.id,
    name: provider.name,
    rating: provider.rating,
    reviewCount: provider.reviews,
    verified: provider.verified,
    category: provider.category,
    bio: provider.caption,
    tags: [provider.neighborhood, "ServeHub"],
    availableNow: true,
  };
}

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const { addToast } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();
  const [providers, setProviders] = useState<ApiProviderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") ?? "");
  const [sortBy, setSortBy] = useState("recommended");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [extraComments, setExtraComments] = useState<Record<string, FeedComment[]>>({});
  const [filters, setFilters] = useState({
    verifiedOnly: searchParams.get("verified") === "true",
    availableToday: searchParams.get("available") === "true",
    minRating: searchParams.get("rating") ? Number(searchParams.get("rating")) : 0,
  });
  const isDemoMode = searchParams.get("demo") === "1";

  const canEngage = isAuthenticated && user?.activeRole === USER_ROLES.CUSTOMER;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (isDemoMode) {
        setProviders(demoProviders.map(toDemoProviderResponse));
        setLoading(false);
        return;
      }
      try {
        const res = await providersApi.getAll({
          lat: -33.9249,
          lng: 18.4241,
          categoryId: selectedCategory || undefined,
          verifiedOnly: filters.verifiedOnly,
          availableToday: filters.availableToday,
          minRating: filters.minRating,
          sort: sortBy,
        });
        const data: ApiProviderResponse[] = res.data.content ?? [];
        setProviders(data);
      } catch {
        addToast({ type: "error", message: "Failed to load business feed" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [addToast, filters.availableToday, filters.minRating, filters.verifiedOnly, isDemoMode, selectedCategory, sortBy]);

  const filteredProviders = useMemo(() => {
    const filtered = providers.filter((provider) => {
      const matchesSearch =
        !search ||
        provider.name.toLowerCase().includes(search.toLowerCase()) ||
        provider.category.toLowerCase().includes(search.toLowerCase()) ||
        provider.bio?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || provider.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesVerified = !filters.verifiedOnly || provider.verified;
      const matchesAvailable = !filters.availableToday || provider.availableNow;
      const matchesRating = !filters.minRating || provider.rating >= filters.minRating;
      return matchesSearch && matchesCategory && matchesVerified && matchesAvailable && matchesRating;
    });

    filtered.sort((a, b) => {
      if (sortBy === "top-rated") return b.rating === a.rating ? b.reviewCount - a.reviewCount : b.rating - a.rating;
      if (sortBy === "recent") return b.reviewCount - a.reviewCount;
      const scoreA = (a.verified ? 10 : 0) + a.rating * 2 + Math.log(a.reviewCount + 1);
      const scoreB = (b.verified ? 10 : 0) + b.rating * 2 + Math.log(b.reviewCount + 1);
      return scoreB - scoreA;
    });

    return filtered;
  }, [filters, providers, search, selectedCategory, sortBy]);

  const posts = useMemo(() => {
    return filteredProviders.map((provider, index) => {
      const post = buildFeedPost(provider, index);
      const addedComments = extraComments[post.postId] ?? [];
      return {
        ...post,
        likes: post.likes + (likedPosts[post.postId] ? 1 : 0),
        reposts: post.reposts + (repostedPosts[post.postId] ? 1 : 0),
        comments: [...addedComments, ...post.comments],
        commentsCount: post.commentsCount + addedComments.length,
      };
    });
  }, [extraComments, filteredProviders, likedPosts, repostedPosts]);

  const activePost = posts.find((post) => post.postId === activePostId) ?? null;
  const activeFilterCount = Object.values(filters).filter((value) => value !== false && value !== 0).length + (selectedCategory ? 1 : 0) + (search ? 1 : 0);

  const requireCustomer = () => {
    if (canEngage) return true;
    addToast({
      type: "info",
      message: isAuthenticated ? "Switch to a customer account to engage with posts." : "Sign in as a customer to engage with posts.",
    });
    return false;
  };

  const submitComment = (postId: string) => {
    if (!requireCustomer()) return;
    const draft = commentDrafts[postId]?.trim();
    if (!draft) {
      addToast({ type: "info", message: "Write a comment before posting." });
      return;
    }

    const author = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email ?? "Customer";
    const handle = user?.firstName ? `@${user.firstName}`.toLowerCase() : "@customer";

    setExtraComments((current) => ({
      ...current,
      [postId]: [{ id: `${postId}-${Date.now()}`, author, handle, text: draft, timeAgo: "now" }, ...(current[postId] ?? [])],
    }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    addToast({ type: "success", message: "Comment posted." });
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-6">
        <div className="sticky top-0 z-40 rounded-[2rem] border border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50"><Sparkles className="h-3.5 w-3.5" />Business social feed</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Businesses post. Customers like, comment, and repost.</h1>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business posts, industries, captions..." className="h-12 rounded-full border-white/10 bg-white/8 pl-10 text-white placeholder:text-white/40" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button variant="outline" onClick={() => setFiltersOpen((open) => !open)} className="rounded-full border-white/15 bg-white/8 text-white hover:bg-white/12"><Filter className="h-4 w-4" />Filters{activeFilterCount > 0 ? <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">{activeFilterCount}</span> : null}</Button>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 rounded-full border border-white/15 bg-white/8 px-4 text-sm text-white outline-none">
                <option value="recommended" className="text-black">Recommended</option>
                <option value="recent" className="text-black">Most active</option>
                <option value="top-rated" className="text-black">Top rated</option>
              </select>
            </div>
          </div>
          <div className="mt-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72">
            {isDemoMode
              ? "Investor demo mode is active. This feed is running on seeded data, so it stays clickable without the backend."
              : canEngage
                ? "You are in customer mode. You can like, comment, and repost posts in this feed."
                : isAuthenticated
                  ? "This account can browse, but only customer accounts can engage."
                  : "Browse freely. Sign in as a customer to like, comment, or repost posts."}
          </div>
          <AnimatePresence>
            {filtersOpen ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 md:grid-cols-3">
                  <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-white outline-none">
                    <option value="" className="text-black">All categories</option>
                    {SERVICE_CATEGORIES.map((category) => <option key={category.id} value={category.label} className="text-black">{category.label}</option>)}
                  </select>
                  <select value={filters.minRating} onChange={(event) => setFilters((current) => ({ ...current, minRating: Number(event.target.value) }))} className="h-11 rounded-2xl border border-white/10 bg-black/30 px-3 text-white outline-none">
                    <option value="0" className="text-black">Any rating</option>
                    <option value="3" className="text-black">3+ stars</option>
                    <option value="4" className="text-black">4+ stars</option>
                    <option value="4.5" className="text-black">4.5+ stars</option>
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80"><input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => setFilters((current) => ({ ...current, verifiedOnly: event.target.checked }))} />Verified</label>
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80"><input type="checkbox" checked={filters.availableToday} onChange={(event) => setFilters((current) => ({ ...current, availableToday: event.target.checked }))} />Available now</label>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-6 h-[calc(100vh-11rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth pr-1">
          <div className="space-y-6 pb-10">
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={`relative mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-md snap-center items-end overflow-hidden rounded-[2rem] bg-gradient-to-br ${FEED_BACKDROPS[index % FEED_BACKDROPS.length]} p-6`} />
            )) : posts.length === 0 ? (
              <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/6 px-8 text-center">
                <Search className="mb-4 h-6 w-6 text-white/60" />
                <h2 className="text-xl font-semibold">No business posts match this feed</h2>
                <p className="mt-2 text-sm text-white/60">Adjust your filters to surface more business content.</p>
              </div>
            ) : posts.map((post, index) => (
              <motion.article key={post.postId} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.04 }} className="relative mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-md snap-center items-end overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${post.accent}`} />
                {post.avatar ? <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen" style={{ backgroundImage: `url(${post.avatar})` }} /> : null}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_28%),linear-gradient(to_top,rgba(10,10,10,0.97),rgba(10,10,10,0.22)55%,rgba(10,10,10,0.06))]" />
                <div className="relative z-10 w-full p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar src={post.avatar} name={post.name} size="lg" online={post.availableNow} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{post.name}</span>
                        {post.verified ? <BadgeCheck className="h-4 w-4 text-sky-300" /> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/72">
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{post.publishedAt}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">{post.mediaType === "video" ? <Play className="h-3 w-3 fill-current" /> : null}{post.mediaType === "video" ? "Campaign reel" : "Photo drop"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 flex gap-2">
                    <Badge className="rounded-full bg-white text-black hover:bg-white">{post.rating.toFixed(1)} stars</Badge>
                    <Badge className="rounded-full bg-white/12 text-white hover:bg-white/12">{compactCount(post.reviewCount)} reviews</Badge>
                  </div>
                  <h2 className="max-w-sm text-3xl font-semibold leading-tight sm:text-4xl">{post.headline}</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/84">{post.caption}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/80">{post.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                    <button type="button" onClick={() => requireCustomer() && setLikedPosts((current) => ({ ...current, [post.postId]: !current[post.postId] }))} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${likedPosts[post.postId] ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/18"}`}><Heart className={`h-4 w-4 ${likedPosts[post.postId] ? "fill-current" : ""}`} />Like<span className="text-xs opacity-85">{compactCount(post.likes)}</span></button>
                    <button type="button" onClick={() => setActivePostId(post.postId)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/18"><MessageCircle className="h-4 w-4" />Comment<span className="text-xs opacity-85">{compactCount(post.commentsCount)}</span></button>
                    <button type="button" onClick={() => requireCustomer() && setRepostedPosts((current) => ({ ...current, [post.postId]: !current[post.postId] }))} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${repostedPosts[post.postId] ? "bg-emerald-500 text-emerald-950" : "bg-white/10 text-white hover:bg-white/18"}`}><Repeat2 className="h-4 w-4" />Repost<span className="text-xs opacity-85">{compactCount(post.reposts)}</span></button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activePost ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Comments</p>
                  <h2 className="text-lg font-semibold">{activePost.name}</h2>
                </div>
                <button type="button" onClick={() => setActivePostId(null)} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/18"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {activePost.comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-white">{comment.author}</span>
                      <span className="text-white/45">{comment.handle}</span>
                      <span className="text-white/35">•</span>
                      <span className="text-white/45">{comment.timeAgo}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/82">{comment.text}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 px-5 py-4">
                <div className="mb-3 text-sm text-white/65">{canEngage ? "Comment as customer" : "Only customer accounts can post comments"}</div>
                <div className="flex gap-3">
                  <Input value={commentDrafts[activePost.postId] ?? ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [activePost.postId]: event.target.value }))} placeholder="Add a public comment..." className="h-12 rounded-full border-white/10 bg-white/8 text-white placeholder:text-white/35" />
                  <Button onClick={() => submitComment(activePost.postId)} className="rounded-full bg-white text-black hover:bg-white/90">Post</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808]" />}>
      <BrowsePageContent />
    </Suspense>
  );
}
