import { useState } from "react";
import { Search, Network, ChevronRight } from "lucide-react";

export default function DomainIp({
  selectedDomain,
  setActiveTab,
  setSelectedIp,
}) {
  const [searchIP, setSearchIP] = useState("");
  const filterIPs = selectedDomain.connected_ips.filter((item) =>
    item.ip.includes(searchIP),
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-theme pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
            <Network size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              IP Information
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Connected IPs:{" "}
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-blue-500">
                {selectedDomain.connected_ips.length}
              </span>
            </p>
          </div>
        </div>

        <div className="group relative w-full max-w-xs">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
          />
          <input
            type="text"
            placeholder="Search IP..."
            value={searchIP}
            onChange={(e) => setSearchIP(e.target.value)}
            className="w-full  border border-theme bg-card py-2.5 pl-10 pr-3 text-[13px] font-medium text-foreground shadow-sm transition-all placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {filterIPs.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
          {filterIPs.map((item) => (
            <div
              key={item.ip}
              onClick={() => {
                setSelectedIp(item.ip);
                setActiveTab("IPSearch");
              }}
              className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden  border border-theme bg-card px-3.5 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-md"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span
                className="truncate font-mono text-[13px] font-medium text-foreground"
                title={item.ip}
              >
                {item.ip}
              </span>
              <ChevronRight
                size={14}
                className="ml-auto shrink-0 -translate-x-1 text-slate-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-theme py-14 text-muted-foreground">
          <Search size={22} className="opacity-50" />
          <span className="text-sm">No IPs found</span>
        </div>
      )}
    </div>
  );
}
