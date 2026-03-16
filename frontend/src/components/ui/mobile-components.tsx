"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";

// Mobile-optimized button with proper touch targets
export const MobileButton = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, children, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      "min-h-[44px] min-w-[44px] active:scale-95 transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </Button>
));
MobileButton.displayName = "MobileButton";

// Mobile-optimized input with proper touch targets
export const MobileInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "min-h-[44px] rounded-lg border border-stone-200 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2",
      className
    )}
    {...props}
  />
));
MobileInput.displayName = "MobileInput";

// Safe area wrapper for notched devices
export const SafeAreaWrapper = ({ 
  children, 
  className,
  top = false,
  bottom = false,
  left = false,
  right = false
}: {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}) => (
  <div
    className={cn(
      "relative",
      top && "safe-area-top",
      bottom && "safe-area-bottom",
      left && "safe-area-left",
      right && "safe-area-right",
      className
    )}
  >
    {children}
  </div>
);

// Mobile-optimized card with proper touch targets
export const MobileCard = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-stone-200 bg-white p-4 shadow-sm active:shadow-md transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
MobileCard.displayName = "MobileCard";

// Mobile-optimized list item with proper touch targets
export const MobileListItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-[44px] items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 active:bg-stone-50 transition-colors duration-200",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
MobileListItem.displayName = "MobileListItem";

// Mobile-optimized bottom sheet modal
export const MobileBottomSheet = ({ 
  isOpen, 
  onClose, 
  children,
  title,
  className 
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={cn(
        "relative w-full rounded-t-3xl bg-white p-6 safe-area-bottom",
        "animate-slide-up",
        className
      )}>
        {/* Handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300" />
        
        {/* Title */}
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-stone-900">{title}</h2>
        )}
        
        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized pull-to-refresh indicator
export const PullToRefresh = ({ 
  isRefreshing, 
  onRefresh, 
  children 
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="relative">
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
        </div>
      )}
      <div
        className="overflow-y-auto"
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const pullDistance = touch.clientY;
          if (pullDistance > 100) {
            onRefresh();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Mobile-optimized swipe gesture wrapper
export const SwipeGesture = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className 
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}) => {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.targetTouches[0].clientX;
    touchStartY = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    const swipeThreshold = 50;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diffX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > swipeThreshold) {
        if (diffY > 0 && onSwipeUp) {
          onSwipeUp();
        } else if (diffY < 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    }
  };

  return (
    <div
      className={cn("touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
