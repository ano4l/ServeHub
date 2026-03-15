import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] shadow-[0_10px_24px_rgba(45,77,120,0.12)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,#14284a_0%,#2457a5_100%)] text-white hover:shadow-[0_16px_32px_rgba(36,87,165,0.24)] hover:-translate-y-0.5",
        secondary:
          "liquid-panel glass-hairline text-slate-900 hover:bg-white/80 hover:-translate-y-0.5",
        accent:
          "bg-[linear-gradient(135deg,#8ef7d6_0%,#ffd27f_100%)] text-slate-950 hover:shadow-[0_16px_32px_rgba(255,210,127,0.24)] hover:-translate-y-0.5",
        danger:
          "bg-[linear-gradient(135deg,#ff6b6b_0%,#d43e4d_100%)] text-white hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(212,62,77,0.24)]",
        ghost:
          "bg-transparent text-slate-700 hover:bg-white/55 hover:text-slate-950 shadow-none",
        link:
          "bg-transparent p-0 h-auto rounded-none text-slate-900 underline-offset-4 hover:underline shadow-none",
        outline:
          "border border-slate-300/55 bg-white/45 text-slate-700 hover:bg-white/76 hover:border-white/80",
      },
      size: {
        xs: "h-7 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10 p-0 rounded-2xl",
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
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
