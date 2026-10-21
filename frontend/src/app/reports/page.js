import { getAuth } from "@/auth";
import { redirect } from "next/navigation";
import ReportsClientView from "./ReportsClientView";

export default async function ReportsPage() {
  const session = await getAuth();

  if (!session) redirect("/");

  return (
    <div className="p-6">
      <ReportsClientView session={{ user: session.user }} />
    </div>
  );
}
