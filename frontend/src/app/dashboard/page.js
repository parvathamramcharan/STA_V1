import { getAuth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClientView from "./DashboardClientView";

import { Suspense } from "react";

export default async function AnalyticsDashboardPage() {
  const session = await getAuth();
  const clientSession = session ? { user: session.user } : null;

  if (!session) redirect("/");
  if (!session.user?.roles?.includes("admin")) redirect("/reports?set=1");

  return (
    <div className="w-full ">
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs"></div>
        }
      >
        <DashboardClientView session={clientSession} />
      </Suspense>
    </div>
  );
}
