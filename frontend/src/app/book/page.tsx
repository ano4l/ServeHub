"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, User, CreditCard, Check, X } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HOME_SERVICE_FIXTURES } from "@/lib/app-home-fixtures";
import { HOME_ADDRESS_FIXTURES } from "@/lib/app-home-fixtures";

interface BookingFormData {
  service: {
    provider: string;
    service: string;
    category: string;
    price: string;
  };
  scheduling: {
    date: string;
    time: string;
    urgency: "standard" | "urgent" | "emergency";
  };
  location: {
    address: string;
    type: "home" | "office" | "other";
    notes: string;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
    preferredContact: "phone" | "email" | "whatsapp";
  };
  payment: {
    method: "card" | "cash" | "eft";
    cardNumber?: string;
    saveCard: boolean;
  };
}

const STEPS = [
  { id: 1, name: "Service", icon: User },
  { id: 2, name: "Schedule", icon: Calendar },
  { id: 3, name: "Location", icon: MapPin },
  { id: 4, name: "Contact", icon: Clock },
  { id: 5, name: "Payment", icon: CreditCard },
  { id: 6, name: "Review", icon: Check },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard (3-5 days)", price: "Standard pricing" },
  { value: "urgent", label: "Urgent (24-48 hours)", price: "+25% surcharge" },
  { value: "emergency", label: "Emergency (Same day)", price: "+50% surcharge" },
];

