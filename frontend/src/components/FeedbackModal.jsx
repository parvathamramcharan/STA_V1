"use client";

import React, { useState, useEffect } from "react";
import { X, Send, MessageSquare } from "lucide-react";

export function FeedbackModal({ isOpen, onClose, user }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organisation: "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset any previous status when opening fresh
      setStatus(null);
      // Prefill name/email if available from user prop
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        organisation: "",
        message: "",
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: "error",
        text: "Name, email and message are required.",
      });
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const baseUrl =
        typeof window === "undefined" ? process.env.BACKEND_URL : "/api/proxy";

      const body = new URLSearchParams({
        name: formData.name,
        email: formData.email,
        organisation: formData.organisation,
        message: formData.message,
      });

      const res = await fetch(`${baseUrl}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Try to parse JSON, but treat HTTP 2xx as success regardless
      let json = {};
      try {
        json = await res.json();
      } catch (_) {}

      if (res.ok || json.success) {
        setStatus({
          type: "success",
          text: "✓ Feedback submitted successfully. Thank you!",
        });
        setFormData({ name: "", email: "", message: "", organisation: "" });
        // Auto-close after 2s
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus({
          type: "error",
          text: json.error || `Submission failed (${res.status}).`,
        });
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        setStatus({
          type: "error",
          text: "Request timed out. Please try again.",
        });
      } else {
        setStatus({ type: "error", text: "Network error. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-theme rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-theme bg-slate-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <MessageSquare size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold font-serif  text-foreground">
                Submit Feedback
              </h2>
              <p className="font-serif  mt-0.5">
                Share your valuable feedback{" "}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-foreground hover:bg-slate-500/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="feedback-name" className="font-serif ">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-slate-500/5 border border-theme rounded-xl px-4 py-3 text-sm  text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-email" className="font-serif">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onInvalid={(e) =>
                e.target.setCustomValidity("enter valid email address")
              }
              onInput={(e) => e.target.setCustomValidity("")}
              required
              className="w-full bg-slate-500/5 border border-theme rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-organisation" className="font-serif  ">
              Organisation
            </label>
            <input
              id="feedback-organisation"
              type="text"
              name="organisation"
              value={formData.organisation}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full bg-slate-500/5 border border-theme rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-message" className="font-serif">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="feedback-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full bg-slate-500/5 border border-theme rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
            />
          </div>

          {status && (
            <div
              className={`p-4 rounded-xl text-sm font-serif flex items-center gap-2 ${
                status.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}
            >
              {status.text}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-serif text-slate-400 hover:text-foreground hover:bg-slate-500/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-serif text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={16} />
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
