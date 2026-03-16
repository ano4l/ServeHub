"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

const icons = {
  success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  error:   <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info:    <Info className="h-4 w-4 text-blue-500" />,
};

const bgMap = {
  success: "border-emerald-200 bg-emerald-50",
  error:   "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info:    "border-blue-200 bg-blue-50",
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5 shadow-lg backdrop-blur-sm",
              bgMap[toast.type]
            )}
          >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm text-stone-800">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-stone-400 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
