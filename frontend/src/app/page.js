import { redirect } from "next/navigation";
import { getAuth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function AppLoginPage() {
  const session = await getAuth();
  if (session) {
    const isAdmin = session.user?.roles?.includes("admin");
    if (isAdmin) {
      redirect("/dashboard");
    } else {
      redirect("/reports?set=1");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in zoom-in duration-700">
      <div className="bg-card p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-blue-500/5 border border-theme max-w-md w-full text-center relative overflow-hidden transition-colors">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative">
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tighter">
            Network Traffic Analysis
          </h1>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
