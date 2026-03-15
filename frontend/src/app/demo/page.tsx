"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
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

const serviceIcons = [Droplets, Sparkles, Zap, Wrench];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [address, setAddress] = useState("14 Beach Road, Sea Point");
  const [selectedBookingId, setSelectedBookingId] = useState(demoBookings[0].id);
  const [bookingMessages, setBookingMessages] = useState(
    Object.fromEntries(demoBookings.map((booking) => [booking.id, booking.thread]))
  );
  const [feedIndex, setFeedIndex] = useState(0);
  const [feedDirection, setFeedDirection] = useState(1);
  const [exploreProgress, setExploreProgress] = useState(0);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>({});
  const touchStartY = useRef<number | null>(null);
  const wheelLock = useRef(false);
  const dragY = useMotionValue(0);
  const activeCardScale = useTransform(dragY, [-220, 0, 220], [0.965, 1, 0.965]);
  const activeCardRotate = useTransform(dragY, [-220, 0, 220], [-1.5, 0, 1.5]);
  const activeCardBrightness = useTransform(dragY, [-220, 0, 220], [0.88, 1, 0.88]);

  const selectedBooking = useMemo(
    () => demoBookings.find((booking) => booking.id === selectedBookingId) ?? demoBookings[0],
    [selectedBookingId]
  );
  const activePost = demoFeedPosts[feedIndex];
  const nextPost = demoFeedPosts[(feedIndex + 1) % demoFeedPosts.length];
  const previousPost = demoFeedPosts[(feedIndex - 1 + demoFeedPosts.length) % demoFeedPosts.length];
  const currentMessages = bookingMessages[selectedBooking.id] ?? selectedBooking.thread;
  const filteredServices = homeServices.filter((service) =>
    `${service.title} ${service.subtitle}`.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectTab = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab !== "explore") {
      setExploreProgress(0);
    }
  };

  useEffect(() => {
    if (activeTab !== "explore") return;
    const timer = window.setInterval(() => {
      setExploreProgress((current) => {
        if (current >= 100) {
          setFeedDirection(1);
          setFeedIndex((prev) => (prev + 1) % demoFeedPosts.length);
          return 0;
        }
        return current + 2;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const moveFeed = (direction: 1 | -1) => {
    dragY.set(0);
    setFeedDirection(direction);
    setFeedIndex((current) => {
      const next = current + direction;
      if (next < 0) return demoFeedPosts.length - 1;
      if (next >= demoFeedPosts.length) return 0;
      return next;
    });
    setExploreProgress(0);
  };

  const onExploreDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipePower = Math.abs(info.offset.y) + Math.abs(info.velocity.y) * 0.18;
    if (swipePower < 140) {
      dragY.set(0);
      return;
    }
    moveFeed(info.offset.y > 0 ? -1 : 1);
  };

  const sendBookingMessage = (text: string) => {
    setBookingMessages((current) => ({
      ...current,
      [selectedBooking.id]: [
        ...(current[selectedBooking.id] ?? selectedBooking.thread),
        { id: `${selectedBooking.id}-${Date.now()}`, sender: "You", text, time: "Now", own: true },
      ],
    }));
  };

  const onExploreWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLock.current || Math.abs(event.deltaY) < 30) return;
    wheelLock.current = true;
    moveFeed(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 420);
  };

  const onExploreTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const onExploreTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current == null) return;
    const delta = touchStartY.current - (event.changedTouches[0]?.clientY ?? touchStartY.current);
    if (Math.abs(delta) > 45) moveFeed(delta > 0 ? 1 : -1);
    touchStartY.current = null;
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pt-4">
        <div
          className={`min-h-screen ${activeTab === "explore" ? "pb-0" : ""}`}
          style={{ paddingBottom: activeTab === "explore" ? "calc(5.6rem + env(safe-area-inset-bottom, 0px))" : "calc(6.4rem + env(safe-area-inset-bottom, 0px))" }}
        >
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <Bell className="h-3.5 w-3.5" />
                </div>
              </div>

              {activeTab === "home" && (
                <div className="animate-fade-in">
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Homepage</p>
                      <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em]">Good morning, Ano</h1>
                    </div>
                    <Avatar name="Ano" size="md" />
                  </div>

                  <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4">
                    <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter address" leftIcon={<MapPin className="h-4 w-4" />} rightIcon={<ChevronRight className="h-4 w-4" />} className="h-12 rounded-full border-white/8 bg-white text-slate-950 placeholder:text-slate-400" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Home", "Office", "Mom's house"].map((label) => (
                        <button key={label} type="button" onClick={() => setAddress(label === "Home" ? "14 Beach Road, Sea Point" : label === "Office" ? "97 Bree Street, Cape Town" : "40 Main Road, Green Point")} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/72">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_52%,#ff9d7d_100%)] p-5 text-slate-950">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">Recommended right now</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Book a verified pro in under 2 minutes</h2>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">{homeHighlights.map((item) => <p key={item}>{item}</p>)}</div>
                    <Button className="mt-4 bg-slate-950 text-white hover:bg-slate-900" onClick={() => selectTab("explore")}>Browse live feed</Button>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Find something fast</p>
                        <p className="text-xs text-white/45">Search services available near your address</p>
                      </div>
                      <Search className="h-4 w-4 text-cyan-200" />
                    </div>
                    <div className="mt-3">
                      <Input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search cleaning, plumbing, electrical..." leftIcon={<Search className="h-4 w-4" />} className="h-12 rounded-full border-white/8 bg-black/20 text-white placeholder:text-white/35" />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">Recommended services</h3>
                      <button type="button" onClick={() => selectTab("explore")} className="text-sm text-cyan-200">See all</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                      {filteredServices.map((service, index) => {
                        const Icon = serviceIcons[index % serviceIcons.length];
                        return (
                          <button key={service.id} type="button" onClick={() => selectTab("explore")} className={`relative min-w-[260px] overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br ${service.accent} p-4 text-left text-white`}>
                            <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${service.imageUrl})` }} />
                            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,15,28,0.94),rgba(8,15,28,0.18))]" />
                            <div className="relative">
                              <div className="flex items-center justify-between">
                                <span className="rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-medium">{service.badge}</span>
                                <Icon className="h-5 w-5 text-white/86" />
                              </div>
                              <h4 className="mt-10 text-xl font-semibold">{service.title}</h4>
                              <p className="mt-1 text-sm text-white/72">{service.subtitle}</p>
                              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/24 px-3 py-2 text-sm"><Clock3 className="h-4 w-4" />{service.eta}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">Last services booked</h3>
                      <span className="text-xs text-white/45">Rebook fast</span>
                    </div>
                    {orderHistory.map((item) => (
                      <div key={item.id} className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="mt-1 text-sm text-white/55">{item.provider}</p>
                          </div>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/72">{item.price}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                          <span>{item.date}</span>
                          <button type="button" onClick={() => selectTab("bookings")} className="text-cyan-200">Rebook</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">Current bookings</h3>
                      <button type="button" onClick={() => selectTab("bookings")} className="text-sm text-cyan-200">Open</button>
                    </div>
                    {demoBookings.map((booking) => (
                      <button key={booking.id} type="button" onClick={() => { setSelectedBookingId(booking.id); selectTab("bookings"); }} className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-white/8 p-4 text-left">
                        <div className="absolute inset-0 bg-cover bg-center opacity-[0.12]" style={{ backgroundImage: `url(${booking.imageUrl})` }} />
                        <div className="relative flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{booking.service}</p>
                            <p className="mt-1 text-sm text-white/55">{booking.provider}</p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{booking.status}</span>
                        </div>
                        <div className="relative mt-4 h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-[linear-gradient(90deg,#8ef7d6_0%,#7dd3fc_100%)]" style={{ width: `${booking.progress}%` }} />
                        </div>
                        <div className="relative mt-3 flex items-center justify-between text-xs text-white/50">
                          <span>{booking.scheduledFor}</span>
                          <span>{booking.eta}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "explore" && (
                <div className="animate-fade-in mt-4" onWheel={onExploreWheel} onTouchStart={onExploreTouchStart} onTouchEnd={onExploreTouchEnd}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Explore</p>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em]">Live service feed</h2>
                    </div>
                    <div className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/70">Swipe or scroll</div>
                  </div>

                  <div className="relative h-[calc(100vh-11.8rem)] min-h-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-black/20">
                    <div className="pointer-events-none absolute inset-x-5 top-5 z-10">
                      <div className="mx-auto max-w-[10rem] rounded-full border border-white/10 bg-black/20 px-3 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-white/58 backdrop-blur-md">
                        Drag up for next
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 top-0 bottom-0">
                      <div className="absolute inset-x-4 top-6 h-28 overflow-hidden rounded-[26px] opacity-35">
                        <div className={`absolute inset-0 bg-gradient-to-br ${previousPost.accent}`} />
                        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${previousPost.imageUrl})` }} />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,11,20,0.08),rgba(5,11,20,0.75))]" />
                      </div>
                      <div className="absolute inset-x-4 bottom-6 h-28 overflow-hidden rounded-[26px] opacity-45">
                        <div className={`absolute inset-0 bg-gradient-to-br ${nextPost.accent}`} />
                        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${nextPost.imageUrl})` }} />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,11,20,0.08),rgba(5,11,20,0.75))]" />
                      </div>
                    </div>
                    <AnimatePresence initial={false} custom={feedDirection} mode="wait">
                      <motion.article
                        key={activePost.id}
                        custom={feedDirection}
                        initial={{ opacity: 0, y: feedDirection > 0 ? 90 : -90 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: feedDirection > 0 ? -90 : 90 }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        style={{ y: dragY, scale: activeCardScale, rotate: activeCardRotate, filter: activeCardBrightness }}
                        onDragEnd={onExploreDragEnd}
                        className="absolute inset-3 overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(2,8,23,0.45)] will-change-transform"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${activePost.accent}`} />
                        <div className="absolute inset-0 bg-cover bg-center opacity-28 mix-blend-screen" style={{ backgroundImage: `url(${activePost.imageUrl})` }} />
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 0] }}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 opacity-50"
                        >
                          <div className="absolute left-8 top-18 h-24 w-24 rounded-full bg-white/14 blur-2xl" />
                          <div className="absolute right-6 top-32 h-20 w-20 rounded-full bg-black/14 blur-2xl" />
                          <div className="absolute bottom-24 left-10 h-32 w-32 rounded-full bg-cyan-200/18 blur-3xl" />
                        </motion.div>
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,11,20,0.98),rgba(5,11,20,0.18)_56%,rgba(5,11,20,0.04))]" />

                        <div className="relative flex h-full flex-col justify-between p-5">
                          <div>
                            <div className="mb-4 flex gap-1">
                              {demoFeedPosts.map((post, index) => (
                                <div key={post.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                                  <div
                                    className="h-full rounded-full bg-white"
                                    style={{ width: index < feedIndex ? "100%" : index === feedIndex ? `${exploreProgress}%` : "0%" }}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <Avatar src={activePost.avatarUrl} name={activePost.provider} size="lg" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-semibold">{activePost.provider}</p>
                                  <BadgeCheck className="h-4 w-4 text-cyan-200" />
                                </div>
                                <p className="text-xs text-white/62">{activePost.category} | {activePost.location}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-end gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex flex-wrap gap-2">
                                {activePost.moments.map((moment) => (
                                  <span key={moment} className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/88">{moment}</span>
                                ))}
                              </div>
                              <h3 className="max-w-[16rem] text-3xl font-semibold leading-tight tracking-[-0.04em]">{activePost.headline}</h3>
                              <p className="mt-3 max-w-[17rem] text-sm leading-6 text-white/82">{activePost.caption}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100/80">
                                {activePost.hashtags.map((tag) => <span key={tag}>{tag}</span>)}
                              </div>
                              <div className="mt-4 flex items-center gap-3 text-xs text-white/66">
                                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current text-amber-300" />{activePost.rating.toFixed(1)}</span>
                                <span>{activePost.reviews} reviews</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                              <button type="button" onClick={() => setLikedPosts((current) => ({ ...current, [activePost.id]: !current[activePost.id] }))} className={`flex h-12 w-12 items-center justify-center rounded-full ${likedPosts[activePost.id] ? "bg-rose-500 text-white" : "bg-white/10 text-white"}`}>
                                <Heart className={`h-5 w-5 ${likedPosts[activePost.id] ? "fill-current" : ""}`} />
                              </button>
                              <span className="text-xs text-white/70">{activePost.stats.likes}</span>
                              <button type="button" onClick={() => setOpenCommentsFor(activePost.id)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                                <MessageCircle className="h-5 w-5" />
                              </button>
                              <span className="text-xs text-white/70">{activePost.stats.comments}</span>
                              <button type="button" onClick={() => setRepostedPosts((current) => ({ ...current, [activePost.id]: !current[activePost.id] }))} className={`flex h-12 w-12 items-center justify-center rounded-full ${repostedPosts[activePost.id] ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-white"}`}>
                                <Repeat2 className="h-5 w-5" />
                              </button>
                              <span className="text-xs text-white/70">{activePost.stats.reposts}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-center">
                            <div className="rounded-full bg-black/20 px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-white/60 backdrop-blur-md">
                              {feedIndex + 1} / {demoFeedPosts.length}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="animate-fade-in">
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Bookings</p>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em]">Your jobs</h2>
                    </div>
                    <button type="button" className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/70">3 active</button>
                  </div>

                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    {demoBookings.map((booking) => (
                      <button key={booking.id} type="button" onClick={() => setSelectedBookingId(booking.id)} className={`min-w-[220px] rounded-[24px] border p-4 text-left ${selectedBooking.id === booking.id ? "border-cyan-300/45 bg-white/12" : "border-white/10 bg-white/8"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{booking.service}</p>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/72">{booking.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-white/55">{booking.provider}</p>
                        <div className="mt-4 h-2 rounded-full bg-white/10">
                          <div className={`h-2 rounded-full bg-gradient-to-r ${booking.accent}`} style={{ width: `${booking.progress}%` }} />
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
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Selected booking</p>
                        <h3 className="mt-2 text-xl font-semibold">{selectedBooking.service}</h3>
                        <p className="mt-1 text-sm text-slate-500">{selectedBooking.provider} | {selectedBooking.providerRole}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">{selectedBooking.status}</span>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-[22px] bg-slate-950 p-4 text-white">
                      <div className="flex items-center justify-between text-sm"><span>ETA</span><span className="font-semibold">{selectedBooking.eta}</span></div>
                      <div className="flex items-center justify-between text-sm"><span>Scheduled</span><span className="font-semibold">{selectedBooking.scheduledFor}</span></div>
                      <div className="flex items-center justify-between text-sm"><span>Address</span><span className="max-w-[11rem] text-right font-semibold">{selectedBooking.address}</span></div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {selectedBooking.checklist.map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${item.complete ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <p className="text-sm font-medium">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[26px] border border-white/10 bg-white/8 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">Booking chat</p>
                        <p className="text-xs text-white/45">Integrated messaging in the same job flow</p>
                      </div>
                      <MessageCircle className="h-4 w-4 text-cyan-200" />
                    </div>

                    <div className="space-y-3">
                      {currentMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.own ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-[20px] px-4 py-3 ${message.own ? "bg-cyan-400 text-slate-950" : "bg-black/20 text-white"}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{message.sender}</p>
                            <p className="mt-1 text-sm leading-6">{message.text}</p>
                            <p className="mt-2 text-[11px] opacity-60">{message.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {["Please ring on arrival", "Share updated quote", "I added another issue"].map((text) => (
                        <button key={text} type="button" onClick={() => sendBookingMessage(text)} className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">
                          {text}
                        </button>
                      ))}
                    </div>

                    <button type="button" onClick={() => sendBookingMessage("Thanks, see you shortly.")} className="mt-4 flex w-full items-center justify-between rounded-[20px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80">
                      <span>Send quick update</span>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="animate-fade-in">
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Settings & profile</p>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em]">Your account</h2>
                    </div>
                    <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"><Settings className="h-4 w-4" /></button>
                  </div>

                  <div className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,#132646_0%,#2457a5_100%)] p-5">
                    <div className="flex items-start gap-4">
                      <Avatar src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80" name="Ano D" size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-xl font-semibold">Ano Dzinotyiwei</h3>
                          <BadgeCheck className="h-4 w-4 text-cyan-200" />
                        </div>
                        <p className="mt-1 text-sm text-white/70">ano@example.com</p>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {profileStats.map((stat) => (
                            <div key={stat.id} className="rounded-[18px] bg-white/10 px-3 py-3 text-center">
                              <p className="text-lg font-semibold">{stat.value}</p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/58">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-200" /><p className="text-sm font-semibold">Saved addresses</p></div>
                    <div className="space-y-3">
                      {profileAddresses.map((addressItem) => (
                        <div key={addressItem.id} className="rounded-[18px] bg-black/20 px-4 py-3">
                          <p className="text-sm font-medium">{addressItem.label}</p>
                          <p className="mt-1 text-xs text-white/52">{addressItem.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-200" /><p className="text-sm font-semibold">Preferences</p></div>
                    <div className="space-y-3">
                      {profileSettings.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3">
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
                    <Button className="flex-1 bg-white text-slate-950 hover:bg-white/92">Edit profile</Button>
                    <Button variant="outline" className="flex-1 border-white/12 bg-white/8 text-white hover:bg-white/12">Help</Button>
                  </div>
                </div>
              )}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#07101d]/95 px-3 pt-3 backdrop-blur-xl" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
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
              <button key={item.id} type="button" onClick={() => selectTab(item.id)} aria-pressed={active} className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-xs ${active ? "bg-white text-slate-950" : "text-white/60"}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {openCommentsFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setOpenCommentsFor(null)}>
            <motion.div initial={{ y: 32 }} animate={{ y: 0 }} exit={{ y: 32 }} className="mx-auto w-full max-w-[430px] rounded-t-[28px] border border-white/10 bg-[#0b1423] p-5" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/18" />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Comments</p>
                  <h3 className="text-lg font-semibold">{demoFeedPosts.find((post) => post.id === openCommentsFor)?.provider}</h3>
                </div>
                <button type="button" onClick={() => setOpenCommentsFor(null)} className="rounded-full bg-white/10 p-2">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </button>
              </div>
              <div className="space-y-3">
                {demoFeedPosts.find((post) => post.id === openCommentsFor)?.comments.map((comment) => (
                  <div key={comment.id} className="rounded-[20px] border border-white/8 bg-white/6 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-white/45">{comment.handle}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/78">{comment.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
