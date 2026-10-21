"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Mail,
  Building2,
  Clock,
  AlertCircle,
  Trash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

// Stable identity for a feedback item — falls back to a composite of
// fields that should be unique per submission if no server id exists.
const getFeedbackKey = (feedback) =>
  feedback.id ??
  `${feedback.submitted_at || ""}|${feedback.email || feedback.name || ""}`;

export function ViewFeedbackModal({ isOpen, onClose }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchFeedback();
    }
  }, [isOpen]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const baseUrl =
        typeof window === "undefined" ? process.env.BACKEND_URL : "/api/proxy";

      const res = await fetch(`${baseUrl}/feedback`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        // ignore parse errors
      }

      if (!res.ok) {
        const serverMsg = json && (json.error || json.message);
        if (res.status >= 500) {
          throw new Error(serverMsg || "Server error. Please try again later.");
        } else if (res.status >= 400) {
          throw new Error(serverMsg || `Request failed (${res.status}).`);
        } else {
          throw new Error(serverMsg || `Unexpected response (${res.status}).`);
        }
      }

      const data = json || {};

      if (data.success && Array.isArray(data.data)) {
        setFeedbackList(data.data);
      } else if (Array.isArray(data)) {
        setFeedbackList(data);
      } else {
        setFeedbackList([]);
        setError("No feedback available.");
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(
          err?.message || "Failed to fetch feedback. Please try again later.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = (feedback) => {
    setToDelete({ feedback });
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!toDelete) return;
    const { feedback } = toDelete;
    const key = getFeedbackKey(feedback);
    setConfirmOpen(false);
    setDeleting(key);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const baseUrl =
        typeof window === "undefined" ? process.env.BACKEND_URL : "/api/proxy";

      const idOrKey = feedback.id
        ? encodeURIComponent(feedback.id)
        : encodeURIComponent(
            feedback.name || feedback.email || feedback.submitted_at,
          );
      const res = await fetch(`${baseUrl}/feedback/${idOrKey}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let json = null;
      try {
        json = await res.json();
      } catch (_) {}

      if (!res.ok && !(json && json.success)) {
        const serverMsg = json && (json.error || json.message);
        throw new Error(serverMsg || `Delete failed (${res.status}).`);
      }

      // Remove item from UI by stable key, not by index (indices shift on delete).
      setFeedbackList((prev) =>
        prev.filter((item) => getFeedbackKey(item) !== key),
      );
      setExpanded((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
      setToDelete(null);
    } catch (err) {
      if (err && err.name === "AbortError") {
        setError("Delete request timed out. Please try again.");
      } else {
        setError(err?.message || "Failed to delete feedback. Try again later.");
      }
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const uniqueRoles = Array.from(
    new Set(feedbackList.map((f) => f.role).filter(Boolean)),
  );
  const filteredList = feedbackList.filter((f) => {
    if (roleFilter && roleFilter !== "all") {
      if ((f.role || "").toLowerCase() !== (roleFilter || "").toLowerCase())
        return false;
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      const submitted = new Date(f.submitted_at);
      if (isFinite(from.getTime()) && submitted < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      const submitted = new Date(f.submitted_at);
      if (isFinite(to.getTime()) && submitted > to) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-card dark:bg-slate-900 overflow-auto">
      <div className="w-full h-screen flex flex-col bg-card border border-theme rounded-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme bg-slate-500/5 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <MessageSquare size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif text-foreground">
                Feedbacks
              </h2>
              <p className=" font-serif    mt-0.5">
                View all submitted feedbacks
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-sm font-serif">Loading feedback...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-500/10 rounded-xl mb-3">
                  <AlertCircle size={24} className="text-rose-500" />
                </div>
                <p className="text-sm font-bold text-rose-500">{error}</p>
                <button
                  onClick={fetchFeedback}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare
                  size={32}
                  className="mx-auto text-slate-400 mb-3"
                />
                <p className="text-sm font-serif">No feedback available yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters and counts */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className=" font-serif">Total:</div>
                  <div className="text-foreground font-serif">
                    {feedbackList.length}
                  </div>
                  <div className=" font-serif">
                    (Showing {filteredList.length})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border bg-card text-sm"
                  >
                    <option value="all">All roles</option>
                    {uniqueRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 rounded-xl border bg-card text-sm"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 rounded-xl border bg-card text-sm"
                  />
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className="px-3 py-2 bg-slate-500/10 rounded-xl font-serif"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {filteredList.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center font-serif">
                    No feedback matches the selected filters.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-[10fr_12fr_10fr_8fr_11fr_13fr] gap-4 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-4 py-3 font-serif ">
                    <div className="text-left">Name</div>
                    <div className="text-left">Email</div>
                    <div className="text-left">Organisation</div>
                    <div className="text-left">Role</div>
                    <div className="text-left">Submitted</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {filteredList.map((feedback) => {
                    const key = getFeedbackKey(feedback);
                    return (
                      <div
                        key={key}
                        className="bg-slate-50  p-4 shadow-sm transition-colors rounded-xl dark:bg-slate-800 dark:text-slate-400"
                      >
                        <div className="grid grid-cols-[10fr_12fr_10fr_8fr_11fr_13fr] items-center gap-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg flex-shrink-0">
                              <MessageSquare
                                size={16}
                                className="text-blue-500"
                              />
                            </div>
                            <p className="text-base font-serif  text-foreground truncate">
                              {feedback.name || "N/A"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg flex-shrink-0">
                              <Mail size={16} className="text-emerald-500" />
                            </div>
                            <p className="text-base font-serif text-foreground truncate">
                              {feedback.email || "N/A"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                              <Building2 size={16} className="text-amber-500" />
                            </div>
                            <p className="text-base font-serif text-foreground truncate">
                              {feedback.organisation || "N/A"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-violet-500/10 rounded-lg flex-shrink-0">
                              <Building2
                                size={16}
                                className="text-violet-500"
                              />
                            </div>
                            <p className="text-base font-serif text-foreground truncate">
                              {feedback.role || "N/A"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-slate-500/10 rounded-lg flex-shrink-0">
                              <Clock size={16} className="text-slate-500" />
                            </div>
                            <p className="text-base font-serif           text-foreground truncate">
                              {formatDate(feedback.submitted_at)}
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpand(key)}
                              className="whitespace-nowrap rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-normal text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              {expanded.has(key) ? "Hide" : "View"}
                            </button>
                            <button
                              onClick={() => handleDelete(feedback)}
                              disabled={deleting === key}
                              className="whitespace-nowrap rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-normal text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleting === key ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>

                        {expanded.has(key) && (
                          <div className="mt-4 pt-3 border-t border-theme">
                            <p className="text-[12px] font-serif mb-2">
                              Message
                            </p>
                            <p className="text-base text-foreground break-words whitespace-pre-wrap">
                              {feedback.message || "No message provided"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-theme p-4 flex justify-end gap-3 bg-slate-500/5 flex-shrink-0">
          <button
            onClick={fetchFeedback}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>
        <ConfirmModal
          isOpen={confirmOpen}
          title="Delete Feedback"
          description={
            toDelete
              ? `Delete feedback from ${toDelete.feedback.email || toDelete.feedback.name}? This action cannot be undone.`
              : undefined
          }
          confirmLabel="Delete"
          destructive
          onClose={() => setConfirmOpen(false)}
          onConfirm={performDelete}
        />
      </div>
    </div>
  );
}
