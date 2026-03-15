"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { demoMessages, demoOpsItems, demoProviders, demoQuickReplies } from "@/lib/demo-data";

type DemoTab = "explore" | "booking" | "messages" | "ops";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>("explore");
  const [activeProviderId, setActiveProviderId] = useState(demoProviders[0].id);
  const [bookingStage, setBookingStage] = useState(1);
  const [messages, setMessages] = useState(demoMessages);

  const activeProvider = useMemo(
    () => demoProviders.find((provider) => provider.id === activeProviderId) ?? demoProviders[0],
    [activeProviderId]
  );

  const sendReply = (text: string) => {
    setMessages((current) => [
      ...current,
      { id: `m-${current.length + 1}`, sender: "You", text, time: "09:18" },
    ]);
  };

  const advanceBooking = () => {
    const nextStage = bookingStage >= 3 ? 3 : bookingStage + 1;
    setBookingStage(nextStage);
    if (nextStage >= 2) {
      setActiveTab("messages");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_22%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6">
        <header className="liquid-dark mx-auto flex w-full max-w-5xl items-center justify-between rounded-[28px] px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/60">Investor demo</p>
            <h1 className="text-lg font-semibold">Serveify mobile walkthrough</h1>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/84 hover:bg-white/16">
            Main site
            <ChevronRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-100/80">
              <Sparkles className="h-3.5 w-3.5" />
              Clickable, mobile-first, no backend needed
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              A live-feeling investor demo you can hand over right now.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              This walkthrough simulates the customer journey, provider trust layer, messaging, and marketplace operations in a phone-sized web app.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-2xl font-semibold">4</p>
                <p className="mt-1 text-sm text-slate-300">Clickable screens</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-2xl font-semibold">19 min</p>
                <p className="mt-1 text-sm text-slate-300">Median arrival story</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-2xl font-semibold">R1.24M</p>
                <p className="mt-1 text-sm text-slate-300">Demo GMV snapshot</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-white text-slate-950 hover:bg-white/92" onClick={() => setActiveTab("explore")}>
                Open demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link
                href="/browse?demo=1"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/8 px-6 text-sm font-medium text-white/84 hover:bg-white/14"
              >
                View social feed route
              </Link>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-white">Suggested investor script</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Start in Explore, tap a provider card, move to Booking to show conversion, then Inbox for trust and Ops for marketplace visibility.
              </p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[380px]">
            <div className="rounded-[42px] border border-white/12 bg-[#050b14] p-3 shadow-[0_30px_90px_rgba(2,8,23,0.55)]">
              <div className="relative overflow-hidden rounded-[34px] border border-white/8 bg-[#091321]">
                <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-3">
                  <div className="h-1.5 w-24 rounded-full bg-white/20" />
                </div>

                <div
                  className="px-4 pt-7"
                  style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
                >
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <CircleDashed className="h-3.5 w-3.5" />
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {activeTab === "explore" ? (
                    <div className="animate-fade-in">
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Explore</p>
                          <h3 className="text-2xl font-semibold">For your home</h3>
                        </div>
                        <button
                          type="button"
                          aria-label="Search providers"
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
                        {["Emergency", "Verified", "Near you", "Top rated"].map((item) => (
                          <span key={item} className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80">
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 space-y-4">
                        {demoProviders.map((provider) => (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => setActiveProviderId(provider.id)}
                            className={`relative block w-full overflow-hidden rounded-[28px] border text-left ${activeProvider.id === provider.id ? "border-cyan-300/45" : "border-white/10"}`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${provider.accent}`} />
                            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,11,20,0.96),rgba(5,11,20,0.1))]" />
                            <div className="relative p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base font-semibold">{provider.name}</span>
                                    {provider.verified ? <BadgeCheck className="h-4 w-4 text-cyan-200" /> : null}
                                  </div>
                                  <p className="mt-1 text-xs text-white/70">{provider.category}</p>
                                </div>
                                <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium text-white/84">
                                  {provider.price}
                                </span>
                              </div>
                              <p className="mt-10 max-w-[88%] text-sm leading-6 text-white/86">{provider.caption}</p>
                              <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{provider.eta}</span>
                                <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{provider.likes}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/8 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar name={activeProvider.name} size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold">{activeProvider.name}</p>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
                              <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current text-amber-300" />{activeProvider.rating}</span>
                              <span>{activeProvider.reviews} reviews</span>
                              <span>{activeProvider.neighborhood}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="lg" className="mt-4 w-full" onClick={() => setActiveTab("booking")}>
                          Book this provider
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === "booking" ? (
                    <div className="animate-fade-in">
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Booking</p>
                          <h3 className="text-2xl font-semibold">Live job card</h3>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Escrow ready
                        </span>
                      </div>

                      <div className="mt-5 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] p-5 text-slate-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{activeProvider.category}</p>
                            <p className="mt-1 text-xs text-slate-500">Requested for 10:00 today</p>
                          </div>
                          <Wallet className="h-5 w-5 text-slate-500" />
                        </div>

                        <div className="mt-5 space-y-4">
                          {[
                            { title: "Request submitted", body: "Customer shared photos and preferred time.", done: true },
                            { title: "Provider confirmed", body: "Nomvula accepted and locked the quote.", done: bookingStage >= 2 },
                            { title: "Provider en route", body: "Live ETA and chat open automatically.", done: bookingStage >= 3 },
                          ].map((step) => (
                            <div key={step.title} className="flex gap-3">
                              <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                                {step.done ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{step.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{step.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-[22px] bg-slate-950 p-4 text-white">
                          <div className="flex items-center justify-between text-sm">
                            <span>Locked quote</span>
                            <span className="font-semibold">R850</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-white/65">
                            <span>Arrival window</span>
                            <span>{bookingStage >= 3 ? "11 min away" : activeProvider.eta}</span>
                          </div>
                        </div>
                      </div>

                      <Button size="lg" className="mt-5 w-full" onClick={advanceBooking}>
                        {bookingStage >= 3 ? "Provider is en route" : bookingStage === 1 ? "Confirm provider" : "Start live tracking"}
                      </Button>
                    </div>
                  ) : null}

                  {activeTab === "messages" ? (
                    <div className="animate-fade-in">
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Inbox</p>
                          <h3 className="text-2xl font-semibold">Job chat</h3>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] text-white/70">
                          Trust preserved
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {messages.map((message) => {
                          const own = message.sender === "You";
                          return (
                            <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[82%] rounded-[22px] px-4 py-3 ${own ? "bg-cyan-400 text-slate-950" : "bg-white/8 text-white"}`}>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{message.sender}</p>
                                <p className="mt-1 text-sm leading-6">{message.text}</p>
                                <p className="mt-2 text-[11px] opacity-60">{message.time}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-none">
                        {demoQuickReplies.map((reply) => (
                          <button
                            key={reply}
                            type="button"
                            onClick={() => sendReply(reply)}
                            className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/80 hover:bg-white/12"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => sendReply("Thanks, see you shortly.")}
                        className="mt-5 flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/75"
                      >
                        <span>Send quick confirmation</span>
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}

                  {activeTab === "ops" ? (
                    <div className="animate-fade-in">
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Marketplace ops</p>
                          <h3 className="text-2xl font-semibold">Investor view</h3>
                        </div>
                        <TrendingUp className="h-5 w-5 text-cyan-200" />
                      </div>

                      <div className="mt-5 grid gap-3">
                        {demoOpsItems.map((item) => (
                          <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-white/50">{item.label}</p>
                                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>
                                Live
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">Verification queue</p>
                            <p className="mt-1 text-xs text-white/55">Three providers waiting for review</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Needs action
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {["Garden route electrician", "Camps Bay cleaner", "24/7 locksmith"].map((entry) => (
                            <div key={entry} className="flex items-center justify-between rounded-[18px] bg-black/20 px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                                  <UserRound className="h-4 w-4 text-white/70" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{entry}</p>
                                  <p className="text-xs text-white/50">Docs uploaded, awaiting approval</p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-white/45" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <nav
                  className="absolute inset-x-0 bottom-0 border-t border-white/8 bg-[#07101d]/95 px-2 pt-3 backdrop-blur-xl"
                  style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                >
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: "explore" as const, label: "Explore", icon: Home },
                      { id: "booking" as const, label: "Booking", icon: CalendarClock },
                      { id: "messages" as const, label: "Inbox", icon: MessageCircle },
                      { id: "ops" as const, label: "Ops", icon: TrendingUp },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          aria-pressed={active}
                          className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-xs ${active ? "bg-white text-slate-950" : "text-white/60"}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
            <div className="flex items-center gap-2 text-cyan-100">
              <MapPin className="h-4 w-4" />
              <p className="text-sm font-semibold">Local trust loop</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Feed discovery, verified badges, ETA promises, and messaging all reinforce conversion on a mobile screen.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
            <div className="flex items-center gap-2 text-cyan-100">
              <Wrench className="h-4 w-4" />
              <p className="text-sm font-semibold">Provider growth story</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Providers are positioned like branded operators, not commodity cards, which is stronger for retention and referrals.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
            <div className="flex items-center gap-2 text-cyan-100">
              <TrendingUp className="h-4 w-4" />
              <p className="text-sm font-semibold">Marketplace visibility</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The ops tab gives investors a fast way to connect customer UX to revenue, supply growth, and verification throughput.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
