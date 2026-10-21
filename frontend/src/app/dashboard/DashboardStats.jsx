"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";

const PKT = "#6c63ff"; // packets  — vivid indigo
const CONN = "#00b4d8"; // connections — electric cyan
const ROSE = "#f43f5e"; // affected hosts

/* ------------------------------------------------------------------ */
/* DashboardStats                                                       */
/* ------------------------------------------------------------------ */
export function DashboardStats({ stats }) {
  return (
    <div className="mx-6 my-4">
      {/* ── single outer card ── */}
      <div className="rounded-2xl border border-theme bg-card shadow-sm overflow-hidden">
        {/* ── 2×2 stat grid ── */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatTable
            title="Top 10 Active IPs"
            data={stats.top_active_ips}
            labelKey="ip"
            headerLabel="IP Address"
          />
          <StatTable
            title="Top 10 Countries"
            data={stats.top_countries}
            labelKey="name"
            headerLabel="Country"
          />
          <StatTable
            title="Top 10 Cities"
            data={stats.top_cities}
            labelKey="name"
            headerLabel="City"
          />
          <StatTable
            title="Top 10 ISPs"
            data={stats.top_isps}
            labelKey="name"
            headerLabel="Provider"
          />
        </div>

        {/* ── divider ── */}
        <div className="mx-5 border-t border-theme" />

        {/* ── affected hosts ── */}
        <div className="p-5">
          <InfectedHostsTable hosts={stats.infected_hosts} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatTable                                                            */
/* ------------------------------------------------------------------ */
const ROW_H = 38;
const VISIBLE = 5;

function StatTable({ title, data = [], labelKey, headerLabel }) {
  const [metric, setMetric] = useState("packets");
  const accent = metric === "packets" ? PKT : CONN;

  const sorted = [...data]
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, 10);

  const max = sorted[0]?.[metric] || 1;

  const fmt = (v) => {
    if (v == null) return "0";
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return v.toLocaleString();
  };

  return (
    <div className="rounded-xl border border-theme overflow-hidden bg-white dark:bg-slate-900/50">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme">
        <div className="flex items-center gap-2">
          <span
            className="w-[3px] h-4 rounded-full"
            style={{ background: accent }}
          />
          <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
        </div>

        {/* pill toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {[
            ["packets", "Packets", PKT],
            ["connections", "Connections", CONN],
          ].map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200"
              style={
                metric === key
                  ? {
                      background: color,
                      color: "#fff",
                      boxShadow: `0 2px 10px ${color}50`,
                    }
                  : { color: "#94a3b8" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* column headers */}
      <div className="grid grid-cols-[28px_1fr_auto] gap-x-3 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-b border-theme">
        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200">
          S.NO
        </span>
        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200">
          {headerLabel}
        </span>
        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200">
          {metric === "packets" ? "Packets" : "Connections"}
        </span>
      </div>

      {/* rows */}
      <div className="overflow-y-auto" style={{ maxHeight: ROW_H * VISIBLE }}>
        <AnimatePresence mode="wait">
          {sorted.length > 0 ? (
            sorted.map((item, idx) => {
              return (
                <motion.div
                  key={`${metric}-${idx}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.018 }}
                  className="relative grid grid-cols-[28px_1fr_auto] gap-x-3 items-center px-4 group"
                  style={{
                    height: ROW_H,
                    background:
                      idx % 2 !== 0 ? "rgba(0,0,0,0.018)" : "transparent",
                  }}
                >
                  {/* hover left bar */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: accent }}
                  />

                  <span className="relative z-10 text-[10.5px] font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <span className="relative z-10 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 truncate group-hover:translate-x-0.5 transition-transform duration-150">
                    {item[labelKey]}
                  </span>

                  <span
                    className="relative z-10 text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md whitespace-nowrap"
                    style={{ background: `${accent}18`, color: accent }}
                  >
                    {fmt(item[metric])}
                  </span>
                </motion.div>
              );
            })
          ) : (
            <div className="flex items-center justify-center py-10 text-[11.5px] text-slate-300 dark:text-slate-700">
              Gathering records…
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

StatTable.propTypes = {
  title: PropTypes.string,
  data: PropTypes.array,
  labelKey: PropTypes.string,
  headerLabel: PropTypes.string,
};

/* ------------------------------------------------------------------ */
/* InfectedHostsTable       */
/* ------------------------------------------------------------------ */
function InfectedHostsTable({ hosts = [] }) {
  const [page, setPage] = useState(1);
  const PER_PAGE = 18;
  const total = Math.ceil(hosts.length / PER_PAGE) || 1;
  const slice = hosts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => {
    if (total <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= total - 2) return total - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="rounded-xl border border-theme overflow-hidden bg-white dark:bg-slate-900/50">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-theme">
        <div className="flex items-center gap-2">
          <span
            className="w-[3px] h-4 rounded-full"
            style={{ background: ROSE }}
          />
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Affected Hosts
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {total > 1 && (
            <span className="text-[11px] text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {page}
              </span>
              {" / "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {total}
              </span>
            </span>
          )}
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
            style={{ background: `${ROSE}15`, color: ROSE }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: ROSE }}
            />
            {hosts.length} hosts
          </span>
        </div>
      </div>

      {/* chips — fixed min-height so last page doesn't collapse */}
      <div className="p-4">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
          style={{ minHeight: Math.ceil(PER_PAGE / 6) * 44 }}
        >
          <AnimatePresence mode="wait">
            {slice.map((ip, idx) => (
              <motion.div
                key={ip}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.012 }}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-theme cursor-default transition-all"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${ROSE}0d`;
                  e.currentTarget.style.borderColor = `${ROSE}55`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "";
                }}
              >
                <span className="text-[10.5px] font-bold tabular-nums text-slate-700 dark:text-slate-300 w-5 shrink-0">
                  {String((page - 1) * PER_PAGE + idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[11.5px] font-medium text-slate-600 dark:text-slate-400 truncate">
                  {ip}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* pagination */}
      {total > 1 && (
        <div className="px-4 py-3 border-t border-theme flex items-center justify-end gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-theme text-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-rose-300 hover:text-rose-500"
          >
            <ChevronLeft size={13} />
          </button>

          {pages.map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPage(p)}
              className="w-7 h-7 flex items-center justify-center text-[11px] font-bold rounded-lg border transition-all"
              style={
                page === p
                  ? {
                      background: ROSE,
                      color: "#fff",
                      borderColor: ROSE,
                      boxShadow: `0 2px 8px ${ROSE}45`,
                    }
                  : { borderColor: "transparent", color: "#94a3b8" }
              }
            >
              {p}
            </motion.button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page === total}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-theme text-slate-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-rose-300 hover:text-rose-500"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

InfectedHostsTable.propTypes = { hosts: PropTypes.array };

DashboardStats.propTypes = {
  stats: PropTypes.shape({
    top_active_ips: PropTypes.array,
    top_countries: PropTypes.array,
    top_cities: PropTypes.array,
    top_isps: PropTypes.array,
    infected_hosts: PropTypes.array,
  }),
};
