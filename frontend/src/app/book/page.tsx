"use client";

import { useState, useMemo } from "react";
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
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  User,
  Mail,
  Phone,
  Pencil,
  Package,
  CircleCheckBig,
  FileText,
  HelpCircle,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { cn } from "@/lib/utils";
import { useCartStore, type CartItem } from "@/store/cart.store";
import { getCategoryById } from "@/lib/services-directory";

interface BookingFormData {
  personal: {
    name: string;
    email: string;
    phone: string;
  };
  scheduling: {
    date: string;
    time: string;
    urgency: "standard" | "urgent";
  };
  delivery: {
    address: string;
    lat?: number;
    lng?: number;
    type: "home" | "office" | "other";
    notes: string;
  };
  payment: {
    method: "card" | "cash" | "eft";
  };
}

const STEPS = [
  { id: 1, label: "User Detail", icon: User },
  { id: 2, label: "Delivery", icon: MapPin },
  { id: 3, label: "Payment", icon: CreditCard },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard", sub: "Within work hours (08:00–17:00)", icon: Clock, price: "" },
  { value: "urgent", label: "Urgent", sub: "Outside work hours (evenings/weekends)", icon: Zap, price: "+25%" },
] as const;

export default function BookNowPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getCartTotal, getItemCount, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [formData, setFormData] = useState<BookingFormData>({
    personal: { name: "", email: "", phone: "" },
    scheduling: { date: "", time: "", urgency: "standard" },
    delivery: { address: "", type: "home", notes: "" },
    payment: { method: "card" },
  });

  const update = <K extends keyof BookingFormData>(
    key: K,
    data: Partial<BookingFormData[K]>,
  ) => setFormData((prev) => ({ ...prev, [key]: { ...prev[key], ...data } }));

  const itemCount = getItemCount();
  const cartTotal = getCartTotal();

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.personal.name && formData.personal.phone && formData.scheduling.date && formData.scheduling.time);
      case 2:
        return !!formData.delivery.address;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => currentStep < STEPS.length && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const estimatedArrival = useMemo(() => {
    if (!formData.scheduling.date) return "";
    const d = new Date(formData.scheduling.date);
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }, [formData.scheduling.date]);

  const submit = () => {
    const ref = `SH${Date.now().toString(36).toUpperCase()}`;
    setOrderNumber(ref);
    clearCart();
    setOrderSuccess(true);
  };

  // ─── Order Success Screen ───
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_50%)]" />
        <div className="relative mx-auto max-w-lg px-4 pt-12 pb-24 sm:px-6 text-center">
          {/* Celebration */}
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
            <CircleCheckBig className="h-14 w-14 text-emerald-400" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Order Successful!
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-sm mx-auto leading-relaxed">
            Thank you for choosing ServeHub. Your invoice has been sent
            {formData.personal.email ? ` to ${formData.personal.email}` : ""}.
          </p>

          {/* Meta row */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs">
            <div>
              <p className="text-white/40">Est. Arrival</p>
              <p className="mt-0.5 font-semibold text-white/80">{estimatedArrival || "TBD"}</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <p className="text-white/40">Order</p>
              <p className="mt-0.5 font-semibold text-cyan-300">#{orderNumber}</p>
            </div>
          </div>

          {/* Action cards */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push("/bookings")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/8 py-3.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-400/12 active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" /> See Invoice
            </button>
            <button
              onClick={() => router.push("/bookings")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/8 py-3.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-400/12 active:scale-[0.98]"
            >
              <Package className="h-4 w-4" /> See Order Status
            </button>
            <button
              onClick={() => router.push("/bookings")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/4 py-3.5 text-sm font-medium text-white/50 transition-all hover:bg-white/8"
            >
              <HelpCircle className="h-4 w-4" /> I need help with this booking
            </button>
          </div>

          {/* Browse more */}
          <div className="mt-10">
            <p className="text-xs text-white/30 mb-3">You might also like</p>
            <button
              onClick={() => router.push("/services")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              Browse more services <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty cart ───
  if (items.length === 0 && typeof window !== "undefined") {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex flex-col items-center justify-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <ShoppingCart className="h-8 w-8 text-white/20" />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-white/40 text-center">
          Browse services and add them to your cart to get started.
        </p>
        <button
          onClick={() => router.push("/services")}
          className="mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all active:scale-95"
        >
          Browse services <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

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
          <h1 className="flex-1 text-center text-lg font-semibold tracking-tight">Cart</h1>
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/40 hover:bg-white/12 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step tabs (matching reference) */}
        <div className="mt-5 flex items-center justify-center gap-0 rounded-full border border-white/8 bg-white/4 p-1">
          {STEPS.map((step) => {
            const active = currentStep === step.id;
            const done = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => done && setCurrentStep(step.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all",
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : done
                      ? "text-cyan-300/80 cursor-pointer hover:text-cyan-200"
                      : "text-white/30",
                )}
              >
                {done && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                {active && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Compact cart strip (always visible) */}
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">{itemCount} Total {itemCount === 1 ? "Item" : "Items"}</p>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Pencil className="mr-1 inline h-3 w-3" />Edit
            </button>
          </div>

          {/* Thumbnail row */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item) => (
              <div
                key={item.service.id}
                className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-white/10"
              >
                <img
                  src={item.service.imageUrl}
                  alt={item.service.name}
                  className="h-full w-full object-cover"
                />
                {item.quantity > 1 && (
                  <div className="absolute bottom-0 right-0 rounded-tl-lg bg-cyan-500 px-1 text-[9px] font-bold text-white">
                    ×{item.quantity}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3">
            <span className="text-lg font-bold text-white">{cartTotal}+</span>
            <span className="text-[11px] text-white/30">Est. · final quote after review</span>
          </div>
        </div>

        {/* Step content */}
        <div className="mt-6">
          {currentStep === 1 && (
            <StepPersonalDetails
              items={items}
              personal={formData.personal}
              scheduling={formData.scheduling}
              onPersonalUpdate={(d) => update("personal", d)}
              onScheduleUpdate={(d) => update("scheduling", d)}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
            />
          )}
          {currentStep === 2 && (
            <StepDelivery
              delivery={formData.delivery}
              onUpdate={(d) => update("delivery", d)}
            />
          )}
          {currentStep === 3 && (
            <StepPayment
              items={items}
              formData={formData}
              cartTotal={cartTotal}
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

          {currentStep === STEPS.length ? (
            <button
              onClick={submit}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-white active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
            >
              <Check className="h-5 w-5" />
              Place order · {cartTotal}+
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

/* ─── Calendar Picker ─── */
function CalendarPicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Array<{ day: number; dateStr: string; isToday: boolean; isPast: boolean }> = [];

    // Empty slots for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, dateStr: "", isToday: false, isPast: true });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split("T")[0];
      const isToday = dateObj.getTime() === today.getTime();
      const isPast = dateObj < today;
      days.push({ day, dateStr, isToday, isPast });
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/12 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">{monthYear}</span>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/12 transition-all"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[11px] font-medium text-white/40 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayInfo, index) => {
          if (dayInfo.day === 0) {
            return <div key={index} className="aspect-square" />;
          }

          const isSelected = selectedDate === dayInfo.dateStr;

          return (
            <button
              key={dayInfo.dateStr}
              type="button"
              disabled={dayInfo.isPast}
              onClick={() => onSelect(dayInfo.dateStr)}
              className={cn(
                "aspect-square rounded-xl text-sm font-medium transition-all active:scale-95",
                isSelected
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : dayInfo.isToday
                    ? "border border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                    : dayInfo.isPast
                      ? "text-white/20 cursor-not-allowed"
                      : "text-white/70 hover:bg-white/10",
              )}
            >
              {dayInfo.day}
            </button>
          );
        })}
      </div>

      {/* Quick select */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            onSelect(today);
            setCurrentMonth(new Date());
          }}
          className={cn(
            "flex-1 rounded-xl border py-2 text-xs font-medium transition-all",
            selectedDate === new Date().toISOString().split("T")[0]
              ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
              : "border-white/10 bg-white/4 text-white/50 hover:bg-white/8",
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
            onSelect(tomorrow);
            setCurrentMonth(new Date(Date.now() + 86400000));
          }}
          className={cn(
            "flex-1 rounded-xl border py-2 text-xs font-medium transition-all",
            selectedDate === new Date(Date.now() + 86400000).toISOString().split("T")[0]
              ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
              : "border-white/10 bg-white/4 text-white/50 hover:bg-white/8",
          )}
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
}

/* ─── Step 1: Personal Details + Cart items + Scheduling ─── */
function StepPersonalDetails({
  items,
  personal,
  scheduling,
  onPersonalUpdate,
  onScheduleUpdate,
  onRemoveItem,
  onUpdateQuantity,
}: {
  items: CartItem[];
  personal: BookingFormData["personal"];
  scheduling: BookingFormData["scheduling"];
  onPersonalUpdate: (d: Partial<BookingFormData["personal"]>) => void;
  onScheduleUpdate: (d: Partial<BookingFormData["scheduling"]>) => void;
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
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
      {/* Personal Details (matching reference) */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Personal Details</h2>
        <p className="text-sm text-white/40 mb-4">We&apos;ll use these to confirm your booking</p>
        <div className="space-y-3">
          <FormInput
            icon={<User className="h-4 w-4" />}
            label="Full Name"
            placeholder="e.g. Thabo Mokoena"
            value={personal.name}
            onChange={(v) => onPersonalUpdate({ name: v })}
          />
          <FormInput
            icon={<Mail className="h-4 w-4" />}
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            value={personal.email}
            onChange={(v) => onPersonalUpdate({ email: v })}
          />
          <FormInput
            icon={<Phone className="h-4 w-4" />}
            label="Phone Number"
            placeholder="+27 83 123 4567"
            type="tel"
            value={personal.phone}
            onChange={(v) => onPersonalUpdate({ phone: v })}
          />
        </div>
      </section>

      {/* Cart items (expandable) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-4 w-4 text-cyan-400" />
          <h2 className="text-lg font-semibold">My Cart ({items.length})</h2>
        </div>
        <div className="space-y-3">
          {items.map((item) => {
            const cat = getCategoryById(item.service.categoryId);
            return (
              <div
                key={item.service.id}
                className="rounded-2xl border border-white/8 bg-white/4 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={item.service.imageUrl}
                      alt={item.service.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white line-clamp-1">
                      {item.service.name}
                    </p>
                    {cat && (
                      <p className="text-[11px] text-white/35 mt-0.5">
                        {cat.emoji} {cat.name}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-base font-bold text-cyan-300">{item.service.priceRange}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-current text-amber-400" />
                        {item.service.rating}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {item.service.duration}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Qty + Remove row */}
                <div className="mt-2 flex items-center justify-between border-t border-white/6 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/40 mr-1">Qty:</span>
                    <button
                      onClick={() => onUpdateQuantity(item.service.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 active:scale-90"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.service.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 active:scale-90"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.service.id)}
                    className="flex items-center gap-1 text-xs font-medium text-red-400/80 transition hover:text-red-400 active:scale-95"
                  >
                    Remove <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Scheduling */}
      <section>
        <h2 className="text-lg font-semibold mb-1">When do you need it?</h2>
        <p className="text-sm text-white/40 mb-4">Pick a date and time</p>

        {/* Calendar */}
        <CalendarPicker
          selectedDate={scheduling.date}
          onSelect={(date: string) => onScheduleUpdate({ date })}
        />

        {/* Time slots */}
        <div className="mt-5 grid grid-cols-5 gap-2">
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
        <div className="mt-5 flex gap-3">
          {URGENCY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = scheduling.urgency === opt.value;
            const isUrgent = opt.value === "urgent";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onScheduleUpdate({ urgency: opt.value as BookingFormData["scheduling"]["urgency"] })}
                className={cn(
                  "flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-medium transition-all active:scale-95",
                  active
                    ? isUrgent
                      ? "border-amber-400/50 bg-amber-400/10 text-white"
                      : "border-cyan-400/50 bg-cyan-400/10 text-white"
                    : "border-white/8 bg-white/4 text-white/45 hover:bg-white/6",
                )}
              >
                <Icon className={cn("h-5 w-5", isUrgent ? "text-amber-400" : "text-cyan-400")} />
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[10px] text-white/40 text-center leading-tight">{opt.sub}</span>
                {opt.price && (
                  <span className="mt-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    {opt.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ─── Step 2: Delivery / Location ─── */
function StepDelivery({
  delivery,
  onUpdate,
}: {
  delivery: BookingFormData["delivery"];
  onUpdate: (d: Partial<BookingFormData["delivery"]>) => void;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-1">Service address</h2>
        <p className="text-sm text-white/40 mb-4">
          Where should the provider come?
        </p>
        <AddressAutocomplete
          value={delivery.address}
          onChange={(address, lat, lng) => onUpdate({ address, lat, lng })}
          placeholder="Search for an address…"
        />

        <div className="mt-4 flex gap-2">
          {(["home", "office", "other"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate({ type: t })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all active:scale-95",
                delivery.type === t
                  ? "border-cyan-400/50 bg-cyan-400/15 text-white"
                  : "border-white/10 bg-white/4 text-white/50 hover:bg-white/8",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Gate code, parking info, or special instructions…"
          value={delivery.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={2}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40 transition-all resize-none"
        />
      </section>
    </div>
  );
}

/* ─── Step 3: Payment + Review ─── */
function StepPayment({
  items,
  formData,
  cartTotal,
  onPaymentUpdate,
}: {
  items: CartItem[];
  formData: BookingFormData;
  cartTotal: string;
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
      {/* Payment method */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Payment method</h2>
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

      {/* Order review */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-white/70">Order review</h3>
        </div>

        <div className="px-4 space-y-3 pb-3">
          {items.map((item) => {
            const cat = getCategoryById(item.service.categoryId);
            return (
              <div key={item.service.id} className="flex items-center gap-3">
                <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={item.service.imageUrl}
                    alt={item.service.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-1">
                    {item.service.name}
                    {item.quantity > 1 && (
                      <span className="text-white/40"> ×{item.quantity}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-white/35">
                    {cat?.emoji} {cat?.name} · {item.service.duration}
                  </p>
                </div>
                <p className="text-sm font-medium text-cyan-300">
                  {item.service.priceRange}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/6 p-4 space-y-2.5">
          <SummaryRow label="Date" value={
            formData.scheduling.date
              ? new Date(formData.scheduling.date).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })
              : "—"
          } />
          <SummaryRow label="Time" value={formData.scheduling.time || "—"} />
          <SummaryRow label="Urgency" value={urgencyLabel ? `${urgencyLabel.label} ${urgencyLabel.price}` : "Standard"} />
          <div className="border-t border-white/6 pt-2.5" />
          <SummaryRow label="Address" value={formData.delivery.address || "—"} truncate />
          <SummaryRow label="Contact" value={formData.personal.name || "—"} />
          <SummaryRow label="Phone" value={formData.personal.phone || "—"} />
          {formData.delivery.notes && <SummaryRow label="Notes" value={formData.delivery.notes} truncate />}
          <div className="border-t border-white/6 pt-2.5" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Estimated total (from)</span>
            <span className="text-lg font-bold text-cyan-200">{cartTotal}+</span>
          </div>
          <p className="text-[10px] text-white/25">
            Final price confirmed after provider reviews the scope.
          </p>
        </div>
      </div>

      {/* Secure booking banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-cyan-400/8 border border-cyan-400/20 p-4">
        <Shield className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-cyan-100">Secure booking</p>
          <p className="text-xs text-white/45 mt-1">
            You won&apos;t be charged until the service is confirmed. Free cancellation up to 2 hours before.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared: labelled form input ─── */
function FormInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/50">{label}</label>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-400/40 transition-all">
        <span className="text-white/30">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
      </div>
    </div>
  );
}

/* ─── Shared: summary row ─── */
function SummaryRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="flex-shrink-0 text-white/40">{label}</span>
      <span className={cn("text-right", truncate && "truncate max-w-[200px]")}>{value}</span>
    </div>
  );
}
