"use client";

import { useRouter } from "next/navigation";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { getCategoryById } from "@/lib/services-directory";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getCartTotal,
  } = useCartStore();

  const itemCount = getItemCount();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-[85] w-full max-w-md overflow-hidden border-l border-white/10 bg-[#0a1525] shadow-2xl sm:rounded-l-3xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15">
                <ShoppingCart className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Your cart</h2>
                <p className="text-xs text-white/40">
                  {itemCount} {itemCount === 1 ? "service" : "services"}
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/50 transition hover:bg-white/12 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <ShoppingCart className="h-7 w-7 text-white/20" />
                </div>
                <p className="mt-4 text-sm font-medium text-white/50">
                  Your cart is empty
                </p>
                <p className="mt-1 text-xs text-white/30">
                  Browse services and add them to your cart
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    router.push("/services");
                  }}
                  className="mt-5 flex items-center gap-2 rounded-full bg-white/8 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
                >
                  Browse services
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const cat = getCategoryById(item.service.categoryId);
                  return (
                    <div
                      key={item.service.id}
                      className="group rounded-2xl border border-white/8 bg-white/4 p-3 transition hover:border-white/12"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                          <img
                            src={item.service.imageUrl}
                            alt={item.service.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white line-clamp-1">
                                {item.service.name}
                              </p>
                              {cat && (
                                <p className="text-[11px] text-white/35">
                                  {cat.emoji} {cat.name}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.service.id)}
                              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/30 transition hover:bg-red-500/15 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
                            <span className="flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-current text-amber-400" />
                              {item.service.rating}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {item.service.duration}
                            </span>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-1.5">
                            <span className="text-sm font-semibold text-cyan-300">
                              {item.service.priceRange}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.service.id,
                                    item.quantity - 1,
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-5 text-center text-sm font-medium text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.service.id,
                                    item.quantity + 1,
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <p className="mt-2 rounded-lg bg-white/4 px-3 py-1.5 text-[11px] text-white/40 italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-white/8 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Estimated total (from)</span>
                <span className="text-lg font-bold text-white">
                  {getCartTotal()}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-white/30">
                Final price confirmed after provider review
              </p>

              <button
                onClick={() => {
                  closeCart();
                  router.push("/book");
                }}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:from-cyan-400 hover:to-blue-500"
              >
                Checkout · {itemCount}{" "}
                {itemCount === 1 ? "service" : "services"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={clearCart}
                className="mt-2 w-full text-center text-xs text-white/30 transition hover:text-white/50"
              >
                Clear cart
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function CartFab() {
  const { items, openCart } = useCartStore();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <button
      onClick={openCart}
      className={cn(
        "fixed bottom-24 right-4 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 hover:shadow-cyan-500/35",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
      )}
    >
      <ShoppingCart className="h-4.5 w-4.5 text-white" />
      <span className="text-sm font-semibold text-white">
        View cart · {itemCount}
      </span>
    </button>
  );
}
