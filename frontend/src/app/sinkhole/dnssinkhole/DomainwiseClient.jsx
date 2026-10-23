"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import DomainMap from "./components/DomainMap";
import DomainPcaps from "./components/DomainPcaps";
import DomainIsp from "./components/DomainIsp";
import DomainIp from "./components/DomainIp";
import IpSearch from "./components/IpSearch";
import {
  Search,
  Globe,
  ChevronRight,
  Activity,
  ArrowUp,
  ArrowDown,
  Filter,
  Hash,
} from "lucide-react";
import { Map, FileText, Server, Network } from "lucide-react";
const DOMAIN_TABS = [
  { id: "Map", icon: Map },
  { id: "PCAPs", icon: FileText },
  { id: "ISP", icon: Server },
  { id: "IP", icon: Network },
  { id: "IPSearch", icon: Search },
];

const SORT_OPTIONS = [
  { id: "random", label: "Random" },
  { id: "name", label: "Alphabetical" },
  { id: "requests", label: "Requests" },
  { id: "ips", label: "Connected IPs" },
  { id: "pcaps", label: "PCAPs" },
];
export default function DomainwiseClient({ dnsData, pcapSetId }) {
  const total_domains = dnsData.length;
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeTab, setActiveTab] = useState("Map");
  const [searchDomain, setSearchDomain] = useState("");
  const [selectedIp, setSelectedIp] = useState("");

  const [sortBy, setSortBy] = useState("random");
  const [sortDirection, setSortDirection] = useState("asc");
  const [randomOrder, setRandomOrder] = useState([]);

  const cardRefs = useRef(new globalThis.Map());
  const previousPositions = useRef(new globalThis.Map());

  const filterDomains = dnsData.filter((item) =>
    item.host.toLowerCase().includes(searchDomain.toLowerCase()),
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    const domain = decodeURIComponent(url.pathname.split("/").pop());

    if (domain !== "dnssinkhole") {
      const item = dnsData.find((item) => item.host === domain);

      if (item) {
        setSelectedDomain(item);
      }
    }
  }, [dnsData]);
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const domain = decodeURIComponent(url.pathname.split("/").pop());

      if (domain === "dnssinkhole") {
        setSelectedDomain(null);
      } else {
        const item = dnsData.find((item) => item.host === domain);

        if (item) {
          setSelectedDomain(item);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [dnsData]);
  useEffect(() => {
    if (selectedDomain) {
      setActiveTab("Map");
      setSelectedIp("");
    }
  }, [selectedDomain]);
  useEffect(() => {
    if (sortBy === "random") {
      const shuffled = [...filterDomains].sort(() => Math.random() - 0.5);

      setRandomOrder(shuffled);
    }
  }, [searchDomain, dnsData]);

  const handleDomainClick = (item) => {
    setSelectedDomain(item);

    const url = new URL(window.location.href);

    url.pathname = `/sinkhole/dnssinkhole/${encodeURIComponent(item.host)}`;
    window.history.pushState({}, "", url);
  };

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.pathname = "/sinkhole/dnssinkhole";
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const sortedDomains =
    sortBy === "random" && randomOrder.length > 0
      ? randomOrder.filter((item) =>
          item.host.toLowerCase().includes(searchDomain.toLowerCase()),
        )
      : [...filterDomains].sort((a, b) => {
          if (sortBy == "random") {
            return 0;
          }
          let valueA;
          let valueB;

          switch (sortBy) {
            case "name":
              valueA = a.host.toLowerCase();
              valueB = b.host.toLowerCase();
              break;

            case "requests":
              valueA = Number(a.request_count) || 0;
              valueB = Number(b.request_count) || 0;
              break;

            case "ips":
              valueA = Number(a.connected_ip_count) || 0;
              valueB = Number(b.connected_ip_count) || 0;
              break;

            case "pcaps":
              valueA = Array.isArray(a.pcap_ids) ? a.pcap_ids.length : 0;
              valueB = Array.isArray(b.pcap_ids) ? b.pcap_ids.length : 0;
              break;

            default:
              return 0;
          }
          if (sortDirection === "asc") {
            return typeof valueA === "string"
              ? valueA.localeCompare(valueB)
              : valueA - valueB;
          }
          return typeof valueA === "string"
            ? valueB.localeCompare(valueA)
            : valueB - valueA;
        });

  useLayoutEffect(() => {
    if (previousPositions.current.size === 0) return;

    cardRefs.current.forEach((element, host) => {
      const previous = previousPositions.current.get(host);

      if (!previous || !element) return;

      const current = element.getBoundingClientRect();

      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;

      if (deltaX === 0 && deltaY === 0) return;

      element.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px)`,
          },
          {
            transform: "translate(0, 0)",
          },
        ],
        {
          duration: 700,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });

    previousPositions.current.clear();
  }, [sortedDomains]);
  const captureCardPositions = () => {
    const positions = new globalThis.Map();

    cardRefs.current.forEach((element, host) => {
      if (element) {
        positions.set(host, element.getBoundingClientRect());
      }
    });

    previousPositions.current = positions;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab != "IPSearch") {
      setSelectedIp("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
      {!selectedDomain && (
        <>
          <div className="flex items-center justify-between gap-4 px-6 pt-2 pb-4">
            <h1 className="flex items-center gap-3 text-[22px] font-bold tracking-tight text-foreground">
              DNS Sinkhole
              <span className="flex items-center gap-1.5  border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {total_domains} Domains
              </span>
            </h1>

            <div className="group relative w-full max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
              />
              <input
                type="text"
                placeholder="Search domain..."
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                className="w-full rounded-xl border border-theme bg-card py-2.5 pl-10 pr-3 text-[13px] font-medium text-foreground shadow-sm transition-all placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <div className="mx-6 mb-2 flex px-3 py-2 items-center gap-2 border border-theme bg-card rounded-xl shadow-sm">
            <Filter
              size={18}
              className="text-muted-foreground mx-2 text-slate-500"
            />
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  captureCardPositions();
                  if (option.id === "random") {
                    const shuffled = [...filterDomains].sort(
                      () => Math.random() - 0.5,
                    );
                    setRandomOrder(shuffled);
                    setSortBy("random");
                    return;
                  }
                  if (sortBy === option.id) {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(option.id);
                    setSortDirection("asc");
                  }
                }}
                className={`border flex items-center px-4 py-2 text-sm rounded-md font-medium text-foreground border-theme bg-card transition-all duration-200
                ${
                  sortBy === option.id
                    ? "!border-blue-500 !bg-blue-500 !text-white shadow-sm"
                    : "border-theme bg-card text-foreground hover:border-blue-500 hover:text-blue-500"
                }`}
              >
                <span>{option.label} </span>
                {sortBy === option.id &&
                  (sortDirection === "asc" ? (
                    <ArrowUp size={14} />
                  ) : (
                    <ArrowDown size={14} />
                  ))}
              </button>
            ))}
          </div>
          {sortedDomains.length > 0 ? (
            <div className="mx-6 mb-2 flex-1 min-h-0 overflow-y-auto rounded-2xl border border-theme bg-card/40 p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedDomains.map((item) => (
                  <div
                    key={item.host}
                    ref={(el) => {
                      if (el) {
                        cardRefs.current.set(item.host, el);
                      } else {
                        cardRefs.current.delete(item.host);
                      }
                    }}
                    onClick={() => handleDomainClick(item)}
                    className="group relative flex min-h-[180px] cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-xl border border-blue-300 p-4 shadow-md shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-200"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="min-w-0 truncate text-[16px] font-semibold tracking-tight text-foreground"
                        title={item.host}
                      >
                        {item.host}
                      </span>
                    </div>
                    <div className="w-full mt-2 px-4">
                      <div className="grid w-full grid-cols-2 text-[16px] gap-8 text-muted-foreground">
                        <span className="flex items-center gap-3">
                          <Activity size={16} className="text-emerald-500" />

                          <div className="flex flex-col ">
                            <span className="text-foreground font-bold">
                              {Number(item.request_count).toLocaleString()}
                            </span>
                            <span className="text-[14px] text-muted-foreground">
                              requests
                            </span>
                          </div>
                        </span>

                        <span className="flex items-center gap-3">
                          <Hash size={16} className="text-violet-500" />
                          <div className="flex flex-col">
                            <span className="text-foreground font-bold">
                              {Number(item.connected_ip_count).toLocaleString()}
                            </span>
                            <span className="text-[14px] text-muted-foreground">
                              IPs
                            </span>
                          </div>
                        </span>
                      </div>
                      <div className="mt-8 flex w-full items-center text-[16px] text-muted-foreground">
                        <span className="flex items-center gap-3">
                          <FileText size={16} className="text-orange-500" />
                          <div className="flex flex-col">
                            <span className="text-foreground font-bold">
                              {Number(item.pcap_ids.length).toLocaleString()}
                            </span>
                            <span className="text-[14px] text-muted-foreground">
                              PCAPs
                            </span>
                          </div>
                        </span>
                        <span></span>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="ml-auto shrink-0 -translate-x-1 text-slate-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-theme py-16 text-muted-foreground">
              <Search size={22} className="opacity-50" />
              <span className="text-sm">No domains found</span>
            </div>
          )}
        </>
      )}

      {selectedDomain && (
        <>
          <div className="relative mx-8 mb-1 mt-2 flex items-center gap-5 overflow-hidden  border border-theme bg-card px-5 py-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-pink-500 ring-1 ring-amber-500/20">
              <Globe size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Domain
              </p>
              <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                {selectedDomain.host}
              </h2>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Requests
              </p>
              <p className="flex items-center gap-1.5 text-lg font-semibold tabular-nums text-green-500">
                <Activity size={15} />
                {Number(selectedDomain.request_count).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleClose}
              title="Close"
              className="group ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 transition-all hover:border-rose-500 hover:bg-rose-500 hover:text-white"
            >
              <X
                size={18}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
            </button>
          </div>
          <div className="mx-8 flex flex-1 min-h-0 flex-col">
            {/* TOP TABS */}
            <div className="flex items-center bg-card border  border-blue-400/40 bg-slate-50  rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(59,130,246,0.06),0_0_25px_rgba(59,130,246,0.10)] dark:border-blue-400/25 dark:bg-slate-900 dark:shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_0_30px_rgba(59,130,246,0.12)]">
              {DOMAIN_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                        relative flex-1
                        h-14
                        flex items-center justify-center
                        gap-2
                        text-sm
                        font-semibold
                        transition-all duration-200
                        border-r border-theme
                        last:border-r-0
                        ${
                          isActive
                            ? "text-blue-500 bg-blue-500/5"
                            : "text-foreground hover:text-blue-500 hover:bg-blue-500/5"
                        }
                    `}
                  >
                    <Icon
                      size={16}
                      className={
                        isActive ? "text-blue-500" : "text-muted-foreground"
                      }
                    />

                    <span>{tab.id === "IPSearch" ? "IP Search" : tab.id}</span>

                    {isActive && (
                      <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* CONTENT */}
           <div className="mt-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-theme bg-card p-4">
              {activeTab === "Map" && (
                <DomainMap
                  selectedDomain={selectedDomain}
                  setActiveTab={setActiveTab}
                  setSelectedIp={setSelectedIp}
                />
              )}

              {activeTab === "PCAPs" && (
                <DomainPcaps
                  selectedDomain={selectedDomain}
                  setId={pcapSetId}
                />
              )}

              {activeTab === "ISP" && (
                <DomainIsp
                  selectedDomain={selectedDomain}
                  setActiveTab={setActiveTab}
                  setSelectedIp={setSelectedIp}
                />
              )}

              {activeTab === "IP" && (
                <DomainIp
                  selectedDomain={selectedDomain}
                  setActiveTab={setActiveTab}
                  setSelectedIp={setSelectedIp}
                />
              )}

              {activeTab === "IPSearch" && <IpSearch initialIp={selectedIp} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
