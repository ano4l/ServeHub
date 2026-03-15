import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "border-stone-200 bg-stone-100 text-stone-700",
        primary:   "border-stone-800 bg-stone-900 text-white",
        accent:    "border-lime-300 bg-lime-100 text-lime-800",
        success:   "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:   "border-amber-200 bg-amber-50 text-amber-700",
        danger:    "border-red-200 bg-red-50 text-red-700",
        info:      "border-blue-200 bg-blue-50 text-blue-700",
        violet:    "border-violet-200 bg-violet-50 text-violet-700",
        outline:   "border-current bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
