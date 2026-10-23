"use client";

import { useEffect, useState } from "react";
import { Search, X, Server, Network } from "lucide-react";
import { getISPdnsSinkholeDomain } from "../dnsApiService";

export default function DomainIsp({
  selectedDomain,
  setActiveTab,
  setSelectedIp,
}) {
  const [ispData, setIspData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected ISP
  const [selectedIsp, setSelectedIsp] = useState(null);

  // Search states
  const [ispSearch, setIspSearch] = useState("");
  const [ipSearch, setIpSearch] = useState("");

  useEffect(() => {
    if (!selectedDomain?.host) {
      return;
    }

    const fetchISPData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getISPdnsSinkholeDomain(selectedDomain.host);

        console.log("ISP data:", data);

        setIspData(data);
      } catch (error) {
        console.error("Failed to fetch ISP data:", error);
        setError("Failed to load ISP data");
      } finally {
        setLoading(false);
      }
    };

    fetchISPData();
  }, [selectedDomain]);

  // Reset selected ISP when domain changes
  useEffect(() => {
    setSelectedIsp(null);
    setIspSearch("");
    setIpSearch("");
  }, [selectedDomain]);

  // Filter ISPs
  const filteredIsps = ispData.filter((item) =>
    item.isp?.toLowerCase().includes(ispSearch.toLowerCase()),
  );

  // Filter IPs of selected ISP
  const filteredIps =
    selectedIsp?.ips?.filter((item) =>
      item.ip?.toLowerCase().includes(ipSearch.toLowerCase()),
    ) || [];

  // Close selected ISP
  const handleClose = () => {
    setSelectedIsp(null);
    setIspSearch("");
    setIpSearch("");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading ISP data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-rose-500">{error}</p>
      </div>
    );
  }

  // ================= SELECTED ISP =================

  if (selectedIsp) {
    return (
      <div className="flex h-[550px] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme pb-4">
          {/* ISP Name */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Server size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                ISP
              </p>

              <h2
                className="truncate text-lg font-semibold text-foreground"
                title={selectedIsp.isp}
              >
                {selectedIsp.isp}
              </h2>
            </div>

            <span className="ml-2 shrink-0 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
              {selectedIsp.ip_count} IPs
            </span>
          </div>

          {/* Search + Close */}
          <div className="flex items-center gap-2">
            {/* IP Search */}
            <div className="relative w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search IP..."
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                className="w-full rounded-xl border border-theme bg-card py-2.5 pl-10 pr-10 text-[13px] font-medium text-foreground shadow-sm transition-all placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />

              {ipSearch && (
                <button
                  onClick={() => setIpSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Close ISP */}
            <button
              onClick={handleClose}
              title="Back to ISPs"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-500 transition-all hover:border-rose-500 hover:bg-rose-500 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        </div>
        {/* IP Table */}
        <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-theme">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-theme bg-card">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  IP Address
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredIps.length > 0 ? (
                filteredIps.map((ipItem, index) => (
                  <tr
                    key={ipItem.ip}
                    onClick={() => {
                      setSelectedIp(ipItem.ip);
                      setActiveTab("IPSearch");
                    }}
                    className="cursor-pointer border-b border-theme last:border-b-0 transition-colors hover:bg-blue-500/5"
                  >
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {index + 1}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                          <Network size={15} />
                        </div>

                        <span className="font-mono text-sm text-foreground">
                          {ipItem.ip}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No IPs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ================= ISP LIST =================

  return (
    <div className="flex h-[550px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ISPs</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {ispData.length} ISPs found
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search ISP..."
            value={ispSearch}
            onChange={(e) => setIspSearch(e.target.value)}
            className="w-full rounded-xl border border-theme bg-card py-2.5 pl-10 pr-10 text-[13px] font-medium text-foreground shadow-sm transition-all placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          />

          {ispSearch && (
            <button
              onClick={() => setIspSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-foreground"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ISP Table */}
      <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-theme">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-theme bg-card">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                #
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ISP
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                IP Count
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredIsps.length > 0 ? (
              filteredIsps.map((item, index) => (
                <tr
                  key={item.isp}
                  onClick={() => {
                    setSelectedIsp(item);
                    setIpSearch("");
                  }}
                  className="group cursor-pointer border-b border-theme last:border-b-0 transition-colors hover:bg-blue-500/5"
                >
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {index + 1}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                        <Server size={15} />
                      </div>

                      <span className="text-sm font-medium text-foreground">
                        {item.isp}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                      {item.ip_count}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  No ISPs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
