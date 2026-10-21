"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

export function ConfirmModal({
  isOpen,
  title = "Confirm",
  description,
  confirmLabel = "Confirm",
  onClose,
  onConfirm,
  destructive = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] bg-card rounded-[1.25rem] shadow-2xl z-[101] overflow-hidden border border-theme transition-colors"
          >
            <div className="p-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-foreground hover:bg-slate-500/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertTriangle size={30} strokeWidth={1.2} />
              </div>

              <h3 className="text-xl font-serif text-foreground mb-2 ">
                {title}
              </h3>
              {description && (
                <p className="text-slate-500 text-[14px] mb-6">{description}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-[13px] font-black text-slate-500 bg-slate-500/5 hover:bg-slate-500/10 rounded-xl transition-all active:scale-95 border border-theme"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-3 text-[13px] font-black text-white rounded-xl transition-all active:scale-95 ${destructive ? "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20" : "bg-blue-600 hover:bg-blue-500"}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
