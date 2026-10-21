import { getAuth } from "@/auth";
import { redirect } from "next/navigation";
import PcapErrorView from "../PcapErrorView";
import { dnssinkhole } from "../dnssinkhole/dnsApiService";
import DomainwiseClient from "./DomainwiseClient";
export default async function DomainwisePage({ params }) {
  // console.log(dnsData);
  const session = await getAuth();
  if (!session) redirect("/");
  if (!session.user?.roles?.includes("admin")) redirect("reports");
  if (!session.accessToken) {
    console.log(
      "access token is missing while loading the set 2 domain wise page",
    );
    return <PcapErrorView />;
  }

  const dnsData = await dnssinkhole(session.accessToken);
  const resolvesParams = await params;
  const setId = resolvesParams.setId;
  const actualId = setId.replace("set-", "");

  return (
    <div>
      <DomainwiseClient dnsData={dnsData} />
    </div>
  );
}
