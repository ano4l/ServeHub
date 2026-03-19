import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServiceItem } from "@/lib/services-directory";

export interface CartItem {
  service: ServiceItem;
  quantity: number;
  notes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (service: ServiceItem, notes?: string) => void;
  removeItem: (serviceId: number) => void;
  updateQuantity: (serviceId: number, quantity: number) => void;
  updateNotes: (serviceId: number, notes: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  getItemCount: () => number;
  getCartTotal: () => string;
}

function parseMinPrice(priceRange: string): number {
  const match = priceRange.match(/R\s*([\d\s]+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/\s/g, ""), 10);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (service, notes) => {
        set((state) => {
          const existing = state.items.find((i) => i.service.id === service.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.service.id === service.id
                  ? { ...i, quantity: i.quantity + 1, notes: notes ?? i.notes }
                  : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { service, quantity: 1, notes }],
            isOpen: true,
          };
        });
      },

      removeItem: (serviceId) => {
        set((state) => ({
          items: state.items.filter((i) => i.service.id !== serviceId),
        }));
      },

      updateQuantity: (serviceId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(serviceId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.service.id === serviceId ? { ...i, quantity } : i,
          ),
        }));
      },

      updateNotes: (serviceId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.service.id === serviceId ? { ...i, notes } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [], isOpen: false }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getCartTotal: () => {
        const total = get().items.reduce(
          (sum, i) => sum + parseMinPrice(i.service.priceRange) * i.quantity,
          0,
        );
        return `R${total.toLocaleString("en-ZA")}`;
      },
    }),
    {
      name: "servehub-cart",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
