import { getAuth } from "@/auth";
import { redirect } from "next/navigation";
import PcapErrorView from "@/app/pcaps/[setId]/PcapErrorView";
import { dnssinkhole } from "./dnsApiService";
import DomainwiseClient from "./DomainwiseClient";
export default async function DomainwisePage() {
  const session = await getAuth();
  if (!session) redirect("/");
  if (!session.user?.roles?.includes("admin")) redirect("/reports");
  if (!session.accessToken) {
    console.log(
      "access token is missing while loading the DNS sinkhole page",
    );
    return <PcapErrorView />;
  }

  const dnsData = await dnssinkhole(session.accessToken);

  return (
    <div>
      <DomainwiseClient dnsData={dnsData} pcapSetId="set-2" />
    </div>
  );
}
