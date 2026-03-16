import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "border-stone-200 bg-stone-100 text-stone-700 dark:border-white/20 dark:bg-white/10 dark:text-white",
        primary:   "border-stone-800 bg-stone-900 text-white dark:border-white/30 dark:bg-white/20 dark:text-white",
        accent:    "border-lime-300 bg-lime-100 text-lime-800 dark:border-lime-400/50 dark:bg-lime-500/20 dark:text-lime-300",
        success:   "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-300",
        warning:   "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-300",
        danger:    "border-red-200 bg-red-50 text-red-700 dark:border-red-400/50 dark:bg-red-500/20 dark:text-red-300",
        info:      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/50 dark:bg-blue-500/20 dark:text-blue-300",
        violet:    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/20 dark:text-violet-300",
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