export default function BookNowPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(() => {
    // Check for pre-filled data from explore page
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('bookingData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          return {
            service: {
              provider: parsedData.provider || "",
              service: parsedData.service || "",
              category: parsedData.category || "",
              price: parsedData.price || "",
            },
            scheduling: {
              date: "",
              time: "",
              urgency: "standard",
            },
            location: {
              address: "",
              type: "home",
              notes: "",
            },
            contact: {
              name: "",
              phone: "",
              email: "",
              preferredContact: "phone",
            },
            payment: {
              method: "card",
              saveCard: false,
            },
          };
        } catch (error) {
          console.error('Error parsing booking data:', error);
        }
      }
    }
    
    // Default form data
    return {
      service: {
        provider: "",
        service: "",
        category: "",
        price: "",
      },
      scheduling: {
        date: "",
        time: "",
        urgency: "standard",
      },
      location: {
        address: "",
        type: "home",
        notes: "",
      },
      contact: {
        name: "",
        phone: "",
        email: "",
        preferredContact: "phone",
      },
      payment: {
        method: "card",
        saveCard: false,
      },
    };
  });

  const updateFormData = (step: keyof BookingFormData, data: Partial<BookingFormData[typeof step]>) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.service.provider && formData.service.service;
      case 2:
        return formData.scheduling.date && formData.scheduling.time;
      case 3:
        return formData.location.address;
      case 4:
        return formData.contact.name && formData.contact.phone && formData.contact.email;
      case 5:
        return formData.payment.method;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const submitBooking = () => {
    // In a real app, this would submit to an API
    console.log("Booking submitted:", formData);
    router.push("/bookings/confirmation");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelectionStep data={formData.service} onUpdate={(data) => updateFormData("service", data)} />;
      case 2:
        return <SchedulingStep data={formData.scheduling} onUpdate={(data) => updateFormData("scheduling", data)} />;
      case 3:
        return <LocationStep data={formData.location} onUpdate={(data) => updateFormData("location", data)} />;
      case 4:
        return <ContactStep data={formData.contact} onUpdate={(data) => updateFormData("contact", data)} />;
      case 5:
        return <PaymentStep data={formData.payment} onUpdate={(data) => updateFormData("payment", data)} />;
      case 6:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#07111f] text-white safe-area-top safe-area-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
      <div className="relative mx-auto max-w-2xl px-4 pb-36 pt-4 sm:px-6">
        {/* Compact header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => currentStep > 1 ? prevStep() : router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold">Book a Service</h1>
            <p className="text-xs text-white/50">
              Step {currentStep} of {STEPS.length} · {STEPS[currentStep - 1].name}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/15 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Uber-style thin progress bar */}
        <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="mt-3 flex items-center justify-between px-1">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => isCompleted ? setCurrentStep(step.id) : undefined}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-medium transition-all",
                  isActive
                    ? "text-white"
                    : isCompleted
                      ? "text-cyan-300/70 cursor-pointer hover:text-cyan-200"
                      : "text-white/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                    isActive
                      ? "bg-white text-slate-950"
                      : isCompleted
                        ? "bg-cyan-400/20 text-cyan-300"
                        : "bg-white/8 text-white/30",
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.name}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur-md sm:p-6">
          {renderStep()}
        </div>
      </div>

      {/* Floating bottom CTA (Uber-style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-[#07111f]/95 backdrop-blur-xl safe-area-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {currentStep === STEPS.length ? (
            <button
              onClick={submitBooking}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white font-semibold text-slate-950 active:scale-[0.98] transition-all shadow-lg"
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
                  ? "bg-white text-slate-950 shadow-lg"
                  : "bg-white/10 text-white/30 cursor-not-allowed",
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

// Step Components
function ServiceSelectionStep({ data, onUpdate }: { data: BookingFormData["service"], onUpdate: (data: Partial<BookingFormData["service"]>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
        <div className="grid gap-4">
          {HOME_SERVICE_FIXTURES.map((service) => (
            <Card
              key={service.id}
              className={cn(
                "cursor-pointer border transition-all",
                data.provider === service.providerName
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              )}
              onClick={() => onUpdate({
                provider: service.providerName,
                service: service.title,
                category: service.category,
                price: service.priceLabel,
              })}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.title}</h3>
                    <p className="text-sm text-white/70 mt-1">{service.subtitle}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="info" className="text-xs">{service.category}</Badge>
                      <span className="text-sm text-cyan-100">{service.priceLabel}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {data.provider === service.providerName && (
                      <div className="h-6 w-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <Check className="h-4 w-4 text-slate-900" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchedulingStep({ data, onUpdate }: { data: BookingFormData["scheduling"], onUpdate: (data: Partial<BookingFormData["scheduling"]>) => void }) {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">When do you need this service?</h2>
        
        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Preferred Date</label>
          <Input
            type="date"
            min={today}
            value={data.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        {/* Time Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Preferred Time</label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => onUpdate({ time })}
                className={cn(
                  "rounded-lg border py-2 px-3 text-sm transition-all",
                  data.time === time
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Service Urgency</label>
          <div className="space-y-2">
            {URGENCY_OPTIONS.map((option) => (
              <Card
                key={option.value}
                className={cn(
                  "cursor-pointer border transition-all",
                  data.urgency === option.value
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                )}
                onClick={() => onUpdate({ urgency: option.value as any })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{option.label}</h3>
                      <p className="text-sm text-white/70">{option.price}</p>
                    </div>
                    {data.urgency === option.value && (
                      <Check className="h-5 w-5 text-cyan-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationStep({ data, onUpdate }: { data: BookingFormData["location"], onUpdate: (data: Partial<BookingFormData["location"]>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Where should the service be performed?</h2>
        
        {/* Address Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Service Address</label>
          <div className="space-y-2">
            {HOME_ADDRESS_FIXTURES.map((address) => (
              <Card
                key={address.id}
                className={cn(
                  "cursor-pointer border transition-all",
                  data.address === address.value
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                )}
                onClick={() => onUpdate({ 
                  address: address.value,
                  type: address.label.toLowerCase() as any
                })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{address.label}</h3>
                      <p className="text-sm text-white/70 mt-1">{address.value}</p>
                      <p className="text-xs text-white/50 mt-1">{address.note}</p>
                    </div>
                    {data.address === address.value && (
                      <Check className="h-5 w-5 text-cyan-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Or enter a custom address</label>
          <Input
            placeholder="Enter service address..."
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        {/* Location Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Location Type</label>
          <div className="flex gap-2">
            {["home", "office", "other"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onUpdate({ type: type as any })}
                className={cn(
                  "rounded-lg border py-2 px-4 text-sm capitalize transition-all",
                  data.type === type
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
          <textarea
            placeholder="Any special instructions or details about the location..."
            value={data.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder:text-white/50 min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}

function ContactStep({ data, onUpdate }: { data: BookingFormData["contact"], onUpdate: (data: Partial<BookingFormData["contact"]>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input
              placeholder="Enter your full name"
              value={data.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <Input
              type="tel"
              placeholder="+27 83 123 4567"
              value={data.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Contact Method</label>
            <div className="grid grid-cols-3 gap-2">
              {["phone", "email", "whatsapp"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => onUpdate({ preferredContact: method as any })}
                  className={cn(
                    "rounded-lg border py-2 px-3 text-sm capitalize transition-all",
                    data.preferredContact === method
                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
                      : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ data, onUpdate }: { data: BookingFormData["payment"], onUpdate: (data: Partial<BookingFormData["payment"]>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        
        <div className="space-y-3">
          {[
            { value: "card", label: "Credit/Debit Card", description: "Pay securely with your card" },
            { value: "cash", label: "Cash", description: "Pay in person when service is completed" },
            { value: "eft", label: "EFT/Bank Transfer", description: "Transfer directly to provider" },
          ].map((method) => (
            <Card
              key={method.value}
              className={cn(
                "cursor-pointer border transition-all",
                data.method === method.value
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              )}
              onClick={() => onUpdate({ method: method.value as any })}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{method.label}</h3>
                    <p className="text-sm text-white/70">{method.description}</p>
                  </div>
                  {data.method === method.value && (
                    <Check className="h-5 w-5 text-cyan-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {data.method === "card" && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={data.cardNumber || ""}
                onChange={(e) => onUpdate({ cardNumber: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveCard"
                checked={data.saveCard}
                onChange={(e) => onUpdate({ saveCard: e.target.checked })}
                className="rounded border-white/20 bg-white/10"
              />
              <label htmlFor="saveCard" className="text-sm text-white/70">
                Save card details for future bookings
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewStep({ formData }: { formData: BookingFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review Your Booking</h2>
        
        <div className="space-y-4">
          {/* Service Summary */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Service Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Provider:</span>
                  <span>{formData.service.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Service:</span>
                  <span>{formData.service.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Category:</span>
                  <span>{formData.service.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Price:</span>
                  <span className="text-cyan-100">{formData.service.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Summary */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Schedule</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Date:</span>
                  <span>{formData.scheduling.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Time:</span>
                  <span>{formData.scheduling.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Urgency:</span>
                  <span>{formData.scheduling.urgency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Summary */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Location</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Address:</span>
                  <span className="text-right max-w-[200px]">{formData.location.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Type:</span>
                  <span>{formData.location.type}</span>
                </div>
                {formData.location.notes && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Notes:</span>
                    <span className="text-right max-w-[200px]">{formData.location.notes}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Summary */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Name:</span>
                  <span>{formData.contact.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Phone:</span>
                  <span>{formData.contact.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Email:</span>
                  <span>{formData.contact.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Preferred Contact:</span>
                  <span>{formData.contact.preferredContact}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-white/20 bg-white/5">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Payment Method</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Method:</span>
                  <span>{formData.payment.method}</span>
                </div>
                {formData.payment.method === "card" && formData.payment.cardNumber && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Card:</span>
                    <span>•••• {formData.payment.cardNumber.slice(-4)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation */}
          <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-cyan-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-cyan-100">Ready to Book</h4>
                <p className="text-sm text-white/70 mt-1">
                  Click "Complete Booking" to submit your request. You'll receive a confirmation shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
