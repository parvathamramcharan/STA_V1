"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertTriangle, X } from "lucide-react";

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  error,
  isPending,
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-card rounded-[2rem] shadow-2xl z-[101] overflow-hidden border border-theme transition-colors"
          >
            <div className="p-8 text-center">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-foreground hover:bg-slate-500/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-serif text-foreground mb-3 ">
                Confirm Logout
              </h3>
              <p className=" font-serif leading-relaxed mb-10">
                Are you sure you want to terminate your current session?
              </p>
              {error && (
                <p className="mb-6 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 px-4 py-4 text-xl font-serif  bg-slate-500/5 hover:bg-slate-500/10 rounded-xl transition-all active:scale-95 border border-theme"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="flex-1 px-4 py-4 text-xl font-serif  text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                >
                  {isPending ? "Revoking..." : "Logout"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
