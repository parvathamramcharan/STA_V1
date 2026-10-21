"use client";

export default function PcapErrorView() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background px-4">
      <div className="w-full max-w-lg rounded-2xl border border-theme bg-card shadow-xl overflow-hidden">
        {/* Status indicator */}
        <div className="px-6 pt-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Unable to load PCAP data
          </h2>

          <p className="mt-2 text-sm leading-6 text-foreground/60">
            We couldn't retrieve the PCAP information right now. This may be
            temporary. Please try again in a moment.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 px-6 py-7">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400  px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4"
              />
            </svg>
            Try Again
          </button>
        </div>

        {/* Subtle footer */}
        <div className="border-t border-theme bg-foreground/[0.02] px-6 py-3 text-center mb-8">
          <p className="text-xs text-foreground/40">
            If the problem continues, refresh the page or contact your
            administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
