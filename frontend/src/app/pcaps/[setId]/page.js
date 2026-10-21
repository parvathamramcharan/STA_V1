import { getAuth } from "@/auth";
import { redirect } from "next/navigation";
import PropTypes from "prop-types";
import PcapClientView from "./PcapClientView";
import PcapErrorView from "./PcapErrorView";
import { fetchPcapSet } from "./apiService";

export default async function PcapSetPage({ params }) {
  const session = await getAuth();

  if (!session) redirect("/");
  if (!session.user?.roles?.includes("admin")) redirect("/reports");
  if (!session.accessToken) {
    console.error("Missing access token while loading PCAP set page");
    return <PcapErrorView />;
  }

  const resolvedParams = await params;
  const setId = resolvedParams.setId;

  const actualId = setId.replace("set-", "");

  let pcapResponse;
  try {
    pcapResponse = await fetchPcapSet(actualId, session.accessToken);
    // console.log("PCAP set loaded successfully:", pcapResponse);
    // console.log("PCAP set ID:", actualId);
  } catch (error) {
    console.error("Failed to load PCAP set:", error);
    return <PcapErrorView />;
  }

  return (
    <PcapClientView
      setId={actualId}
      initialResponse={pcapResponse}
      session={{ user: session.user }}
    />
  );
}

PcapSetPage.propTypes = {
  params: PropTypes.object,
};
