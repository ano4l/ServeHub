import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:   "bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-stone-900 shadow-sm",
        secondary: "bg-white text-stone-900 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 focus-visible:ring-stone-400 shadow-sm",
        accent:    "bg-lime-400 text-stone-900 hover:bg-lime-300 focus-visible:ring-lime-400 shadow-sm",
        danger:    "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm",
        ghost:     "text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-stone-400",
        link:      "text-stone-900 underline-offset-4 hover:underline p-0 h-auto",
        outline:   "border border-stone-300 bg-transparent text-stone-700 hover:bg-stone-50 focus-visible:ring-stone-400",
      },
      size: {
        xs:   "h-7 px-2.5 text-xs rounded-lg",
        sm:   "h-8 px-3 text-sm",
        md:   "h-10 px-4",
        lg:   "h-11 px-6 text-base",
        xl:   "h-12 px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLElement>}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
