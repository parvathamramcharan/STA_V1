import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  Search,
  Globe2,
  MapPin,
  Building2,
  Network,
  ShieldCheck,
  Server,
  Link2,
  FileArchive,
  Users,
  HardDrive,
  Flag,
} from "lucide-react";

const ITEMS_PER_PAGE = 5;

/* ============================================================
   STRONG ACCENT PALETTE
   ============================================================ */

const ACCENTS = {
  amber: {
    main: "#f59e0b",
    dark: "#b45309",
    text: "text-amber-600 dark:text-amber-400",
    header: "bg-amber-500/[0.10] dark:bg-amber-500/[0.12]",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconBorder: "border-amber-300 dark:border-amber-500/40",
    border: "border-amber-200 dark:border-amber-500/30",
    value: "text-amber-600 dark:text-amber-400",
    hover: "hover:bg-amber-500/[0.045] dark:hover:bg-amber-500/[0.08]",
    active:
      "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25",
    activeSoft:
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },

  cyan: {
    main: "#06b6d4",
    dark: "#0e7490",
    text: "text-cyan-600 dark:text-cyan-400",
    header: "bg-cyan-500/[0.10] dark:bg-cyan-500/[0.12]",
    iconBg: "bg-cyan-100 dark:bg-cyan-500/15",
    iconBorder: "border-cyan-300 dark:border-cyan-500/40",
    border: "border-cyan-200 dark:border-cyan-500/30",
    value: "text-cyan-600 dark:text-cyan-400",
    hover: "hover:bg-cyan-500/[0.045] dark:hover:bg-cyan-500/[0.08]",
    active:
      "bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/25",
    activeSoft:
      "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30",
    dot: "bg-cyan-500",
  },

  violet: {
    main: "#8b5cf6",
    dark: "#6d28d9",
    text: "text-violet-600 dark:text-violet-400",
    header: "bg-violet-500/[0.10] dark:bg-violet-500/[0.12]",
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconBorder: "border-violet-300 dark:border-violet-500/40",
    border: "border-violet-200 dark:border-violet-500/30",
    value: "text-violet-600 dark:text-violet-400",
    hover: "hover:bg-violet-500/[0.045] dark:hover:bg-violet-500/[0.08]",
    active:
      "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-500/25",
    activeSoft:
      "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
    dot: "bg-violet-500",
  },

  rose: {
    main: "#f43f5e",
    dark: "#be123c",
    text: "text-rose-600 dark:text-rose-400",
    header: "bg-rose-500/[0.10] dark:bg-rose-500/[0.12]",
    iconBg: "bg-rose-100 dark:bg-rose-500/15",
    iconBorder: "border-rose-300 dark:border-rose-500/40",
    border: "border-rose-200 dark:border-rose-500/30",
    value: "text-rose-600 dark:text-rose-400",
    hover: "hover:bg-rose-500/[0.045] dark:hover:bg-rose-500/[0.08]",
    active:
      "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25",
    activeSoft:
      "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },

  emerald: {
    main: "#10b981",
    dark: "#047857",
    text: "text-emerald-600 dark:text-emerald-400",
    header: "bg-emerald-500/[0.10] dark:bg-emerald-500/[0.12]",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconBorder: "border-emerald-300 dark:border-emerald-500/40",
    border: "border-emerald-200 dark:border-emerald-500/30",
    value: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:bg-emerald-500/[0.045] dark:hover:bg-emerald-500/[0.08]",
    active:
      "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25",
    activeSoft:
      "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },

  orange: {
    main: "#f97316",
    dark: "#c2410c",
    text: "text-orange-600 dark:text-orange-400",
    header: "bg-orange-500/[0.10] dark:bg-orange-500/[0.12]",
    iconBg: "bg-orange-100 dark:bg-orange-500/15",
    iconBorder: "border-orange-300 dark:border-orange-500/40",
    border: "border-orange-200 dark:border-orange-500/30",
    value: "text-orange-600 dark:text-orange-400",
    hover: "hover:bg-orange-500/[0.045] dark:hover:bg-orange-500/[0.08]",
    active:
      "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25",
    activeSoft:
      "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },

  indigo: {
    main: "#6366f1",
    dark: "#4338ca",
    text: "text-indigo-600 dark:text-indigo-400",
    header: "bg-indigo-500/[0.10] dark:bg-indigo-500/[0.12]",
    iconBg: "bg-indigo-100 dark:bg-indigo-500/15",
    iconBorder: "border-indigo-300 dark:border-indigo-500/40",
    border: "border-indigo-200 dark:border-indigo-500/30",
    value: "text-indigo-600 dark:text-indigo-400",
    hover: "hover:bg-indigo-500/[0.045] dark:hover:bg-indigo-500/[0.08]",
    active:
      "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25",
    activeSoft:
      "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
    dot: "bg-indigo-500",
  },

  slate: {
    main: "#64748b",
    dark: "#334155",
    text: "text-slate-600 dark:text-slate-300",
    header: "bg-slate-500/[0.08] dark:bg-slate-500/[0.12]",
    iconBg: "bg-slate-100 dark:bg-slate-700/50",
    iconBorder: "border-slate-300 dark:border-slate-600",
    border: "border-slate-200 dark:border-slate-700",
    value: "text-slate-700 dark:text-slate-200",
    hover: "hover:bg-slate-500/[0.04] dark:hover:bg-slate-500/[0.07]",
    active:
      "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-500/20",
    activeSoft:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600",
    dot: "bg-slate-500",
  },
};

/* ============================================================
   SECTION ICONS
   ============================================================ */

const SECTION_ICONS = {
  countries: Flag,
  cities: MapPin,
  isps: Building2,
  protocols: Network,
  internal: ShieldCheck,
  external: Globe2,
  dns: Server,
  ports: HardDrive,
  urls: Link2,
  ftp: FileArchive,
  files: FileArchive,
  agents: Users,
};

/* ============================================================
   PAGINATED TABLE
   ============================================================ */

const PaginatedTable = ({
  data,
  headers,
  renderRow,
  title,
  scrollable = false,
  searchable = false,
  searchPlaceholder = "Search...",
  searchPredicate,
  headerExtra,
  accent = "slate",
  sectionKey = null,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");

  const theme = ACCENTS[accent] || ACCENTS.slate;

  const Icon = SECTION_ICONS[sectionKey] || null;

  const filteredData =
    searchable && searchQuery.trim()
      ? data.filter((item) =>
          searchPredicate(item, searchQuery.trim().toLowerCase()),
        )
      : data;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedData = scrollable
    ? filteredData
    : filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const pages = Array.from(
    {
      length: Math.min(5, totalPages),
    },
    (_, i) => {
      if (totalPages <= 5) {
        return i + 1;
      }

      if (currentPage <= 3) {
        return i + 1;
      }

      if (currentPage >= totalPages - 2) {
        return totalPages - 4 + i;
      }

      return currentPage - 2 + i;
    },
  );

  return (
    <div className="flex flex-col h-full group bg-card border border-slate-200/80 dark:border-slate-700/70 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* ======================================================
          CARD HEADER
          ====================================================== */}

      <div
        className={`flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200/80 dark:border-slate-700/60 ${theme.header} flex-wrap`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Section icon */}
          {Icon && (
            <div
              className={`w-9 h-9 rounded-lg ${theme.iconBg} ${theme.iconBorder} border flex items-center justify-center shrink-0`}
            >
              <Icon
                size={17}
                strokeWidth={2.2}
                style={{
                  color: theme.main,
                }}
              />
            </div>
          )}

          <h3 className="font-semibold text-[15px] text-foreground tracking-tight">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {headerExtra}

          {/* Search */}
          {searchable && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-56 pl-9 pr-3 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all"
              />
            </div>
          )}

          {/* Strong total badge */}
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-sm"
            style={{
              backgroundColor: theme.main,
              boxShadow: `0 4px 12px ${theme.main}30`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />

            <span className="text-xs font-bold text-white">
              {filteredData.length}
            </span>

            <span className="text-[11px] font-semibold text-white/90">
              Total
            </span>
          </span>
        </div>
      </div>

      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="flex-1 flex flex-col">
        <div
          className={
            scrollable
              ? "overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar"
              : "overflow-visible"
          }
        >
          <table className="w-full text-left">
            <thead
              className={`bg-slate-50/80 dark:bg-slate-900/30 ${
                scrollable ? "sticky top-0 z-10 bg-card" : ""
              }`}
            >
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className={`px-8 py-4 text-[13px] font-semibold text-slate-700 dark:text-slate-300 tracking-[0.01em] ${
                      h.className || ""
                    }`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-t border-slate-100 dark:border-slate-800/70 ${theme.hover} transition-colors duration-200`}
                  >
                    {renderRow(item, idx, startIndex + idx)}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-8 py-20 text-center text-sm text-slate-400"
                  >
                    {searchable && searchQuery.trim()
                      ? "No matching results"
                      : "No Data Available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            PAGINATION
            ==================================================== */}

        {!scrollable && filteredData.length > 0 && (
          <div className="mt-auto px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Page{" "}
              <span className="text-foreground font-semibold">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-semibold">
                {totalPages}
              </span>
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700 bg-card text-slate-500 rounded-md transition-all hover:border-slate-400 hover:text-foreground disabled:opacity-20"
                >
                  «
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-sm border border-slate-200 dark:border-slate-700 bg-card text-slate-500 rounded-md transition-all hover:border-slate-400 hover:text-foreground disabled:opacity-20"
                >
                  ‹
                </button>

                {pages.map((p) => (
                  <motion.button
                    key={p}
                    type="button"
                    whileHover={{
                      scale: 1.06,
                      y: -1,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center text-[11px] font-semibold transition-all border rounded-md ${
                      currentPage === p
                        ? theme.active
                        : `bg-card text-slate-500 border-slate-200 dark:border-slate-700 ${theme.hover}`
                    }`}
                  >
                    {p}
                  </motion.button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center text-sm border border-slate-200 dark:border-slate-700 bg-card text-slate-500 rounded-md transition-all hover:border-slate-400 hover:text-foreground disabled:opacity-20"
                >
                  ›
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700 bg-card text-slate-500 rounded-md transition-all hover:border-slate-400 hover:text-foreground disabled:opacity-20"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   METRIC TOGGLE
   ============================================================ */

const MetricToggle = ({ value, onChange, id }) => {
  const options = [
    {
      key: "packet_count",
      label: "Packets",
    },
    {
      key: "connections",
      label: "Connections",
    },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 dark:bg-slate-700/60 p-1 border border-slate-200 dark:border-slate-700">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`relative px-3.5 py-1.5 text-[11px] font-semibold rounded-full transition-colors duration-200 cursor-pointer ${
            value === opt.key
              ? "text-white"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          {value === opt.key && (
            <motion.span
              layoutId={`metric-toggle-bg-${id}`}
              className="absolute inset-0 rounded-full bg-slate-700 dark:bg-slate-200 shadow-sm"
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 32,
              }}
            />
          )}

          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

MetricToggle.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string,
};

/* ============================================================
   FILE SIZE
   ============================================================ */

const formatFileSizeMB = (sizeKb) => {
  const num = Number(sizeKb);

  if (sizeKb === null || sizeKb === undefined || isNaN(num)) {
    return "N/A";
  }

  return `${(num / 1024).toFixed(2)} MB`;
};

/* ============================================================
   DNS RECORD TYPES
   ============================================================ */

const recordTypeMeanings = {
  A: {
    num: 1,
    desc: "Connects a domain name to an IPv4 address.",
    category: "Address",
    color: "#06b6d4",
  },

  NS: {
    num: 2,
    desc: "Shows which DNS server manages the domain.",
    category: "Delegation",
    color: "#8b5cf6",
  },

  CNAME: {
    num: 5,
    desc: "Makes one domain name point to another domain.",
    category: "Alias",
    color: "#06b6d4",
  },

  SOA: {
    num: 6,
    desc: "Contains the main information about the DNS zone.",
    category: "Zone",
    color: "#8b5cf6",
  },

  PTR: {
    num: 12,
    desc: "Finds the domain name from an IP address.",
    category: "Reverse",
    color: "#06b6d4",
  },

  MX: {
    num: 15,
    desc: "Shows which mail server receives emails.",
    category: "Mail",
    color: "#f59e0b",
  },

  TXT: {
    num: 16,
    desc: "Stores text like SPF, DKIM, and domain verification.",
    category: "Text",
    color: "#64748b",
  },

  AAAA: {
    num: 28,
    desc: "Connects a domain name to an IPv6 address.",
    category: "Address",
    color: "#10b981",
  },

  SRV: {
    num: 33,
    desc: "Shows the server and port for a service.",
    category: "Service",
    color: "#f59e0b",
  },

  NAPTR: {
    num: 35,
    desc: "Helps find network services like VoIP.",
    category: "Service",
    color: "#f59e0b",
  },

  DS: {
    num: 43,
    desc: "Helps secure DNS using DNSSEC.",
    category: "Security",
    color: "#f43f5e",
  },

  RRSIG: {
    num: 46,
    desc: "Digital signature that protects DNS records.",
    category: "Security",
    color: "#f43f5e",
  },

  NSEC: {
    num: 47,
    desc: "Proves that a DNS record does not exist.",
    category: "Security",
    color: "#f43f5e",
  },

  DNSKEY: {
    num: 48,
    desc: "Stores the public key used by DNSSEC.",
    category: "Security",
    color: "#f43f5e",
  },

  NSEC3: {
    num: 50,
    desc: "Securely proves missing DNS records.",
    category: "Security",
    color: "#f43f5e",
  },

  SVCB: {
    num: 64,
    desc: "Provides connection details for services.",
    category: "Service",
    color: "#f59e0b",
  },

  HTTPS: {
    num: 65,
    desc: "Provides connection details for HTTPS websites.",
    category: "Service",
    color: "#f59e0b",
  },

  CAA: {
    num: 257,
    desc: "Controls who can issue SSL certificates.",
    category: "Security",
    color: "#f43f5e",
  },

  ANY: {
    num: 255,
    desc: "Requests all DNS records for a domain.",
    category: "Query",
    color: "#64748b",
  },
};

/* ============================================================
   DNS RECORD BADGE
   ============================================================ */

const RecordTypeBadge = ({ recordType, index }) => {
  const [open, setOpen] = useState(false);

  const rt = String(recordType || "").toUpperCase();

  const rec = recordTypeMeanings[rt];

  const accent = rec?.color || "#64748b";

  const tooltipId = `rt-meaning-${index}`;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        tabIndex={0}
        aria-describedby={tooltipId}
        className="px-2.5 py-1 text-[12px] font-bold rounded-md border cursor-help outline-none focus:ring-2 focus:ring-offset-1"
        style={{
          color: accent,
          backgroundColor: `${accent}15`,
          borderColor: `${accent}45`,
        }}
      >
        {recordType}
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={`absolute z-[100] top-1/2 -translate-y-1/2 right-full mr-3 w-72 origin-right rounded-xl border shadow-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 ${
          open
            ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-x-2 scale-95 pointer-events-none"
        }`}
      >
        <span className="absolute top-1/2 -right-[7px] -translate-y-1/2 w-3 h-3 rotate-45 bg-white dark:bg-slate-800 border-r border-t border-slate-200 dark:border-slate-700" />
        <div className="relative px-4 py-3">
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span
              className="text-[13px] font-bold"
              style={{
                color: accent,
              }}
            >
              {rt || "Unknown"}
            </span>

            {rec?.num !== undefined && (
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                - Type {rec.num}
              </span>
            )}
          </div>

          <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
            {rec?.desc || "No description available for this record type."}
          </p>
        </div>
      </div>
    </div>
  );
};

RecordTypeBadge.propTypes = {
  recordType: PropTypes.string,
  index: PropTypes.number,
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function PcapInsights({ data, onIpClick }) {
  const [internalMetric, setInternalMetric] = useState("packet_count");

  const [externalMetric, setExternalMetric] = useState("packet_count");

  if (!data || !data.pcap_insights) {
    return (
      <div className="p-4 text-slate-500">No insights data available.</div>
    );
  }

  const {
    dns_queries = [],
    external_ips = [],
    files_and_payloads = [],
    internal_ips = [],
    ports = [],
    protocols = [],
    urls = [],
    user_agents = [],
    ftp_session = null,
    top_countries = [],
    top_cities = [],
    top_isps = [],
  } = data.pcap_insights;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-10">
      {/* ======================================================
          IMPORTANT:
          No mx-4/md:mx-8/lg:mx-12 here.

          PcapClientView already places this content inside
          px-6 pt-2, which gives the same horizontal spacing
          as Pcap Summary.
          ====================================================== */}

      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ==================================================
              TOP COUNTRIES
              ================================================== */}

          <PaginatedTable
            data={top_countries}
            title="Top Countries"
            scrollable
            accent="amber"
            sectionKey="countries"
            headers={[
              {
                label: "S.NO",
              },
              {
                label: "Country",
              },
              {
                label: "IPs",
                className: "text-center",
              },
              {
                label: "Packets",
              },
            ]}
            renderRow={(c, idx, globalIdx) => (
              <>
                <td className="px-8 py-4 text-slate-400 dark:text-slate-500 text-sm">
                  {globalIdx + 1}
                </td>

                <td
                  className="px-8 py-4 text-foreground max-w-[220px] truncate text-[14px]"
                  title={c.name}
                >
                  {c.name}
                </td>

                <td className="px-8 py-4 text-center">
                  <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                    {c.ip_count}
                  </span>
                </td>

                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-amber-600 dark:text-amber-400">
                    {c.packets?.toLocaleString()}
                  </span>
                </td>
              </>
            )}
          />

          {/* ==================================================
              TOP CITIES
              ================================================== */}

          <PaginatedTable
            data={top_cities}
            title="Top Cities"
            scrollable
            accent="cyan"
            sectionKey="cities"
            headers={[
              {
                label: "S.NO",
              },
              {
                label: "City",
              },
              {
                label: "IPs",
                className: "text-center",
              },
              {
                label: "Packets",
              },
            ]}
            renderRow={(c, idx, globalIdx) => (
              <>
                <td className="px-8 py-4 text-slate-400 dark:text-slate-500 text-sm">
                  {globalIdx + 1}
                </td>

                <td
                  className="px-8 py-4 text-foreground max-w-[220px] truncate text-[14px]"
                  title={c.name}
                >
                  {c.name}
                </td>

                <td className="px-8 py-4 text-center">
                  <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                    {c.ip_count}
                  </span>
                </td>

                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-cyan-600 dark:text-cyan-400">
                    {c.packets?.toLocaleString()}
                  </span>
                </td>
              </>
            )}
          />
        </div>

        {/* ======================================================
            ISPs / PROTOCOLS
            ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <PaginatedTable
            data={top_isps}
            title="Top ISPs"
            scrollable
            accent="violet"
            sectionKey="isps"
            headers={[
              {
                label: "S.NO",
              },
              {
                label: "ISP",
              },
              {
                label: "IPs",
                className: "text-center",
              },
              {
                label: "Packets",
              },
            ]}
            renderRow={(c, idx, globalIdx) => (
              <>
                <td className="px-8 py-4 text-slate-400 dark:text-slate-500 text-sm">
                  {globalIdx + 1}
                </td>

                <td
                  className="px-8 py-4 text-foreground max-w-[220px] truncate text-[14px]"
                  title={c.name}
                >
                  {c.name}
                </td>

                <td className="px-8 py-4 text-center">
                  <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                    {c.ip_count}
                  </span>
                </td>

                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-violet-600 dark:text-violet-400">
                    {c.packets?.toLocaleString()}
                  </span>
                </td>
              </>
            )}
          />

          <PaginatedTable
            data={protocols}
            title="Protocols"
            accent="rose"
            sectionKey="protocols"
            headers={[
              {
                label: "Protocol",
              },
              {
                label: "Packets",
              },
            ]}
            renderRow={(proto) => (
              <>
                <td className="px-8 py-4 text-foreground text-[14px] font-medium">
                  {proto.protocol}
                </td>

                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-rose-600 dark:text-rose-400">
                    {proto.packet_count?.toLocaleString()}
                  </span>
                </td>
              </>
            )}
          />
        </div>

        {/* ======================================================
            INTERNAL / EXTERNAL IPS
            ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          {/* INTERNAL IPS */}

          <PaginatedTable
            data={internal_ips}
            title="Internal IPs"
            accent="emerald"
            sectionKey="internal"
            headerExtra={
              <MetricToggle
                value={internalMetric}
                onChange={setInternalMetric}
                id="internal"
              />
            }
            headers={[
              {
                label: "IP Address",
                className: "w-[400px]",
              },
              {
                label: "Count",
              },
            ]}
            renderRow={(ip) => (
              <>
                <td
                  className="px-8 py-4 text-foreground cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-[14px] font-medium"
                  onClick={() => onIpClick && onIpClick(ip.ip)}
                >
                  {ip.ip}
                </td>

                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                    {(internalMetric === "connections"
                      ? ip.connections
                      : ip.packet_count
                    )?.toLocaleString() ?? "N/A"}
                  </span>
                </td>
              </>
            )}
          />

          {/* EXTERNAL IPS */}

          <PaginatedTable
            data={external_ips}
            title="External IPs"
            accent="orange"
            sectionKey="external"
            headerExtra={
              <MetricToggle
                value={externalMetric}
                onChange={setExternalMetric}
                id="external"
              />
            }
            headers={[
              {
                label: "IP Address",
              },
              {
                label: "ISP",
              },
              {
                label: "Count",
              },
            ]}
            renderRow={(ip) => (
              <>
                <td
                  className="px-8 py-4 text-foreground cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-[14px] font-medium"
                  onClick={() => onIpClick && onIpClick(ip.ip)}
                >
                  {ip.ip}
                </td>

                <td className="px-8 py-4 text-[14px] text-slate-600 dark:text-slate-300">
                  {ip.isp || "Unknown"}
                </td>

                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-orange-600 dark:text-orange-400">
                    {(externalMetric === "connections"
                      ? ip.connections
                      : ip.packet_count
                    )?.toLocaleString() ?? "N/A"}
                  </span>
                </td>
              </>
            )}
          />
        </div>

        {/* ======================================================
            DNS / PORTS
            ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <PaginatedTable
            data={dns_queries}
            title="DNS Queries"
            accent="indigo"
            sectionKey="dns"
            headers={[
              {
                label: "Domain",
              },
              {
                label: "Type",
                className: "text-center",
              },
              {
                label: "Count",
              },
            ]}
            renderRow={(dns, idx, globalIdx) => (
              <>
                <td
                  className="px-8 py-4 text-foreground max-w-[310px] truncate text-[14px]"
                  title={dns.domain}
                >
                  {dns.domain}
                </td>

                <td className="px-8 py-4 text-center">
                  <RecordTypeBadge
                    recordType={dns.record_type}
                    index={globalIdx}
                  />
                </td>

                <td className="px-8 py-4 text-[14px] font-semibold text-slate-700 dark:text-slate-300">
                  {dns.count}
                </td>
              </>
            )}
          />

          <PaginatedTable
            data={ports}
            title="Network Ports"
            accent="amber"
            sectionKey="ports"
            searchable
            searchPlaceholder="Search by port or protocol"
            searchPredicate={(p, q) =>
              String(p.port).toLowerCase().includes(q) ||
              String(p.protocol).toLowerCase().includes(q)
            }
            headers={[
              {
                label: "Port",
              },
              {
                label: "Protocol",
              },
              {
                label: "Usage",
              },
            ]}
            renderRow={(p) => (
              <>
                <td className="px-8 py-4">
                  <span className="text-[14px] font-bold text-amber-600 dark:text-amber-400">
                    {p.port}
                  </span>
                </td>

                <td className="px-8 py-4 text-[14px] text-slate-700 dark:text-slate-300">
                  {p.protocol}
                </td>

                <td className="px-8 py-4 text-[14px] font-semibold text-foreground">
                  {p.usage?.toLocaleString()}
                </td>
              </>
            )}
          />
        </div>

        {/* ======================================================
            URLS / FTP
            ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          {/* URLS */}

          <PaginatedTable
            data={urls}
            title="URLs"
            accent="cyan"
            sectionKey="urls"
            headers={[
              {
                label: "Resource URL / Path",
                className: "w-[600px]",
              },
              {
                label: "Hits",
              },
            ]}
            renderRow={(url) => (
              <>
                <td
                  className="px-8 py-4 max-w-xl truncate text-[14px] text-foreground"
                  title={url.label}
                >
                  {url.label}
                </td>

                <td className="px-8 py-4 text-[14px] font-bold text-cyan-600 dark:text-cyan-400">
                  {url.value}
                </td>
              </>
            )}
          />

          {/* FTP */}

          <div className="bg-card border border-slate-200/80 dark:border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-500/[0.08] dark:bg-slate-500/[0.12] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                <FileArchive
                  size={17}
                  className="text-slate-600 dark:text-slate-300"
                />
              </div>

              <h3 className="font-semibold text-[15px] text-foreground">
                FTP Session
              </h3>
            </div>

            <div className="p-6">
              {ftp_session ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      Command
                    </div>

                    <div className="font-semibold text-[17px] text-foreground">
                      {ftp_session.command || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      Username
                    </div>

                    <div className="font-semibold text-[17px] text-foreground">
                      {ftp_session.username || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      Source IP
                    </div>

                    <div className="font-semibold text-[17px] text-foreground">
                      {ftp_session.source_ip || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      Destination IP
                    </div>

                    <div className="font-semibold text-[17px] text-foreground">
                      {ftp_session.destination_ip || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      Port
                    </div>

                    <div className="font-semibold text-[17px] text-foreground">
                      {ftp_session.port || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      Transferred File
                    </div>

                    <div className="font-semibold text-[17px] text-foreground truncate">
                      {ftp_session.file_transferred || "N/A"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <FileArchive size={18} className="text-slate-500" />
                  </div>

                  <span className="text-sm">No data available.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================
            EXTRACTED FILES
            ====================================================== */}

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <PaginatedTable
            data={files_and_payloads}
            title="Extracted Files"
            accent="emerald"
            sectionKey="files"
            headers={[
              {
                label: "Filename",
              },
              {
                label: "MIME Type",
              },
              {
                label: "Protocol",
                className: "text-center",
              },
              {
                label: "Size (MB)",
              },
            ]}
            renderRow={(file) => (
              <>
                <td
                  className="px-8 py-4 text-foreground max-w-[550px] truncate text-[14px]"
                  title={file.filename}
                >
                  {file.filename}
                </td>

                <td className="px-8 py-4 text-[14px] text-slate-600 dark:text-slate-300">
                  {file.type}
                </td>

                <td className="px-8 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/25 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

                    {file.protocol}
                  </span>
                </td>

                <td className="px-8 py-4 text-[14px] font-semibold text-foreground">
                  {formatFileSizeMB(file.file_size)}
                </td>
              </>
            )}
          />
        </div>

        {/* ======================================================
            USER AGENTS
            ====================================================== */}

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-card border border-slate-200/80 dark:border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-violet-500/[0.10] dark:bg-violet-500/[0.12]">
              <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-500/15 border border-violet-300 dark:border-violet-500/40 flex items-center justify-center">
                <Users
                  size={17}
                  className="text-violet-600 dark:text-violet-400"
                />
              </div>

              <h3 className="font-semibold text-[15px] text-foreground">
                User Agents
              </h3>
            </div>

            <div className="flex flex-col gap-3 p-6 max-h-[350px] overflow-y-auto custom-scrollbar">
              {user_agents.length > 0 ? (
                user_agents.map((ua, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-xl shadow-sm hover:border-violet-400 dark:hover:border-violet-500/40 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="text-violet-600 dark:text-violet-400 mb-1.5 flex items-center gap-2 text-[12px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_7px_rgba(139,92,246,0.7)]" />
                      Agent {idx + 1}
                    </div>

                    <div className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 break-all line-clamp-2 group-hover:line-clamp-none transition-all">
                      {ua.user_agent}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-slate-400">
                  No data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROP TYPES
   ============================================================ */

PaginatedTable.propTypes = {
  data: PropTypes.array,
  headers: PropTypes.array,
  renderRow: PropTypes.func,
  title: PropTypes.string,
  scrollable: PropTypes.bool,
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  searchPredicate: PropTypes.func,
  headerExtra: PropTypes.node,
  accent: PropTypes.string,
  sectionKey: PropTypes.string,
};

PcapInsights.propTypes = {
  data: PropTypes.shape({
    pcap_insights: PropTypes.object,
  }),
  onIpClick: PropTypes.func,
};
