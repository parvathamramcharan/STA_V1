"use client";

import { motion } from "framer-motion";
import PropTypes from "prop-types";
import {
  FileText,
  Activity,
  Layers,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  ShieldAlert,
  Server,
} from "lucide-react";

export function DashboardSummary({ data }) {
  const formatValue = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + " M";
    if (val >= 1000) return (val / 1000).toFixed(1) + " K";
    return val;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    );
  };

  const kpis = [
    {
      label: "Total PCAPs",
      value: data.total_pcaps,
      icon: FileText,
      color: "blue",
    },
    {
      label: "PCAP Packets",
      value: formatValue(data.pcap_packets),
      icon: Activity,
      color: "emerald",
    },
    {
      label: "Internal IPs",
      value: formatValue(data.internal_ip_count),
      icon: ArrowUpRight,
      color: "cyan",
    },
    {
      label: "Affected Hosts",
      value: data.infected_hosts_count,
      icon: ShieldAlert,
      color: "rose",
    },
    {
      label: "External IPs",
      value: formatValue(data.external_ip_count),
      icon: ArrowDownRight,
      color: "orange",
    },
    {
      label: "Duration",
      value: (data.duration_seconds / 3600).toFixed(1) + "h",
      icon: Layers,
      color: "violet",
    },
    {
      label: "Total Bytes",
      value: formatBytes(data.bytes),
      icon: Database,
      color: "slate",
    },
    {
      label: "Connections",
      value: formatValue(data.connections),
      icon: Globe,
      color: "indigo",
    },
    {
      label: "FTP Sessions",
      value: formatValue(data.ftp_sessions_count),
      icon: Server,
      color: "amber",
    },
  ];

  const getIconColorClass = (color) => {
    const map = {
      blue: "text-blue-500",
      emerald: "text-emerald-500",
      violet: "text-violet-500",
      slate: "text-slate-500",
      cyan: "text-cyan-500",
      orange: "text-orange-500",
      indigo: "text-indigo-500",
      amber: "text-amber-500",
      rose: "text-rose-500",
    };
    return map[color] || "text-slate-500";
  };

  const getIconBgClass = (color) => {
    const map = {
      blue: "bg-blue-500/10",
      emerald: "bg-emerald-500/10",
      violet: "bg-violet-500/10",
      slate: "bg-slate-500/10",
      cyan: "bg-cyan-500/10",
      orange: "bg-orange-500/10",
      indigo: "bg-indigo-500/10",
      amber: "bg-amber-500/10",
      rose: "bg-rose-500/10",
    };
    return map[color] || "bg-slate-500/10";
  };

  return (
    <div className="mx-6 my-4">
      <div className="rounded-2xl border border-theme bg-card shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 rounded-full bg-blue-500" />
          <span className="text-[14px] font-bold  tracking-widest ">
            Capture Summary
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
              style={{ border: `1.5px solid ${borderColor(kpi.color)}40` }}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl ${getIconBgClass(kpi.color)} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <kpi.icon
                    size={28}
                    className={getIconColorClass(kpi.color)}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-0.5">
                    {kpi.label}
                  </p>
                  <h3 className="text-[15px] text-black dark:text-slate-400 tabular-nums">
                    {kpi.value}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BORDER_COLORS = {
  blue: "#3b82f6",
  emerald: "#10b981",
  cyan: "#06b6d4",
  rose: "#f43f5e",
  orange: "#f97316",
  violet: "#8b5cf6",
  slate: "#64748b",
  indigo: "#6366f1",
  amber: "#f59e0b",
};
const borderColor = (c) => BORDER_COLORS[c] || "#64748b";

function getIconBg(color) {
  const map = {
    blue: "bg-blue-50",
    emerald: "bg-emerald-50",
    violet: "bg-violet-50",
    slate: "bg-slate-50",
    cyan: "bg-cyan-50",
    orange: "bg-orange-50",
    indigo: "bg-indigo-50",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
  };
  return map[color] || "bg-slate-50";
}

function getIconColor(color) {
  const map = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    slate: "text-slate-600",
    cyan: "text-cyan-600",
    orange: "text-orange-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return map[color] || "text-slate-600";
}

DashboardSummary.propTypes = {
  data: PropTypes.object,
};
