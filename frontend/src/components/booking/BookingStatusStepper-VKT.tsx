"use client";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/constants";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";

const STEPS: { status: BookingStatus; label: string }[] = [
  { status: "REQUESTED",   label: "Requested" },
  { status: "ACCEPTED",    label: "Accepted" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED",   label: "Completed" },
];

const TERMINAL_NEGATIVE: BookingStatus[] = ["DECLINED", "EXPIRED", "CANCELLED"];

interface BookingStatusStepperProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusStepper({ status, className }: BookingStatusStepperProps) {
  const config = BOOKING_STATUS_CONFIG[status];
  const isTerminalNegative = TERMINAL_NEGATIVE.includes(status);
  const currentStep = isTerminalNegative ? -1 : config.step;

  if (isTerminalNegative) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border", config.bg, config.color)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;
          const upcoming = idx > currentStep;

          return (
            <div key={step.status} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    done    && "bg-stone-900 border-stone-900 text-white",
                    active  && "bg-white border-stone-900 text-stone-900 shadow-[0_0_0_4px_rgba(28,25,23,0.08)]",
                    upcoming && "bg-white border-stone-200 text-stone-300"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    done    && "text-stone-700",
                    active  && "text-stone-900",
                    upcoming && "text-stone-300"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1 mb-6 transition-all duration-500",
                  idx < currentStep ? "bg-stone-900" : "bg-stone-200"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = BOOKING_STATUS_CONFIG[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.bg, config.color
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
