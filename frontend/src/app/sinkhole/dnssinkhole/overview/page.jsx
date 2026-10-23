import { getAuth } from "@/auth";
import { redirect } from "next/navigation";

import PcapErrorView from "@/app/pcaps/[setId]/PcapErrorView";
import { dnsSinkoleSummary } from "../dnsApiService";

import DnsSinkoleSummaryDashboard from "./DnsSinkoleSummaryDashboard";

export default async function DnsSinkoleSummaryPage() {
  const session = await getAuth();

  if (!session) {
    redirect("/");
  }

  if (!session.user?.roles?.includes("admin")) {
    redirect("/reports");
  }

  if (!session.accessToken) {
    console.error("Access token is missing while loading DNS Sinkhole.");
    return <PcapErrorView />;
  }

  const pcapSetId = "set-2";

  let dnsdataSummary;

  try {
    dnsdataSummary = await dnsSinkoleSummary(session.accessToken);
  } catch (error) {
    console.error("Failed to load DNS Sinkhole overview data:", error);
    return <PcapErrorView />;
  }

  if (!dnsdataSummary) {
    return <PcapErrorView />;
  }

  return (
    <DnsSinkoleSummaryDashboard
      pcapSetId={pcapSetId}
      dnsdataSummary={dnsdataSummary}
    />
  );
}