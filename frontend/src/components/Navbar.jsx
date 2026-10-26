"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Shield,
  Info,
  UploadCloud,
} from "lucide-react";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import { MessageSquare } from "lucide-react";

export function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [feedbackMenuOpen, setFeedbackMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pcapMenuOpen, setPcapMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const pcapRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pcapRef.current && !pcapRef.current.contains(event.target))
        setPcapMenuOpen(false);
      if (userRef.current && !userRef.current.contains(event.target))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roles = user?.roles || [];
  const isAdmin = roles.includes("admin");
  const isPcapNavigationActive =
    pathname.startsWith("/pcaps") || pathname.startsWith("/sinkhole");
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const handleLogout = async () => {
    setLogoutPending(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.error || `Logout failed with status ${response.status}`,
        );
      }
      setShowLogoutModal(false);
      try {
        localStorage.removeItem("ipSearchHistory");
      } catch (error) {
        console.error("Could not clear saved IP search history:", error);
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Could not revoke the authentication tokens:", error);
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Could not revoke the current session. Please retry.",
      );
    } finally {
      setLogoutPending(false);
    }
  };

  const NavLink = ({ href, icon: Icon, label, isActive }) => (
    <Link
      href={href}
      className={`h-14 px-4 flex items-center gap-2 text-[15px]  font-semibold transition-all relative ${
        isActive ? "text-blue-500" : "text-slate-800 "
      }`}
    >
      <Icon
        size={16}
        className={` ${isActive ? "text-blue-500" : "text-slate-800"}`}
      />
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-t-md shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}
    </Link>
  );

  return (
    <>
      <nav className="bg-nav border-b border-theme h-14 flex items-center px-6 gap-8 sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200">
            <Shield size={14} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-foreground text-[18px]">
            Network Traffic Analysis
          </span>
        </div>

        <div className="flex items-center flex-1 h-full">
          {isAdmin ? (
            <>
              <NavLink
                href="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                isActive={pathname === "/dashboard"}
              />

              <div
                role="navigation"
                aria-label="PCAP navigation"
                className="relative h-full"
                onMouseEnter={() => setPcapMenuOpen(true)}
                onMouseLeave={() => setPcapMenuOpen(false)}
              >
                <button
                  className={`h-14 px-4 flex items-center gap-2 text-[15px] font-semibold  transition-all relative outline-none    ${
                    isPcapNavigationActive
                      ? "text-blue-500   "
                      : "text-slate-800 "
                  }`}
                >
                  <FileText
                    size={16}
                    className={
                      isPcapNavigationActive
                        ? "text-blue-500  "
                        : "text-slate-800   "
                    }
                  />
                  PCAPS
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${pcapMenuOpen ? "rotate-180" : ""}`}
                  />
                  {isPcapNavigationActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-t-md shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </button>

                {pcapMenuOpen && (
                  <div className="absolute top-14 left-0 bg-card border border-theme shadow-2xl rounded-xl overflow-hidden p-1.5 min-w-[180px] z-50">
                    {[
                      { label: "Set 1", href: "/pcaps/set-1" },
                      { label: "DNS Sinkhole PCAP's", href: "/pcaps/set-2" },
                      { label: "IP Sinkhole PCAP's", href: "/pcaps/set-3" },
                      {
                        label: "DNS Sinkholing",
                        href: "/sinkhole/dnssinkhole",
                      },
                      {
                        label: "IP Sinkholing",
                        href: "/sinkhole/ipsinkhole",
                      },
                    ].map((set) => (
                      <Link
                        key={set.href}
                        href={set.href}
                        onClick={() => setPcapMenuOpen(false)}
                        className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors group hover:bg-blue-500/10 hover:text-blue-600  "
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300  group-hover:bg-blue-500 transition-colors" />
                        {set.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                href="/upload"
                icon={UploadCloud}
                label="Upload"
                isActive={pathname === "/upload"}
              />
              <NavLink
                href="/about"
                icon={Info}
                label="About"
                isActive={pathname === "/about"}
              />
            </>
          ) : (
            <>
              <div
                role="navigation"
                aria-label="Reports navigation"
                className="relative h-full"
                onMouseEnter={() => setPcapMenuOpen(true)}
                onMouseLeave={() => setPcapMenuOpen(false)}
              >
                <button
                  className={`h-14 px-4 flex items-center gap-2 text-[13px] font-semibold transition-all relative outline-none ${
                    pathname.startsWith("/reports")
                      ? "text-blue-500"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText
                    size={16}
                    className={
                      pathname.startsWith("/reports")
                        ? "text-blue-500"
                        : "text-slate-400"
                    }
                  />
                  Reports
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${pcapMenuOpen ? "rotate-180" : ""}`}
                  />
                  {pathname.startsWith("/reports") && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-t-md shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </button>

                {pcapMenuOpen && (
                  <div className="absolute top-14 left-0 bg-card border border-theme rounded-xl shadow-xl min-w-[180px] p-1.5 z-50">
                    <Link
                      href="/reports?set=1"
                      onClick={() => setPcapMenuOpen(false)}
                      className="block px-3 py-2 text-[13px] font-semibold text-slate-500 rounded-md hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                    >
                      Set 1
                    </Link>
                  </div>
                )}
              </div>
              <NavLink
                href="/about"
                icon={Info}
                label="About"
                isActive={pathname === "/about"}
              />
            </>
          )}
        </div>

        <div className="relative h-full flex items-center" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 outline-none group"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                userMenuOpen
                  ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                  : "bg-blue-600 text-white group-hover:shadow-lg group-hover:shadow-blue-500/20"
              }`}
            >
              {firstLetter}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute top-14 right-0 bg-card border border-theme rounded-xl shadow-2xl min-w-[180px] p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-theme mb-1">
                <div className=" font-semibold  text-foreground">
                  {user?.name || "Logged In"}
                </div>
                {/* <div className="text-[11px] text-slate-500 truncate">{user?.email || "No email"}</div> */}
              </div>

              <div className="relative">
                <Link
                  href={isAdmin ? "#" : "/feedback/submit"}
                  onClick={(e) => {
                    if (isAdmin) {
                      e.preventDefault();
                      setFeedbackMenuOpen(!feedbackMenuOpen);
                      return;
                    }

                    setUserMenuOpen(false);
                    setFeedbackMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 font-semibold text-slate-800  rounded-md hover:bg-slate-100  transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare
                      size={14}
                      className="text-slate-800 "
                    />
                    Feedback
                  </span>

                  {isAdmin && (
                    <ChevronLeft
                      size={14}
                      className={`transition-transform ${
                        feedbackMenuOpen ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </Link>

                {isAdmin && feedbackMenuOpen && (
                  <div className="absolute right-full top-0 mr-2 bg-card border border-theme rounded-xl shadow-2xl min-w-[190px] p-1.5">
                    <Link
                      href="/feedback/view"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setFeedbackMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 font-semibold text-slate-800  rounded-md hover:bg-slate-100 "
                    >
                      View Feedback
                    </Link>
                    <Link
                      href="/feedback/submit"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setFeedbackMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 font-semibold text-slate-800  rounded-md hover:bg-slate-100 "
                    >
                      Submit Feedback
                    </Link>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full text-left px-3 py-2 font-semibold text-red-500 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-1"
              >
                <LogOut size={14} className="text-red-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => {
          if (logoutPending) return;
          setLogoutError("");
          setShowLogoutModal(false);
        }}
        onConfirm={handleLogout}
        error={logoutError}
        isPending={logoutPending}
      />
    </>
  );
}
