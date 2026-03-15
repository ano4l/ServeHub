"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Clock3,
  Droplets,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Repeat2,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  demoBookings,
  demoFeedPosts,
  homeHighlights,
  homeServices,
  orderHistory,
  profileAddresses,
  profileSettings,
  profileStats,
} from "@/lib/demo-data";

type AppTab = "home" | "explore" | "bookings" | "profile";
type FeedPost = (typeof demoFeedPosts)[number];
type FeedComment = FeedPost["comments"][number];

const serviceIcons = [Droplets, Sparkles, Zap, Wrench];

function parseCompactCount(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.endsWith("K")) return Math.round(Number(trimmed.slice(0, -1)) * 1000);
  if (trimmed.endsWith("M")) return Math.round(Number(trimmed.slice(0, -1)) * 1000000);
  return Number(trimmed.replace(/,/g, "")) || 0;
}

function compactCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
  return `${value}`;
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [address, setAddress] = useState("14 Beach Road, Sea Point");
  const [selectedBookingId, setSelectedBookingId] = useState(demoBookings[0].id);
  const [bookingMessages, setBookingMessages] = useState(
    Object.fromEntries(demoBookings.map((booking) => [booking.id, booking.thread])),
  );
  const [searchText, setSearchText] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>({});
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [feedComments, setFeedComments] = useState<Record<string, FeedComment[]>>(
    Object.fromEntries(demoFeedPosts.map((post) => [post.id, post.comments])),
  );
  const [feedStats, setFeedStats] = useState(
    Object.fromEntries(
      demoFeedPosts.map((post) => [
        post.id,
        {
          likes: parseCompactCount(post.stats.likes),
          comments: parseCompactCount(post.stats.comments),
          reposts: parseCompactCount(post.stats.reposts),
        },
      ]),
    ) as Record<string, { likes: number; comments: number; reposts: number }>,
  );

  useEffect(() => {
    if (!openCommentsFor) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenCommentsFor(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCommentsFor]);

  const selectedBooking = useMemo(
    () => demoBookings.find((booking) => booking.id === selectedBookingId) ?? demoBookings[0],
    [selectedBookingId],
  );
  const currentMessages = bookingMessages[selectedBooking.id] ?? selectedBooking.thread;
  const filteredServices = useMemo(
    () =>
      homeServices.filter((service) =>
        `${service.title} ${service.subtitle} ${service.provider} ${service.category}`
          .toLowerCase()
          .includes(searchText.toLowerCase()),
      ),
    [searchText],
  );
  const filteredFeedPosts = useMemo(
    () =>
      demoFeedPosts.filter((post) =>
        `${post.provider} ${post.category} ${post.headline} ${post.caption} ${post.location}`
          .toLowerCase()
          .includes(searchText.toLowerCase()),
      ),
    [searchText],
  );
  const openCommentPost =
    demoFeedPosts.find((post) => post.id === openCommentsFor) ?? filteredFeedPosts[0] ?? null;

  const sendBookingMessage = (text: string) => {
    setBookingMessages((current) => ({
      ...current,
      [selectedBooking.id]: [
        ...(current[selectedBooking.id] ?? selectedBooking.thread),
        {
          id: `${selectedBooking.id}-${Date.now()}`,
          sender: "You",
          text,
          time: "Now",
          own: true,
        },
      ],
    }));
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((current) => {
      const nextValue = !current[postId];
      setFeedStats((currentStats) => ({
        ...currentStats,
        [postId]: {
          ...currentStats[postId],
          likes: currentStats[postId].likes + (nextValue ? 1 : -1),
        },
      }));
      return { ...current, [postId]: nextValue };
    });
  };

  const toggleRepost = (postId: string) => {
    setRepostedPosts((current) => {
      const nextValue = !current[postId];
      setFeedStats((currentStats) => ({
        ...currentStats,
        [postId]: {
          ...currentStats[postId],
          reposts: currentStats[postId].reposts + (nextValue ? 1 : -1),
        },
      }));
      return { ...current, [postId]: nextValue };
    });
  };

  const submitComment = (postId: string) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    setFeedComments((current) => ({
      ...current,
      [postId]: [
        {
          id: `${postId}-${Date.now()}`,
          author: "You",
          handle: "@you",
          text: draft,
        },
        ...(current[postId] ?? []),
      ],
    }));
    setFeedStats((current) => ({
      ...current,
      [postId]: {
        ...current[postId],
        comments: current[postId].comments + 1,
      },
    }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />

      <div
        className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <div
          className={`min-h-screen ${activeTab === "explore" ? "pb-0" : ""}`}
          style={{
            paddingBottom:
              activeTab === "explore"
                ? "calc(5.8rem + env(safe-area-inset-bottom, 0px))"
                : "calc(6.6rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>

          {activeTab === "home" ? (
            <div className="animate-fade-in">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Homepage
                  </p>
                  <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em]">
                    Good morning, Ano
                  </h1>
                </div>
                <Avatar name="Ano" size="md" />
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <Input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Enter address"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  className="h-12 rounded-full border-white/8 bg-white text-slate-950 placeholder:text-slate-400"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Home", value: "14 Beach Road, Sea Point" },
                    { label: "Office", value: "97 Bree Street, Cape Town" },
                    { label: "Mom's house", value: "40 Main Road, Green Point" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setAddress(item.value)}
                      className="min-h-11 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/72"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_52%,#ff9d7d_100%)] p-5 text-slate-950">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                  Recommended right now
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  Book a verified pro in under 2 minutes
                </h2>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  {homeHighlights.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
                <Button
                  className="mt-4 min-h-11 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-900"
                  onClick={() => setActiveTab("explore")}
                >
                  Browse live feed
                </Button>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Find something fast</p>
                    <p className="text-xs text-white/45">
                      Search services available near your address
                    </p>
                  </div>
                  <Search className="h-4 w-4 text-cyan-200" />
                </div>
                <div className="mt-3">
                  <Input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search cleaning, plumbing, electrical..."
                    leftIcon={<Search className="h-4 w-4" />}
                    className="h-12 rounded-full border-white/8 bg-black/20 text-white placeholder:text-white/35"
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                    Recommended services
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("explore")}
                    className="text-sm text-cyan-200"
                  >
                    See all
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {filteredServices.slice(0, 6).map((service, index) => {
                    const Icon = serviceIcons[index % serviceIcons.length];
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setActiveTab("explore")}
                        className={`relative min-w-[260px] overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br ${service.accent} p-4 text-left text-white`}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-35"
                          style={{ backgroundImage: `url(${service.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,15,28,0.94),rgba(8,15,28,0.18))]" />
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-medium">
                              {service.badge}
                            </span>
                            <Icon className="h-5 w-5 text-white/86" />
                          </div>
                          <h4 className="mt-10 text-xl font-semibold">{service.title}</h4>
                          <p className="mt-1 text-sm text-white/72">{service.subtitle}</p>
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/24 px-3 py-2 text-sm">
                            <Clock3 className="h-4 w-4" />
                            {service.eta}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                    Last services booked
                  </h3>
                  <span className="text-xs text-white/45">Rebook fast</span>
                </div>
                {orderHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-white/55">{item.provider}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/72">
                        {item.price}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                      <span>{item.date}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("bookings")}
                        className="text-cyan-200"
                      >
                        Rebook
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                    Current bookings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bookings")}
                    className="text-sm text-cyan-200"
                  >
                    Open
                  </button>
                </div>
                {demoBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => {
                      setSelectedBookingId(booking.id);
                      setActiveTab("bookings");
                    }}
                    className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-white/8 p-4 text-left backdrop-blur-md"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
                      style={{ backgroundImage: `url(${booking.imageUrl})` }}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.service}</p>
                        <p className="mt-1 text-sm text-white/55">{booking.provider}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {booking.status}
                      </span>
                    </div>
                    <div className="relative mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#8ef7d6_0%,#7dd3fc_100%)]"
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>
                    <div className="relative mt-3 flex items-center justify-between text-xs text-white/50">
                      <span>{booking.scheduledFor}</span>
                      <span>{booking.eta}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "explore" ? (
            <div className="animate-fade-in mt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Explore
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                    Live service feed
                  </h2>
                </div>
                <div className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/70">
                  Scroll the feed
                </div>
              </div>

              <div className="mb-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search posts, providers, categories..."
                  leftIcon={<Search className="h-4 w-4" />}
                  className="h-12 rounded-full border-white/8 bg-black/20 text-white placeholder:text-white/35"
                />
              </div>

              <div className="h-[calc(100vh-15rem)] snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth">
                <div className="space-y-4 pb-10">
                  {filteredFeedPosts.map((post, postIndex) => {
                    const stats = feedStats[post.id];
                    const comments = feedComments[post.id] ?? [];

                    return (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: postIndex * 0.03 }}
                        className="relative min-h-[calc(100vh-15rem)] snap-start overflow-hidden rounded-[30px] border border-white/10 bg-black/20"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${post.accent}`} />
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-28 mix-blend-screen"
                          style={{ backgroundImage: `url(${post.imageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,11,20,0.98),rgba(5,11,20,0.18)_56%,rgba(5,11,20,0.04))]" />

                        <div className="relative flex h-full flex-col justify-between p-5">
                          <div>
                            <div className="mb-4 flex gap-1">
                              {demoFeedPosts.map((feedPost, index) => (
                                <div
                                  key={feedPost.id}
                                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                                >
                                  <div
                                    className="h-full rounded-full bg-white"
                                    style={{
                                      width:
                                        demoFeedPosts.findIndex((item) => item.id === post.id) >=
                                        index
                                          ? "100%"
                                          : "0%",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-3">
                              <Avatar src={post.avatarUrl} name={post.provider} size="lg" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold">{post.provider}</p>
                                  <BadgeCheck className="h-4 w-4 text-cyan-200" />
                                </div>
                                <p className="text-xs text-white/62">
                                  {post.category} | {post.location}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-end gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex flex-wrap gap-2">
                                {post.moments.map((moment) => (
                                  <span
                                    key={moment}
                                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/88"
                                  >
                                    {moment}
                                  </span>
                                ))}
                              </div>
                              <h3 className="max-w-[16rem] text-3xl font-semibold leading-tight tracking-[-0.04em]">
                                {post.headline}
                              </h3>
                              <p className="mt-3 max-w-[17rem] text-sm leading-6 text-white/82">
                                {post.caption}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100/80">
                                {post.hashtags.map((tag) => (
                                  <span key={tag}>{tag}</span>
                                ))}
                              </div>
                              <div className="mt-4 flex items-center gap-3 text-xs text-white/66">
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                                  {post.rating.toFixed(1)}
                                </span>
                                <span>{post.reviews} reviews</span>
                              </div>
                              {comments.length > 0 ? (
                                <div className="mt-4 rounded-[20px] border border-white/8 bg-white/8 p-3 text-sm text-white/78">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                                      Community
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setOpenCommentsFor(post.id)}
                                      className="text-xs font-semibold text-cyan-200"
                                    >
                                      Open thread
                                    </button>
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    {comments.slice(0, 2).map((comment) => (
                                      <div key={comment.id}>
                                        <div className="flex items-center gap-2 text-xs text-white/52">
                                          <span className="font-semibold text-white/86">
                                            {comment.author}
                                          </span>
                                          <span>{comment.handle}</span>
                                        </div>
                                        <p className="mt-1 leading-5">{comment.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              <Button
                                className="mt-4 min-h-11 rounded-full bg-white px-5 text-slate-950 hover:bg-white/92"
                                onClick={() => setActiveTab("bookings")}
                              >
                                Book now
                              </Button>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleLike(post.id)}
                                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                                  likedPosts[post.id]
                                    ? "bg-rose-500 text-white"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                <Heart
                                  className={`h-5 w-5 ${likedPosts[post.id] ? "fill-current" : ""}`}
                                />
                              </button>
                              <span className="text-xs text-white/70">
                                {compactCount(stats.likes)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenCommentsFor(post.id)}
                                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white"
                              >
                                <MessageCircle className="h-5 w-5" />
                              </button>
                              <span className="text-xs text-white/70">
                                {compactCount(stats.comments)}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRepost(post.id)}
                                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                                  repostedPosts[post.id]
                                    ? "bg-emerald-400 text-slate-950"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                <Repeat2 className="h-5 w-5" />
                              </button>
                              <span className="text-xs text-white/70">
                                {compactCount(stats.reposts)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "bookings" ? (
            <div className="animate-fade-in">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Bookings
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">Your jobs</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/70"
                >
                  3 active
                </button>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {demoBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`min-w-[220px] rounded-[24px] border p-4 text-left ${
                      selectedBooking.id === booking.id
                        ? "border-cyan-300/45 bg-white/12"
                        : "border-white/10 bg-white/8"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{booking.service}</p>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/72">
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/55">{booking.provider}</p>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${booking.accent}`}
                        style={{ width: `${booking.progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                      <span>{booking.scheduledFor}</span>
                      <span>{booking.price}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] p-5 text-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Selected booking
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{selectedBooking.service}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedBooking.provider} | {selectedBooking.providerRole}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 rounded-[22px] bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between text-sm">
                    <span>ETA</span>
                    <span className="font-semibold">{selectedBooking.eta}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Scheduled</span>
                    <span className="font-semibold">{selectedBooking.scheduledFor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Address</span>
                    <span className="max-w-[11rem] text-right font-semibold">
                      {selectedBooking.address}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedBooking.checklist.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          item.complete ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <p className="text-sm font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Booking chat</p>
                    <p className="text-xs text-white/45">
                      Integrated messaging in the same job flow
                    </p>
                  </div>
                  <MessageCircle className="h-4 w-4 text-cyan-200" />
                </div>

                <div className="space-y-3">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.own ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[20px] px-4 py-3 ${
                          message.own ? "bg-cyan-400 text-slate-950" : "bg-black/20 text-white"
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                          {message.sender}
                        </p>
                        <p className="mt-1 text-sm leading-6">{message.text}</p>
                        <p className="mt-2 text-[11px] opacity-60">{message.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    "Please ring on arrival",
                    "Share updated quote",
                    "I added another issue",
                  ].map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => sendBookingMessage(text)}
                      className="min-h-11 shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => sendBookingMessage("Thanks, see you shortly.")}
                  className="mt-4 flex min-h-12 w-full items-center justify-between rounded-[20px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80"
                >
                  <span>Send quick update</span>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="animate-fade-in">
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                    Settings & profile
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                    Your account
                  </h2>
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,#132646_0%,#2457a5_100%)] p-5">
                <div className="flex items-start gap-4">
                  <Avatar
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80"
                    name="Ano D"
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-xl font-semibold">Ano Dzinotyiwei</h3>
                      <BadgeCheck className="h-4 w-4 text-cyan-200" />
                    </div>
                    <p className="mt-1 text-sm text-white/70">ano@example.com</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {profileStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="rounded-[18px] bg-white/10 px-3 py-3 text-center"
                        >
                          <p className="text-lg font-semibold">{stat.value}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/58">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold">Saved addresses</p>
                </div>
                <div className="space-y-3">
                  {profileAddresses.map((addressItem) => (
                    <div
                      key={addressItem.id}
                      className="rounded-[18px] bg-black/20 px-4 py-3"
                    >
                      <p className="text-sm font-medium">{addressItem.label}</p>
                      <p className="mt-1 text-xs text-white/52">{addressItem.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold">Preferences</p>
                </div>
                <div className="space-y-3">
                  {profileSettings.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-xs text-white/52">{item.value}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/35" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button className="min-h-12 flex-1 rounded-full bg-white text-slate-950 hover:bg-white/92">
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  className="min-h-12 flex-1 rounded-full border-white/12 bg-white/8 text-white hover:bg-white/12"
                >
                  Help
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#07101d]/95 px-3 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto grid max-w-[480px] grid-cols-4 gap-1">
          {[
            { id: "home" as const, label: "Home", icon: Home },
            { id: "explore" as const, label: "Explore", icon: Sparkles },
            { id: "bookings" as const, label: "Bookings", icon: MessageCircle },
            { id: "profile" as const, label: "Profile", icon: UserRound },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-pressed={active}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-xs ${
                  active ? "bg-white text-slate-950" : "text-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {openCommentPost ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            onClick={() => setOpenCommentsFor(null)}
          >
            <motion.div
              initial={{ y: 32 }}
              animate={{ y: 0 }}
              exit={{ y: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Comments for ${openCommentPost.provider}`}
              className="mx-auto w-full max-w-[430px] rounded-t-[28px] border border-white/10 bg-[#0b1423] p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/18" />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Comments
                  </p>
                  <h3 className="text-lg font-semibold">{openCommentPost.provider}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenCommentsFor(null)}
                  className="rounded-full bg-white/10 p-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </button>
              </div>

              <div className="space-y-3">
                {(feedComments[openCommentPost.id] ?? []).map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-[20px] border border-white/8 bg-white/6 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-white/45">{comment.handle}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/78">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={commentDrafts[openCommentPost.id] ?? ""}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [openCommentPost.id]: event.target.value,
                    }))
                  }
                  placeholder="Add a comment..."
                  className="h-12 rounded-full border-white/8 bg-white/8 text-white placeholder:text-white/35"
                />
                <Button
                  className="min-h-12 rounded-full bg-white px-5 text-slate-950 hover:bg-white/92"
                  onClick={() => submitComment(openCommentPost.id)}
                >
                  Post
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
