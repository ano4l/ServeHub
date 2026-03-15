import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Droplets,
  Leaf,
  Paintbrush2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

const categories = [
  { icon: Droplets, label: "Plumbing" },
  { icon: Zap, label: "Electrical" },
  { icon: Sparkles, label: "Cleaning" },
  { icon: Leaf, label: "Gardening" },
  { icon: Paintbrush2, label: "Painting" },
  { icon: Wrench, label: "Repairs" },
];

const stats = [
  { value: "50k+", label: "Customers" },
  { value: "8k+", label: "Providers" },
  { value: "200k+", label: "Jobs done" },
  { value: "4.8", label: "Average rating" },
];

const trustCards = [
  { title: "Verified arrivals", detail: "Identity checks, reviews, and response-time signals surface faster operators.", accent: "bg-cyan-200/70" },
  { title: "Escrow-ready bookings", detail: "Payments, disputes, and audit trails stay connected to each booking lifecycle.", accent: "bg-amber-200/70" },
  { title: "Provider growth mode", detail: "Profiles, ratings, and category discovery are structured like a real operating channel.", accent: "bg-emerald-200/70" },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="page-orb left-[-6rem] top-[-4rem] h-72 w-72 bg-cyan-300/55" />
      <div className="page-orb right-[-3rem] top-[8rem] h-80 w-80 bg-amber-200/60 [animation-delay:2s]" />
      <div className="page-orb bottom-[8rem] left-[18%] h-64 w-64 bg-emerald-200/45 [animation-delay:4s]" />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <nav className="liquid-panel-strong glass-hairline surface-ring sticky top-4 z-50 flex items-center justify-between rounded-[32px] border border-white/75 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_100%)] text-slate-950 shadow-[0_16px_32px_rgba(255,210,127,0.22)]">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">Serveify</p>
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Marketplace OS</p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <Link href="/browse" className="hover:text-slate-950">Browse</Link>
            <Link href="/register?role=PROVIDER" className="hover:text-slate-950">Provider growth</Link>
            <Link href="/admin" className="hover:text-slate-950">Operations</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/55">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[linear-gradient(135deg,#14284a_0%,#2457a5_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(36,87,165,0.22)]"
            >
              Start Booking
            </Link>
          </div>
        </nav>

        <section className="grid gap-8 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/62 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-[0_10px_24px_rgba(62,90,131,0.12)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-green" />
              Liquid booking flow
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
              A service marketplace that feels
              <span className="gradient-text"> fluid, bright, and alive.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Serveify pairs trusted local providers with a liquid-glass interface that keeps search, booking,
              messaging, and operations readable under motion, blur, and dense activity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#14284a_0%,#2457a5_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(36,87,165,0.24)]"
              >
                Explore providers
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register?role=PROVIDER"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/62 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(62,90,131,0.12)]"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Become a provider
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
              >
                Investor demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {trustCards.map((card) => (
                <div key={card.title} className="liquid-panel glass-hairline rounded-[26px] p-4 shadow-[0_14px_36px_rgba(62,90,131,0.12)]">
                  <div className={`mb-3 h-10 w-10 rounded-2xl ${card.accent}`} />
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="liquid-panel-strong glass-hairline animate-float rounded-[36px] p-5 shadow-[0_24px_56px_rgba(42,70,112,0.18)]">
              <div className="flex items-center justify-between rounded-[28px] border border-white/80 bg-white/55 px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Live dispatch</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Cape Town service pulse</p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">48 providers online</div>
              </div>

              <div className="mt-4 grid gap-4">
                {[
                  { name: "Nomvula D.", role: "Emergency plumbing", wait: "12 min", rating: "4.9", color: "from-cyan-300 to-sky-200" },
                  { name: "Jason P.", role: "Electrical diagnostics", wait: "18 min", rating: "4.8", color: "from-amber-200 to-orange-100" },
                  { name: "Lindiwe K.", role: "Deep cleaning", wait: "22 min", rating: "5.0", color: "from-emerald-200 to-teal-100" },
                ].map((provider) => (
                  <div key={provider.name} className="rounded-[28px] border border-white/75 bg-white/58 p-4 shadow-[0_12px_32px_rgba(62,90,131,0.1)]">
                    <div className="flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-[20px] bg-gradient-to-br ${provider.color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{provider.name}</p>
                            <p className="text-xs text-slate-500">{provider.role}</p>
                          </div>
                          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{provider.rating} stars</div>
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-[22px] bg-slate-950/92 px-4 py-3 text-white">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock3 className="h-4 w-4 text-cyan-300" />
                            ETA {provider.wait}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4 text-emerald-300" />
                            Verified
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 rounded-[26px] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_16px_36px_rgba(62,90,131,0.15)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Fast path</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Booking to arrival in under 2 minutes</p>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 rounded-[36px] liquid-panel glass-hairline p-6 md:grid-cols-4 md:p-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[28px] border border-white/75 bg-white/52 px-5 py-5 text-center shadow-[0_10px_24px_rgba(62,90,131,0.08)]">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Browse categories</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Dense discovery without visual sludge.</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-6 text-slate-600 md:block">
              Glass only sits on interactive surfaces. Core text and action areas keep stronger contrast so search stays readable on desktop and mobile.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.label}
                  href={`/browse?category=${category.label.toLowerCase()}`}
                  className="group liquid-panel glass-hairline rounded-[30px] p-5 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(62,90,131,0.16)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/76 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-slate-950">{category.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Search local specialists, compare response signals, and book in one continuous flow.
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_28px_64px_rgba(14,25,46,0.24)]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/68">Why it feels different</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Liquid glass, without the accessibility tax.</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-white/72">
              <li>Surfaces get blur and specular highlights only where they help layering.</li>
              <li>Reduced-motion and reduced-transparency preferences fall back to calmer, more opaque panels.</li>
              <li>Dark shell areas use stronger contrast than public marketing surfaces, so dense dashboards stay legible.</li>
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Trust layer", body: "Verification, reviews, and booking state stay visible even under translucent surfaces." },
              { icon: Users, title: "Role-aware shell", body: "Customers, providers, and admins share one visual system without looking like templates." },
              { icon: Star, title: "Edge cases covered", body: "Hover, focus, reduced motion, high density cards, and empty states remain readable." },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="liquid-panel glass-hairline rounded-[30px] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/78 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
