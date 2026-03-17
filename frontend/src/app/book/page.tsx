"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Check,
  X,
  Star,
  Shield,
  Zap,
  Banknote,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { cn } from "@/lib/utils";
import { HOME_SERVICE_FIXTURES } from "@/lib/app-home-fixtures";

interface BookingFormData {
  service: {
    provider: string;
    service: string;
    category: string;
    price: string;
    imageUrl: string;
  };
  scheduling: {
    date: string;
    time: string;
    urgency: "standard" | "urgent" | "emergency";
  };
  location: {
    address: string;
    lat?: number;
    lng?: number;
    type: "home" | "office" | "other";
    notes: string;
    name: string;
    phone: string;
  };
  payment: {
    method: "card" | "cash" | "eft";
  };
}

const STEPS = [
  { id: 1, label: "Service & Time", icon: Calendar },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Confirm", icon: Check },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard", sub: "3–5 days", icon: Clock, price: "" },
  { value: "urgent", label: "Urgent", sub: "24–48 hours", icon: Zap, price: "+25%" },
  { value: "emergency", label: "Same-day", sub: "ASAP", icon: Sparkles, price: "+50%" },
] as const;

export default function BookNowPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(() => {
    const base: BookingFormData = {
      service: { provider: "", service: "", category: "", price: "", imageUrl: "" },
      scheduling: { date: "", time: "", urgency: "standard" },
      location: { address: "", type: "home", notes: "", name: "", phone: "" },
      payment: { method: "card" },
    };
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("bookingData");
        if (stored) {
          const d = JSON.parse(stored);
          base.service = {
            provider: d.provider || "",
            service: d.service || "",
            category: d.category || "",
            price: d.price || "",
            imageUrl: d.imageUrl || "",
          };
        }
      } catch {}
    }
    return base;
  });

  const update = <K extends keyof BookingFormData>(
    key: K,
    data: Partial<BookingFormData[K]>,
  ) => setFormData((prev) => ({ ...prev, [key]: { ...prev[key], ...data } }));

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.service.service && formData.scheduling.date && formData.scheduling.time);
      case 2:
        return !!(formData.location.address && formData.location.name && formData.location.phone);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => currentStep < STEPS.length && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);
  const submit = () => {
    console.log("Booking submitted:", formData);
    router.push("/bookings/confirmation");
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative mx-auto max-w-2xl px-4 pb-32 pt-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/70 hover:bg-white/12 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Book a Service</h1>
            <p className="text-xs text-white/45">
              Step {currentStep} of {STEPS.length} · {STEPS[currentStep - 1].label}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/40 hover:bg-white/12 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="mt-3 flex items-center justify-between">
          {STEPS.map((step) => {
            const active = currentStep === step.id;
            const done = currentStep > step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => done && setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-white/10 text-white"
                    : done
                      ? "text-cyan-300/70 cursor-pointer hover:text-cyan-200"
                      : "text-white/25",
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all",
                    active
                      ? "bg-white text-slate-950"
                      : done
                        ? "bg-cyan-400/20 text-cyan-300"
                        : "bg-white/6 text-white/25",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="mt-6">
          {currentStep === 1 && (
            <StepServiceAndTime
              service={formData.service}
              scheduling={formData.scheduling}
              onServiceUpdate={(d) => update("service", d)}
              onScheduleUpdate={(d) => update("scheduling", d)}
            />
          )}
          {currentStep === 2 && (
            <StepLocation
              location={formData.location}
              onUpdate={(d) => update("location", d)}
            />
          )}
          {currentStep === 3 && (
            <StepConfirm
              formData={formData}
              onPaymentUpdate={(d) => update("payment", d)}
            />
          )}
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 bg-[#07111f]/95 backdrop-blur-xl safe-area-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/12 text-white/60 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {/* Price summary in CTA bar */}
          {formData.service.price && (
            <div className="hidden sm:block text-sm">
              <p className="text-white/40 text-xs">Total</p>
              <p className="font-semibold">{formData.service.price}</p>
            </div>
          )}

          {currentStep === STEPS.length ? (
            <button
              onClick={submit}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white font-semibold text-slate-950 active:scale-[0.98] transition-all shadow-lg shadow-white/10"
            >
              <Check className="h-5 w-5" />
              Confirm Booking
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={cn(
                "flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.98]",
                canProceed()
                  ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                  : "bg-white/8 text-white/25 cursor-not-allowed",
              )}
            >
              Continue
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Service & Time ─── */
function StepServiceAndTime({
  service,
  scheduling,
  onServiceUpdate,
  onScheduleUpdate,
}: {
  service: BookingFormData["service"];
  scheduling: BookingFormData["scheduling"];
  onServiceUpdate: (d: Partial<BookingFormData["service"]>) => void;
  onScheduleUpdate: (d: Partial<BookingFormData["scheduling"]>) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  // Quick-date chips (Uber pattern: Today, Tomorrow, Pick a date)
  const quickDates = (() => {
    const d = new Date();
    const fmt = (date: Date) => date.toISOString().split("T")[0];
    const label = (date: Date) =>
      date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
    return [
      { value: fmt(d), label: "Today" },
      { value: fmt(new Date(d.getTime() + 86400000)), label: "Tomorrow" },
      { value: fmt(new Date(d.getTime() + 172800000)), label: label(new Date(d.getTime() + 172800000)) },
    ];
  })();

  return (
    <div className="space-y-8">
      {/* Service selector */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Choose a service</h2>
        <p className="text-sm text-white/40 mb-4">Select the service you need</p>
        <div className="space-y-3">
          {HOME_SERVICE_FIXTURES.map((s) => {
            const selected = service.service === s.title;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  onServiceUpdate({
                    provider: s.providerName,
                    service: s.title,
                    category: s.category,
                    price: s.priceLabel,
                    imageUrl: s.imageUrl,
                  })
                }
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-all active:scale-[0.98]",
                  selected
                    ? "border-cyan-400/50 bg-cyan-400/8"
                    : "border-white/8 bg-white/4 hover:bg-white/6 hover:border-white/15",
                )}
              >
                {/* Service image thumbnail */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="h-full w-full object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cyan-400/40">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{s.title}</p>
                    {s.availableNow && (
                      <span className="flex-shrink-0 rounded-full bg-green-400/15 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/45 truncate mt-0.5">{s.providerName}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-sm font-semibold text-cyan-200">{s.priceLabel}</span>
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                      {s.rating} ({s.reviews})
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Scheduling */}
      {service.service && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-lg font-semibold mb-1">When do you need it?</h2>
          <p className="text-sm text-white/40 mb-4">Pick a date and time</p>

          {/* Quick date chips */}
          <div className="flex gap-2 mb-4">
            {quickDates.map((qd) => (
              <button
                key={qd.value}
                type="button"
                onClick={() => onScheduleUpdate({ date: qd.value })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95",
                  scheduling.date === qd.value
                    ? "border-cyan-400/50 bg-cyan-400/15 text-white"
                    : "border-white/10 bg-white/4 text-white/55 hover:bg-white/8",
                )}
              >
                {qd.label}
              </button>
            ))}
            {/* Custom date picker */}
            <label
              className={cn(
                "relative cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all",
                scheduling.date && !quickDates.some((q) => q.value === scheduling.date)
                  ? "border-cyan-400/50 bg-cyan-400/15 text-white"
                  : "border-white/10 bg-white/4 text-white/55 hover:bg-white/8",
              )}
            >
              <Calendar className="mr-1 -mt-0.5 inline h-3.5 w-3.5" />
              {scheduling.date && !quickDates.some((q) => q.value === scheduling.date)
                ? new Date(scheduling.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                : "Other"}
              <input
                type="date"
                min={today}
                value={scheduling.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onScheduleUpdate({ date: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-5 gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onScheduleUpdate({ time: t })}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-95",
                  scheduling.time === t
                    ? "border-cyan-400/50 bg-cyan-400/15 text-white"
                    : "border-white/8 bg-white/4 text-white/50 hover:bg-white/8",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Urgency */}
          <div className="mt-5 flex gap-2">
            {URGENCY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = scheduling.urgency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onScheduleUpdate({ urgency: opt.value as BookingFormData["scheduling"]["urgency"] })}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-medium transition-all active:scale-95",
                    active
                      ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                      : "border-white/8 bg-white/4 text-white/45 hover:bg-white/6",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{opt.label}</span>
                  <span className="text-[10px] text-white/30">{opt.sub}</span>
                  {opt.price && (
                    <span className="text-[10px] font-semibold text-amber-300">{opt.price}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Step 2: Location (with autocomplete + contact) ─── */
function StepLocation({
  location,
  onUpdate,
}: {
  location: BookingFormData["location"];
  onUpdate: (d: Partial<BookingFormData["location"]>) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Address */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Service address</h2>
        <p className="text-sm text-white/40 mb-4">
          Where should the provider come?
        </p>
        <AddressAutocomplete
          value={location.address}
          onChange={(address, lat, lng) => onUpdate({ address, lat, lng })}
          placeholder="Search for an address…"
        />

        {/* Location type chips */}
        <div className="mt-4 flex gap-2">
          {(["home", "office", "other"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate({ type: t })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all active:scale-95",
                location.type === t
                  ? "border-cyan-400/50 bg-cyan-400/15 text-white"
                  : "border-white/10 bg-white/4 text-white/50 hover:bg-white/8",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Special instructions */}
        <textarea
          placeholder="Gate code, parking info, or special instructions…"
          value={location.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={2}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40 transition-all resize-none"
        />
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Your details</h2>
        <p className="text-sm text-white/40 mb-4">So the provider can reach you</p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full name"
            value={location.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40 transition-all"
          />
          <input
            type="tel"
            placeholder="Phone number (e.g. +27 83 123 4567)"
            value={location.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40 transition-all"
          />
        </div>
      </section>
    </div>
  );
}

/* ─── Step 3: Confirm (payment + review summary) ─── */
function StepConfirm({
  formData,
  onPaymentUpdate,
}: {
  formData: BookingFormData;
  onPaymentUpdate: (d: Partial<BookingFormData["payment"]>) => void;
}) {
  const PAYMENT_METHODS = [
    { value: "card" as const, label: "Card", icon: CreditCard, desc: "Credit or debit card" },
    { value: "cash" as const, label: "Cash", icon: Banknote, desc: "Pay on completion" },
    { value: "eft" as const, label: "EFT", icon: Smartphone, desc: "Bank transfer" },
  ];

  const urgencyLabel = URGENCY_OPTIONS.find((o) => o.value === formData.scheduling.urgency);

  return (
    <div className="space-y-6">
      {/* Booking summary card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {/* Service header with image */}
        {formData.service.imageUrl && (
          <div className="relative h-28 w-full overflow-hidden">
            <img
              src={formData.service.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1525] via-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-sm font-semibold">{formData.service.service}</p>
              <p className="text-xs text-white/50">{formData.service.provider}</p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          <SummaryRow label="Date" value={
            formData.scheduling.date
              ? new Date(formData.scheduling.date).toLocaleDateString("en-ZA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "—"
          } />
          <SummaryRow label="Time" value={formData.scheduling.time || "—"} />
          <SummaryRow
            label="Urgency"
            value={urgencyLabel ? `${urgencyLabel.label} ${urgencyLabel.price}` : "Standard"}
          />
          <div className="border-t border-white/6 pt-3" />
          <SummaryRow
            label="Address"
            value={formData.location.address || "—"}
            truncate
          />
          <SummaryRow label="Contact" value={formData.location.name || "—"} />
          <SummaryRow label="Phone" value={formData.location.phone || "—"} />
          {formData.location.notes && (
            <SummaryRow label="Notes" value={formData.location.notes} truncate />
          )}
          <div className="border-t border-white/6 pt-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Estimated total</span>
            <span className="text-lg font-bold text-cyan-200">
              {formData.service.price || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <section>
        <h2 className="text-base font-semibold mb-3">Payment method</h2>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            const active = formData.payment.method === pm.value;
            return (
              <button
                key={pm.value}
                type="button"
                onClick={() => onPaymentUpdate({ method: pm.value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border py-4 text-xs font-medium transition-all active:scale-95",
                  active
                    ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                    : "border-white/8 bg-white/4 text-white/45 hover:bg-white/6",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{pm.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Confirmation banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-cyan-400/8 border border-cyan-400/20 p-4">
        <Shield className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-cyan-100">Secure booking</p>
          <p className="text-xs text-white/45 mt-1">
            You won't be charged until the service is confirmed. Free cancellation up to 2 hours before.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Utility: summary row ─── */
function SummaryRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="flex-shrink-0 text-white/40">{label}</span>
      <span className={cn("text-right", truncate && "truncate max-w-[200px]")}>{value}</span>
    </div>
  );
}
