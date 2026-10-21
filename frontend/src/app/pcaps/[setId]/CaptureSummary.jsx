import { useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  Copy,
  CheckCircle2,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import { formatBytes, formatDuration } from "./PcapClientView";
import {
  downloadPcapConnectionsExport,
  fetchPcapConnections,
} from "./apiService";
import { IPSearch } from "@/app/dashboard/IPSearch";

function KpiCard({
  title,
  value,
  colorClass = "text-foreground",
  titleClass = "text-[16px]",
  valueClass = "text-[15px]",
  color = null,
}) {
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
    purple: "#7c3aed",
    teal: "#0ea5a4",
  };

  const borderColor = (c) => BORDER_COLORS[c] || BORDER_COLORS.slate;

  return (
    <div
      className="bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden min-h-[100px]"
      style={
        color
          ? {
              border: `1.5px solid ${borderColor(color)}40`,
            }
          : {}
      }
    >
      <div className="flex items-center gap-4">
        <div>
          <p
            className={`${titleClass} font-semibold text-slate-800 dark:text-slate-100 mb-2`}
          >
            {title}
          </p>

          <h3
            className={`${valueClass} text-black dark:text-slate-400 tabular-nums ${colorClass}`}
          >
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.node,
  colorClass: PropTypes.string,
};

KpiCard.propTypes.titleClass = PropTypes.string;
KpiCard.propTypes.valueClass = PropTypes.string;
KpiCard.propTypes.color = PropTypes.string;

export default function CaptureSummary({
  overviewData,
  connectionsData,
  timelineData,
  connectionsPagination,
  connectionsPage,
  setConnectionsPage,
  timeFilter,
  setTimeFilter,
  isLoadingConnections,
  onIpClick,
  pcapId,
  onTimelineClick,
}) {
  const [isExportingConnections, setIsExportingConnections] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [exportStatus, setExportStatus] = useState("");

  const [isPasswordCopied, setIsPasswordCopied] = useState(false);

  const [showFullConnections, setShowFullConnections] = useState(false);

  const fullConnRef = useRef(null);

  const [modalConnections, setModalConnections] = useState(null);

  const [isLoadingModalConnections, setIsLoadingModalConnections] =
    useState(false);

  // When modal opens or page/timeFilter changes,
  // load that page of connections
  useEffect(() => {
    let mounted = true;

    const loadModalPage = async () => {
      if (!showFullConnections || !pcapId) return;

      setIsLoadingModalConnections(true);

      try {
        const resp = await fetchPcapConnections(
          pcapId,
          connectionsPage || 1,
          timeFilter,
        );

        let raw = resp.data || resp.connections || resp;

        if (raw && !Array.isArray(raw) && typeof raw === "object") {
          raw = raw.connections || raw.data || raw.results || [];
        }

        if (mounted) {
          setModalConnections(Array.isArray(raw) ? raw : []);
        }
      } catch (e) {
        console.error("Failed to load modal connections", e);

        if (mounted) {
          setModalConnections([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingModalConnections(false);
        }

        if (fullConnRef.current) {
          fullConnRef.current.scrollTop = 0;
        }
      }
    };

    loadModalPage();

    return () => {
      mounted = false;
    };
  }, [showFullConnections, connectionsPage, timeFilter, pcapId]);

  useEffect(() => {
    if (showFullConnections && fullConnRef.current) {
      fullConnRef.current.scrollTop = 0;
    }
  }, [showFullConnections]);

  if (!overviewData || !overviewData.capture_summary) {
    return <div className="p-4 text-slate-500">Loading capture summary...</div>;
  }

  const {
    bytes: total_bytes,
    connections: total_connections,
    duration_seconds,
    end_time_utc,
    file_name,
    file_size,
    ftp_sessions_count,
    infected_host,
    pcap_packets: total_packets,
    start_time_utc,
    internal_ip_count,
    external_ip_count,
  } = overviewData.capture_summary;

  const parseLabelToDate = (time) => {
    if (time === undefined || time === null || time === "") {
      return null;
    }

    if (typeof time === "number") {
      return new Date(time * 1000);
    }

    if (typeof time === "string") {
      const trimmed = time.trim();

      if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
        return new Date(Number(trimmed) * 1000);
      }

      const normalized = trimmed.replace(" ", "T");

      const parsed = new Date(normalized);

      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  };

  const formatTime = (time) => {
    try {
      if (!time) return "-";

      const date = parseLabelToDate(time);

      if (!date) return String(time);

      return date.toLocaleTimeString([], {
        hour12: false,
      });
    } catch {
      return String(time);
    }
  };

  const formatTimestamp = (time) => {
    try {
      if (!time) return "-";

      const date = parseLabelToDate(time);

      if (!date) return String(time);

      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour12: false,
      })}`;
    } catch {
      return String(time);
    }
  };

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return "0s";

    return `${Number(sec).toFixed(2)}s`;
  };

  const session_timeline = (timelineData || []).map((item) => {
    const date = parseLabelToDate(item.label);

    return {
      label: date ? date.getTime() : item.label,
      value: item.value,
      rawLabel: item.label,
    };
  });

  const exportPassword = pcapId ? `sta#@${pcapId}` : "admin1@pcapid";

  const handleCopyPassword = async () => {
    const passwordText = String(exportPassword);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(passwordText);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = passwordText;
        textarea.setAttribute("readonly", "");

        textarea.style.position = "absolute";

        textarea.style.left = "-9999px";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      setIsPasswordCopied(true);

      setTimeout(() => setIsPasswordCopied(false), 1600);
    } catch {
      setExportStatus("Clipboard access was unavailable.");
    }
  };

  const handleStartDownload = async () => {
    if (!pcapId) return;

    setShowPasswordModal(false);

    setExportStatus("Preparing secure ZIP export...");

    setIsExportingConnections(true);

    try {
      const { blob, filename } = await downloadPcapConnectionsExport(pcapId);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading connection export:", error);

      setExportStatus("Download failed. Please try again.");
    } finally {
      setIsExportingConnections(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 px-1">
      {/* =====================================================
          CAPTURE SUMMARY
          ===================================================== */}
      <div className="bg-card shadow-sm border border-theme rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-sans font-semibold text-foreground">
              Capture Summary
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <KpiCard
            title="Total Packets"
            value={total_packets?.toLocaleString() || "0"}
            colorClass="text-blue-600"
            color="blue"
          />

          <KpiCard
            title="Total Bytes"
            value={total_bytes ? formatBytes(total_bytes) : "0 B"}
            colorClass="text-emerald-600"
            color="emerald"
          />

          <KpiCard
            title="Total Duration"
            value={duration_seconds ? formatDuration(duration_seconds) : "0s"}
            colorClass="text-amber-600"
            color="amber"
          />

          <KpiCard
            title="Start Time"
            value={
              start_time_utc ? (
                <div className="flex flex-col leading-none gap-1">
                  <span className="font-sans tracking-tight">
                    {start_time_utc.split("T")[0]},{" "}
                    {start_time_utc.split("T")[1]?.split(/[.+Z]/)[0]}
                  </span>
                </div>
              ) : (
                "-"
              )
            }
            colorClass="text-blue-600"
            color="blue"
          />

          <KpiCard
            title="End Time"
            value={
              end_time_utc ? (
                <div className="flex flex-col leading-none gap-1">
                  <span className="font-sans tracking-tight">
                    {end_time_utc.split("T")[0]},{" "}
                    {end_time_utc.split("T")[1]?.split(/[.+Z]/)[0]}
                  </span>
                </div>
              ) : (
                "-"
              )
            }
            colorClass="text-emerald-600"
            color="emerald"
          />

          <KpiCard
            title="Connections"
            value={total_connections?.toLocaleString() || "0"}
            colorClass="text-violet-600"
            color="violet"
          />

          <KpiCard
            title="Internal IPs"
            value={internal_ip_count || "0"}
            colorClass="text-teal-600"
            color="teal"
          />

          <KpiCard
            title="External IPs"
            value={external_ip_count || "0"}
            colorClass="text-indigo-600"
            color="indigo"
          />

          <KpiCard
            title="Affected Host"
            value={infected_host || "None"}
            colorClass="text-rose-600"
            color="rose"
          />

          <KpiCard
            title="FTP Sessions"
            value={
              ftp_sessions_count === 0
                ? "NA"
                : ftp_sessions_count?.toLocaleString() || "NA"
            }
            colorClass="text-fuchsia-600"
            color="amber"
          />
        </div>
      </div>

      {/* =====================================================
          PCAP SESSION TIMELINE
          ===================================================== */}
      <div className="bg-card shadow-sm border border-theme rounded-xl p-8 h-96 flex flex-col transition-colors">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <h3 className="font-sans font-semibold text-foreground">
              PCAP Session Timeline
            </h3>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={session_timeline || []}
              margin={{
                top: 20,
                right: 30,
                left: 60,
                bottom: 50,
              }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />

                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                strokeDasharray="3 3"
                className="text-slate-200 dark:text-slate-800"
              />

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 12,
                  fill: "currentColor",
                  fontFamily: "sans-serif",
                }}
                className="text-slate-500 dark:text-slate-400"
                axisLine={{
                  stroke: "currentColor",
                }}
                tickLine={false}
                domain={["dataMin", "dataMax"]}
                type="number"
                scale="time"
                tickFormatter={(value) => {
                  const date = new Date(value);

                  return date.toLocaleTimeString([], {
                    hour12: false,
                  });
                }}
                label={{
                  value: "Time (24H Format)",
                  position: "insideBottom",
                  offset: -30,
                  fontSize: 15,
                  fill: "currentColor",
                }}
              />

              <YAxis
                tick={{
                  fontSize: 12,
                  fill: "currentColor",
                  fontFamily: "sans-serif",
                }}
                className="text-slate-500 dark:text-slate-400"
                axisLine={{
                  stroke: "currentColor",
                }}
                tickLine={false}
                label={{
                  value: "Packets",
                  angle: -90,
                  position: "center",
                  fontSize: 15,
                  fill: "currentColor",
                  dx: -45,
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "0",
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: "black",
                  textTransform: "uppercase",
                  fontSize: "10px",
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);

                  return date.toLocaleString([], {
                    hour12: false,
                  });
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={1500}
                onClick={(payload, index) => {
                  try {
                    const item = timelineData?.[index];

                    if (item && onTimelineClick) {
                      const d = parseLabelToDate(item.label);

                      if (d) {
                        const ymd = d.toISOString().slice(0, 10);

                        onTimelineClick(ymd, ymd);
                      }
                    }
                  } catch (e) {}
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =====================================================
          CONNECTIONS TABLE
          ===================================================== */}
      <div className="bg-card shadow-sm border border-theme rounded-xl overflow-hidden flex flex-col transition-colors">
        <div className="px-8 py-5 border-b border-theme bg-slate-500/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/8 border border-emerald-500/20 rounded-none">
              <span className="font-sans font-semibold text-emerald-700">
                PCAP Connection Logs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-sans">Time Filter:</span>

              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);

                  setConnectionsPage(1);
                }}
                className="h-[42px] bg-card border border-theme rounded-md px-4 font-sans text-foreground outline-none focus:border-blue-600 transition-all cursor-pointer appearance-none hover:bg-slate-500/5"
              >
                <option value="" className="bg-card">
                  All Temporal Records
                </option>

                <option value="1d" className="bg-card">
                  Last 24 Hours
                </option>

                <option value="2d" className="bg-card">
                  Last 48 Hours
                </option>

                <option value="7d" className="bg-card">
                  Last 7 Days
                </option>

                <option value="30d" className="bg-card">
                  Last 30 Days
                </option>
              </select>
            </div>

            {connectionsPagination &&
              (() => {
                const total = connectionsPagination.total || 0;

                const tp =
                  connectionsPagination.total_pages || Math.ceil(total / 100);

                return (
                  <div className="h-[42px] flex items-center px-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-100 rounded-md font-sans text-blue-600">
                    {total} Records Total
                  </div>
                );
              })()}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                disabled={isExportingConnections || !pcapId}
                className="h-[42px] inline-flex items-center gap-2 px-4 border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-[12px] font-bold tracking-[0.15em] rounded-sm"
              >
                {isExportingConnections ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}

                {isExportingConnections ? "Preparing Export..." : "Export CSV"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFullConnections(true);
                }}
                className="h-[42px] w-10 inline-flex items-center justify-center rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                title="View all connections"
                aria-label="Open full connections modal"
              >
                <Maximize2 size={16} />
              </button>

              {exportStatus ? (
                <div
                  className={`flex items-center gap-2 text-[12px] font-semibold ${
                    isExportingConnections
                      ? "text-blue-600"
                      : "text-emerald-600"
                  }`}
                >
                  {isExportingConnections ? (
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-blue-100">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" />
                    </div>
                  ) : (
                    <CheckCircle2 size={14} />
                  )}

                  <span>{exportStatus}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {isLoadingConnections && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex flex-col p-8 space-y-4">
              {Array.from({
                length: 10,
              }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full bg-slate-200/50 animate-pulse rounded-none border border-slate-300/20"
                />
              ))}
            </div>
          )}

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-theme bg-slate-500/5 transition-colors">
                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Timestamp
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Source IP
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Dest IP
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Duration
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Port
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Protocol
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Service
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Status
                </th>

                <th className="px-8 py-4 font-sans font-semibold dark:text-slate-300 text-left">
                  Bytes
                </th>
              </tr>
            </thead>

            <tbody>
              {(connectionsData || []).slice(0, 15).map((conn, idx) => {
                const stateDesc = conn.conn_state_desc || conn.status;

                const stateCode = conn.conn_state;

                const isEstablished = stateCode === "SF";

                const isRefused = stateCode === "REJ" || stateCode === "RSTOS0";

                const isPending = stateCode === "S0" || stateCode === "S1";

                return (
                  <tr
                    key={idx}
                    className="hover:bg-blue-500/[0.04] transition-colors group border-b border-theme last:border-0"
                  >
                    <td className="px-8 py-3.5 whitespace-nowrap">
                      <span className="font-sans dark:text-slate-400 tabular-nums">
                        {formatTimestamp(conn.timestamp || conn.ts)}
                      </span>
                    </td>

                    <td className="px-8 py-3.5">
                      <button
                        type="button"
                        className="font-sans text-foreground cursor-pointer hover:text-blue-600 transition-colors bg-transparent border-none p-0"
                        onClick={() =>
                          onIpClick &&
                          onIpClick(
                            conn.src_ip || conn["id.orig_h"] || conn.source_ip,
                          )
                        }
                      >
                        {conn.src_ip || conn["id.orig_h"] || conn.source_ip}
                      </button>
                    </td>

                    <td className="px-8 py-3.5">
                      <button
                        type="button"
                        className="font-sans text-foreground cursor-pointer hover:text-blue-600 transition-colors bg-transparent border-none p-0"
                        onClick={() =>
                          onIpClick &&
                          onIpClick(
                            conn.dest_ip ||
                              conn["id.resp_h"] ||
                              conn.destination_ip,
                          )
                        }
                      >
                        {conn.dest_ip ||
                          conn["id.resp_h"] ||
                          conn.destination_ip}
                      </button>
                    </td>

                    <td className="px-8 py-3.5">
                      <span className="font-sans dark:text-slate-400">
                        {formatDuration(
                          conn.duration || conn["id.duration"] || 0,
                        )}
                      </span>
                    </td>

                    <td className="px-8 py-3.5">
                      <span className="font-sans text-orange-500">
                        {conn.resp_port ||
                          conn["id.resp_p"] ||
                          conn.dest_port ||
                          conn.destination_port}
                      </span>
                    </td>

                    <td className="px-8 py-3.5">
                      <span className="font-sans dark:text-slate-400 uppercase">
                        {conn.proto || conn.protocol}
                      </span>
                    </td>

                    <td className="px-8 py-3.5">
                      {conn.service ? (
                        <span className="font-sans text-purple-600 dark:text-purple-400 uppercase bg-purple-500/10 px-2.5 py-1 rounded-none border border-purple-500/20 inline-block">
                          {conn.service}
                        </span>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-300 dark:text-slate-600">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-8 py-3.5">
                      <span
                        className={`font-sans leading-snug ${
                          isEstablished
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isRefused
                              ? "text-rose-600 dark:text-rose-400"
                              : isPending
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-500 dark:text-slate-400"
                        }`}
                        title={stateDesc}
                      >
                        {stateDesc || "—"}
                      </span>
                    </td>

                    <td className="px-8 py-3.5 text-left">
                      <span className="font-sans text-foreground">
                        {formatBytes(conn.orig_bytes ?? conn.bytes ?? 0)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        {connectionsPagination &&
          (() => {
            const total = connectionsPagination.total || 0;

            const tp =
              connectionsPagination.total_pages || Math.ceil(total / 100);

            if (tp <= 1 && total <= connectionsData?.length) {
              return null;
            }

            return (
              <div className="px-8 py-4 border-t border-theme bg-slate-500/[0.02] flex items-center justify-between">
                <span className="font-sans">
                  Page{" "}
                  <span className="text-foreground">{connectionsPage}</span> of{" "}
                  <span className="text-foreground">{tp}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setConnectionsPage(1)}
                    disabled={connectionsPage === 1 || isLoadingConnections}
                    className="w-8 h-8 flex items-center justify-center font-sans hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                  >
                    «
                  </button>

                  <button
                    onClick={() =>
                      setConnectionsPage((p) => Math.max(1, p - 1))
                    }
                    disabled={connectionsPage === 1 || isLoadingConnections}
                    className="w-8 h-8 flex items-center justify-center font-sans hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({
                    length: Math.min(5, tp),
                  }).map((_, i) => {
                    let pageNum;

                    if (tp <= 5) {
                      pageNum = i + 1;
                    } else if (connectionsPage <= 3) {
                      pageNum = i + 1;
                    } else if (connectionsPage >= tp - 2) {
                      pageNum = tp - 4 + i;
                    } else {
                      pageNum = connectionsPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setConnectionsPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center font-sans transition-all border ${
                          connectionsPage === pageNum
                            ? "bg-blue-600/10 text-blue-600 border-blue-600/50 shadow-lg shadow-blue-500/5"
                            : "text-slate-500 border-theme hover:border-blue-500/30 hover:bg-slate-500/10 bg-card"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setConnectionsPage((p) => Math.min(tp, p + 1))
                    }
                    disabled={connectionsPage === tp || isLoadingConnections}
                    className="w-8 h-8 flex items-center justify-center font-sans hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                  >
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => setConnectionsPage(tp)}
                    disabled={connectionsPage === tp || isLoadingConnections}
                    className="w-8 h-8 flex items-center justify-center font-sans hover:text-blue-600 disabled:opacity-20 transition-all border border-theme bg-card"
                  >
                    »
                  </button>
                </div>
              </div>
            );
          })()}
      </div>

      {/* =====================================================
          PASSWORD MODAL
          ===================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Lock size={20} />
              </div>

              <div>
                <h4 className="font-serif font-bold text-lg dark:text-slate-100">
                  Secure ZIP Password
                </h4>

                <p className="mt-1 font-serif dark:text-slate-200">
                  This export is password protected. Use the password below to
                  open the archive.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="mb-2 font-normal dark:text-slate-400">
                Password Pattern
              </div>

              <div className="text-sm font-semibold dark:text-slate-200">
                sta# + @ + pcap id
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2.5 dark:border-blue-500/20 dark:bg-slate-900/80">
                <span className="font-mono text-sm font-bold tracking-wide text-slate-800 dark:text-slate-100">
                  {exportPassword}
                </span>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {isPasswordCopied ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Copy size={14} />
                  )}

                  {isPasswordCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
              >
                <Download size={16} />
                Continue Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FULL CONNECTIONS MODAL
          ===================================================== */}
      {showFullConnections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pt-24 pb-6 px-6">
          <div
            ref={fullConnRef}
            className="w-full h-full max-w-7xl bg-card rounded-xl border border-theme shadow-2xl overflow-auto max-h-[calc(100vh-160px)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
              <h3 className="font-sans font-bold text-lg">
                Connections (up to 50)
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullConnections(false)}
                  aria-label="Close connections modal"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-white text-slate-700 shadow-sm hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-theme bg-slate-500/5 transition-colors">
                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Timestamp
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Source IP
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Dest IP
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Duration
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Port
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Protocol
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Service
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Status
                      </th>

                      <th className="px-4 py-3 font-sans font-semibold dark:text-slate-300 text-left">
                        Bytes
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoadingModalConnections ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="font-sans">
                              Loading connections...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (modalConnections ?? connectionsData ?? []).map(
                        (conn, idx) => {
                          const stateDesc = conn.conn_state_desc || conn.status;

                          const stateCode = conn.conn_state;

                          const isEstablished = stateCode === "SF";

                          const isRefused =
                            stateCode === "REJ" || stateCode === "RSTOS0";

                          const isPending =
                            stateCode === "S0" || stateCode === "S1";

                          return (
                            <tr
                              key={idx}
                              className="hover:bg-blue-500/[0.04] transition-colors group border-b border-theme last:border-0"
                            >
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {(() => {
                                  const raw = conn.timestamp || conn.ts;

                                  const d = parseLabelToDate(raw);

                                  const dateStr = d
                                    ? d.toLocaleDateString()
                                    : raw
                                      ? String(raw)
                                      : "-";

                                  const timeStr = d
                                    ? d.toLocaleTimeString([], {
                                        hour12: false,
                                      })
                                    : "";

                                  const combined = timeStr
                                    ? `${dateStr} ${timeStr}`
                                    : dateStr;

                                  return (
                                    <span className="font-sans text-sm text-foreground">
                                      {combined}
                                    </span>
                                  );
                                })()}
                              </td>

                              <td className="px-4 py-3.5">
                                <button
                                  type="button"
                                  className="font-sans text-foreground cursor-pointer hover:text-blue-600 transition-colors bg-transparent border-none p-0"
                                  onClick={() =>
                                    onIpClick &&
                                    onIpClick(
                                      conn.src_ip ||
                                        conn["id.orig_h"] ||
                                        conn.source_ip,
                                    )
                                  }
                                >
                                  {conn.src_ip ||
                                    conn["id.orig_h"] ||
                                    conn.source_ip}
                                </button>
                              </td>

                              <td className="px-4 py-3.5">
                                <button
                                  type="button"
                                  className="font-sans text-foreground cursor-pointer hover:text-blue-600 transition-colors bg-transparent border-none p-0"
                                  onClick={() =>
                                    onIpClick &&
                                    onIpClick(
                                      conn.dest_ip ||
                                        conn["id.resp_h"] ||
                                        conn.destination_ip,
                                    )
                                  }
                                >
                                  {conn.dest_ip ||
                                    conn["id.resp_h"] ||
                                    conn.destination_ip}
                                </button>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="font-sans dark:text-slate-400">
                                  {formatDuration(
                                    conn.duration || conn["id.duration"] || 0,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="font-sans text-orange-500">
                                  {conn.resp_port ||
                                    conn["id.resp_p"] ||
                                    conn.dest_port ||
                                    conn.destination_port}
                                </span>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="font-sans dark:text-slate-400 uppercase">
                                  {conn.proto || conn.protocol}
                                </span>
                              </td>

                              <td className="px-4 py-3.5">
                                {conn.service ? (
                                  <span className="font-sans text-purple-600 dark:text-purple-400 uppercase bg-purple-500/10 px-2.5 py-1 rounded-none border border-purple-500/20 inline-block">
                                    {conn.service}
                                  </span>
                                ) : (
                                  <span className="text-[12px] font-bold text-slate-300 dark:text-slate-600">
                                    —
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5">
                                <span
                                  className={`font-sans leading-snug ${
                                    isEstablished
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : isRefused
                                        ? "text-rose-600 dark:text-rose-400"
                                        : isPending
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-slate-500 dark:text-slate-400"
                                  }`}
                                  title={stateDesc}
                                >
                                  {stateDesc || "—"}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-left">
                                <span className="font-sans text-foreground">
                                  {formatBytes(
                                    conn.orig_bytes ?? conn.bytes ?? 0,
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

CaptureSummary.propTypes = {
  overviewData: PropTypes.shape({
    capture_summary: PropTypes.shape({
      bytes: PropTypes.number,
      connections: PropTypes.number,
      duration_seconds: PropTypes.number,
      end_time_utc: PropTypes.string,
      file_name: PropTypes.string,
      file_size: PropTypes.number,
      ftp_sessions_count: PropTypes.number,
      infected_host: PropTypes.string,
      pcap_packets: PropTypes.number,
      start_time_utc: PropTypes.string,
      internal_ip_count: PropTypes.number,
      external_ip_count: PropTypes.number,
    }),
  }),

  connectionsData: PropTypes.array,

  timelineData: PropTypes.array,

  connectionsPagination: PropTypes.object,

  connectionsPage: PropTypes.number,

  setConnectionsPage: PropTypes.func,

  timeFilter: PropTypes.string,

  setTimeFilter: PropTypes.func,

  isLoadingConnections: PropTypes.bool,

  onIpClick: PropTypes.func,

  pcapId: PropTypes.string,

  onTimelineClick: PropTypes.func,
};
