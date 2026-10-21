"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Shield,
  MapPin,
  Server,
  Activity,
  ArrowRight,
  Terminal,
  User,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Clock,
  Zap,
} from "lucide-react";
import { fetchIPScan } from "./dashboardApiService";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

export function IPSearch({ initialIp, onScanComplete }) {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("ipSearchHistory");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveToHistory = (searchIp) => {
    const newHistory = [
      searchIp,
      ...history.filter((h) => h !== searchIp),
    ].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("ipSearchHistory", JSON.stringify(newHistory));
  };

  const handleSearch = async (e, searchIp = ip) => {
    if (e) e.preventDefault();
    if (!searchIp) return;

    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(searchIp)) {
      setError("Please enter a valid IPv4 address.");
      setResult(null);
      return;
    }

    saveToHistory(searchIp);
    setIp(searchIp);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fetchIPScan(searchIp);

      if (data && data.success) {
        setResult(data.data);
      } else {
        setError(data.message || "Failed to retrieve IP intelligence.");
      }
    } catch (err) {
      console.error("IP Scan failed:", err);
      setError("Unable to connect to the intelligence server.");
    } finally {
      setLoading(false);
      onScanComplete?.();
    }
  };

  useEffect(() => {
    if (!initialIp) return;

    setIp(initialIp);
    handleSearch(null, initialIp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIp]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mx-6 flex justify-center mb-6">
        <form
          onSubmit={(e) => handleSearch(e)}
          className="relative w-full max-w-2xl group"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2  group-focus-within:text-blue-500 transition-colors"
          />
          <input
            type="text"
            value={ip}
            onChange={(e) => {
              setIp(e.target.value);
              if (!e.target.value) {
                setResult(null);
                setError("");
              }
            }}
            placeholder="Enter IP Address "
            className="w-full pl-12 pr-12 py-4 bg-card border border-theme rounded-none text-[15px]  text-foreground focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-500"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            {loading ? (
              <Activity size={18} className="animate-spin text-blue-500" />
            ) : (
              <button
                type="submit"
                disabled={!ip}
                className="text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-0 p-1"
              >
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mx-6 flex flex-wrap items-center justify-center gap-2 -mt-2 mb-8 min-h-[24px]">
        <Clock size={13} className="" />
        <span className="text-[14px]    mr-2">Recent:</span>
        {history.length > 0 ? (
          history.map((h, i) => (
            <button
              key={i}
              onClick={() => handleSearch(null, h)}
              className="px-3 py-1  hover:bg-blue-500/10 border hover:border-blue-500/30 text-[11px] font-semibold  hover:text-blue-500 rounded-none transition-all"
            >
              {h}
            </button>
          ))
        ) : (
          <span className="text-[11px]">No recent searches</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-32 gap-6"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-none animate-spin" />
              <Activity
                size={24}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500"
              />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-black text-[11px]  animate-pulse">
                Please wait...
              </p>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-rose-500/5 border border-rose-500/10 text-rose-500 p-6 rounded-none text-sm  flex items-center gap-3"
          >
            <Shield size={20} />
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 space-y-8 pb-20"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 flex flex-col gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-theme p-8 rounded-none relative overflow-hidden group transition-all duration-500"
                >
                  <div
                    className={`absolute top-6 right-6 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest ${result.status === "up" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20"}`}
                  >
                    {result.status || "Unknown"}
                  </div>
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-none flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <Server
                        size={28}
                        className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold text-slate-500 mb-0.5">
                        Host Identity
                      </div>
                      <div className="text-2xl font-bold text-foreground truncate group-hover:text-blue-500 transition-colors">
                        {result.ip}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <DetailRow
                      icon={Globe}
                      label="Autonomous System Number"
                      value={result.asn}
                      color="blue"
                    />
                    <DetailRow
                      icon={Cpu}
                      label="OS Match"
                      value={result.os_info?.best_match}
                      subValue={`Confidence: ${result.os_info?.confidence}%`}
                      color="purple"
                    />
                    <DetailRow
                      icon={Shield}
                      label="DNSBL Status"
                      value={
                        result.dnsbl?.listed ? "Listed / At Risk" : "Clean"
                      }
                      color={result.dnsbl?.listed ? "rose" : "emerald"}
                    />
                    <DetailRow
                      icon={Terminal}
                      label="rDNS / Hostname"
                      value={
                        result.rdns ||
                        (result.hostnames?.length
                          ? result.hostnames.join(", ")
                          : null)
                      }
                      color="indigo"
                    />
                    <DetailRow
                      icon={Zap}
                      label="Proxy Type"
                      value={result.proxy_type}
                      color="amber"
                    />
                  </div>
                </motion.div>
                <div className="bg-card border border-theme p-8 rounded-none">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 bg-orange-500/10 rounded-none">
                      <MapPin size={20} className="text-orange-500" />
                    </div>
                    <div className="text-[16px] font-bold text-foreground">
                      Geographic Intel
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        City / Region
                      </div>
                      <div className="text-[14px] break-words">
                        {result.geo?.city || "Unknown City"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Country
                      </div>
                      <div className="text-[14px] break-words">
                        {result.geo?.country || "Unknown Country"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Service Provider
                      </div>
                      <div className="text-[14px] break-words">
                        {result.geo?.isp || "Unknown ISP"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-theme">
                      <div>
                        <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Latitude
                        </div>
                        <div className="text-[14px] break-words">
                          {result.geo?.latitude ||
                            result.location?.lat ||
                            "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Longitude
                        </div>
                        <div className="text-[14px] break-words">
                          {result.geo?.longitude ||
                            result.location?.lon ||
                            "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-500/[0.05] border border-theme rounded-none shadow-sm">
                        <Activity size={24} className="text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-foreground">
                          Ports &amp; Service Detection
                        </h3>
                        <p className="font-sm   mt-0.5">
                          Active Network Services
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-none text-[10px]  text-blue-600">
                        Total : {result.ports?.length || 0}
                      </div>
                      <div className="text-[10px]  text-slate-600">
                        Page <span className="text-foreground">1</span> of{" "}
                        <span className="text-foreground">1</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-none overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-500/5">
                          <tr>
                            <th className="px-8 py-4  ">Port</th>
                            <th className="px-8 py-4   ">Service</th>
                            <th className="px-8 py-4    ">Protocol</th>
                            <th className="px-8 py-4     ">State</th>
                            <th className="px-8 py-4   ">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="">
                          {(result.ports || []).map((p, i) => (
                            <motion.tr
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="group hover:bg-slate-500/5 transition-all duration-300"
                            >
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
                                  <span className="text-sm  text-foreground group-hover:translate-x-1 transition-transform duration-300">
                                    {p.port}
                                  </span>
                                  {p.state === "open" && (
                                    <CheckCircle2
                                      size={12}
                                      className="text-emerald-500"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="text-[11px]  text-blue-500 uppercase bg-blue-500/5 px-2 py-1 rounded-none border border-blue-500/10 inline-block group-hover:bg-blue-500/10 transition-colors">
                                  {p.service || p.application || "Unknown"}
                                </div>
                              </td>
                              <td className="px-8 py-4 text-[11px]   uppercase  transition-colors">
                                {p.protocol}
                              </td>
                              <td className="px-8 py-5">
                                <span
                                  className={`text-[10px]  uppercase  px-2 py-1 rounded-none border ${p.state === "open" ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-slate-400 bg-slate-500/5 border-slate-500/20"}`}
                                >
                                  {p.state}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <span className="text-[10px]   uppercase transition-colors">
                                  {p.reason || "N/A"}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                          {(!result.ports || result.ports.length === 0) && (
                            <tr>
                              <td
                                colSpan="5"
                                className="px-8 py-20 text-center  text-xs font-bold  opacity-30"
                              >
                                No Open Ports Discovered
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-theme p-8 rounded-none">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-2 bg-emerald-500/10 rounded-none">
                      <User size={20} className="text-emerald-500" />
                    </div>
                    <div className="text-[14px] font-bold text-foreground">
                      Ownership Details
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <WhoisSection
                      title="Registrant Information"
                      data={result.whois?.contacts?.registrant}
                    />
                    <WhoisSection
                      title="Technical Contact"
                      data={result.whois?.contacts?.technical}
                    />
                    <WhoisSection
                      title="Abuse Contact"
                      data={result.whois?.contacts?.abuse}
                    />
                    <WhoisSection
                      title="Administrative Contact"
                      data={result.whois?.contacts?.administrative}
                    />

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-theme">
                      <WhoisField
                        label="Organization"
                        value={result.whois?.org || result.whois?.name}
                      />
                      <WhoisField
                        label="Network Owner"
                        value={result.whois?.network_owner}
                      />
                      <WhoisField
                        label="CIDR Range"
                        value={result.whois?.cidr}
                      />
                      <WhoisField
                        label="Registrar"
                        value={result.whois?.registrar}
                      />
                      <WhoisField
                        label="Registered Date"
                        value={result.whois?.registered}
                      />
                      <WhoisField
                        label="Top Level Domain"
                        value={result.whois?.tld}
                      />
                      <WhoisField
                        label="Website"
                        value={result.whois?.website}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, subValue, color }) {
  const colorMap = {
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    purple: "text-purple-500 bg-purple-500/5 border-purple-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",

    indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/10",
  };

  return (
    <div
      className={`flex flex-col p-6 rounded-none border ${colorMap[color] || colorMap.slate} space-y-3`}
    >
      <div className="flex items-center gap-4">
        <Icon size={30} className="shrink-0" />
        <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300">
          {label}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-[14px] dark:text-slate-400 break-all mt-1">
          {value || "N/A"}
        </div>
        {subValue && (
          <div className="text-[12px] text-slate-400 mt-0.5">{subValue}</div>
        )}
      </div>
    </div>
  );
}

function WhoisSection({ title, data }) {
  if (!data) return null;
  return (
    <div className="p-6 bg-slate-500/[0.03] border border-theme rounded-none space-y-6">
      <h4
        className=" text-blue-500 
        border-b border-blue-500/10 pb-3"
      >
        {title}
      </h4>
      <div className="space-y-4">
        <WhoisField label="Name" value={data.name} />
        <WhoisField label="Email" value={data.email} />
        <WhoisField label="Phone" value={data.phone} />
        <WhoisField label="Handle" value={data.handle} />
        <WhoisField label="Address" value={data.address} />
      </div>
    </div>
  );
}

function WhoisField({ label, value }) {
  return (
    <div>
      <div className="text-[16px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
        {label}
      </div>

      <div className="text-[14px] break-words">{value || "N/A"}</div>
    </div>
  );
}

IPSearch.propTypes = {
  initialIp: PropTypes.string,
  onScanComplete: PropTypes.func,
};

DetailRow.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string,
  value: PropTypes.string,
  subValue: PropTypes.string,
  color: PropTypes.string,
};

WhoisSection.propTypes = {
  title: PropTypes.string,
  data: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    handle: PropTypes.string,
    address: PropTypes.string,
  }),
};

WhoisField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};
