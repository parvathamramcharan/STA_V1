"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Globe,
  Server,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  HardDrive,
  Clock,
  Activity,
  AlertTriangle,
  Database,
  Shield,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { fetchPcapSet } from "../pcaps/[setId]/apiService";
import {
  fetchPcapGeoReport,
  fetchPcapDetails,
  fetchIpScan,
} from "../pcaps/[setId]/apiService";
import { formatBytes, formatDuration } from "../pcaps/[setId]/PcapClientView";
import { useSearchParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PropTypes from "prop-types";

export default function ReportsClientView({ session }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedSet = searchParams.get("set") || "1";
  const [pcapFiles, setPcapFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const pageSize = 15;

  const loadPcapFiles = async (setId) => {
    setTimeout(() => {
      setIsLoading(true);
      setError(null);
    }, 0);
    try {
      const response = await fetchPcapSet(setId);
      if (response.success) {
        setPcapFiles(response.data || []);
      } else {
        setError("Failed to load PCAP files for this set.");
      }
    } catch (err) {
      console.error("Error loading PCAP files:", err);
      setError("Analysis server connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPcapFiles(selectedSet);
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedSet]);

  const handleDownload = async (file, mode) => {
    setIsGeneratingPdf({ id: file.pcap_id, mode });

    try {
      const userPassword = session?.user?.pdfPassword || "";
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        encryption: {
          userPassword: userPassword,
          ownerPassword: userPassword,
          userPermissions: ["print", "modify", "copy", "annot-forms"],
        },
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const blue = [37, 99, 235];
      const emerald = [16, 185, 129];
      const slate = [100, 116, 139];

      const geoRes = await fetchPcapGeoReport(file.pcap_id);
      if (!geoRes.success) throw new Error("Failed to fetch geo data");

      const items =
        mode === "country" ? geoRes.data.countries : geoRes.data.isps;

      // --- COVER PAGE ---
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      const reportSubtitle =
        mode === "country" ? "Country Wise Report" : "ISP Wise Report";
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${reportSubtitle}`, 30, 45);

      doc.setFontSize(28);
      const title = file.filename.toUpperCase();
      const splitTitle = doc.splitTextToSize(title, 150);
      doc.text(splitTitle, 30, 66);

      const titleHeight = splitTitle.length * 12.5;
      doc.setDrawColor(blue[0], blue[1], blue[2]);
      doc.setLineWidth(1.5);
      doc.line(20, 40, 20, 66 + titleHeight - 5);

      const metadataStart = Math.max(125, 66 + titleHeight + 25);

      doc.setFontSize(10);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(
        `Generated On: ${new Date().toLocaleString()}`,
        30,
        metadataStart,
      );
      doc.text(
        `Total ${mode.toUpperCase()}s Discovered: ${items.length}`,
        30,
        metadataStart + 12,
      );

      doc.setFontSize(10);
      doc.setTextColor(blue[0], blue[1], blue[2]);
      doc.text("SINKHOLE TRAFFIC ANALYSIS SYSTEM", 30, pageHeight - 30);

      const topItems = items.slice(0, 30);

      for (const item of topItems) {
        doc.addPage();

        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(
          mode === "isp"
            ? "ISP Report"
            : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Report`,
          25,
          13,
        );
        const nameUpper = item.name.toUpperCase();
        let headerFontSize = 24;
        if (nameUpper.length > 35) {
          headerFontSize = 14;
        } else if (nameUpper.length > 20) {
          headerFontSize = 18;
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(headerFontSize);
        doc.setFont("helvetica", "bold");

        const splitName = doc.splitTextToSize(nameUpper, pageWidth - 45);
        const nameHeight = splitName.length * (headerFontSize * 0.35);
        const nameY = 28 - nameHeight / 2 + headerFontSize * 0.15;
        doc.text(splitName, 25, nameY);

        doc.setDrawColor(blue[0], blue[1], blue[2]);
        doc.setLineWidth(1);
        doc.line(20, 12, 20, 32);

        const detailsRes = await fetchPcapDetails(
          file.pcap_id,
          mode,
          item.name,
        );
        const ips = detailsRes.data || [];
        const topIps = ips.slice(0, 10);

        let currentY = 50;

        for (const [index, ipInfo] of topIps.entries()) {
          const sNo = `[#${(index + 1).toString().padStart(2, "0")}]`;

          if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 25;
          }

          doc.setTextColor(30, 41, 59);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(`${sNo}  ${ipInfo.ip}`, 20, currentY);
          currentY += 6;

          try {
            const intelRes = await fetchIpScan(ipInfo.ip);
            if (intelRes && intelRes.success) {
              const intel = intelRes.data;

              autoTable(doc, {
                startY: currentY,
                head: [["PARAMETER", "DISCOVERED VALUE"]],
                body: [
                  ["ASN", intel.asn || "N/A"],
                  ["OS MATCH", intel.os_info?.best_match || "N/A"],
                  ["NETWORK STATUS", intel.status?.toUpperCase() || "N/A"],
                  [
                    "DNSBL REPUTATION",
                    intel.dnsbl?.listed ? "LISTED / AT RISK" : "CLEAN",
                  ],
                  ["ISP / PROVIDER", intel.geo?.isp || "N/A"],
                  [
                    "LOCATION",
                    `${intel.geo?.city || "N/A"}, ${intel.geo?.country || "N/A"}`,
                  ],
                  ["PROXY TYPE", intel.proxy_type || "N/A"],
                ],
                theme: "grid",
                headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                  0: {
                    cellWidth: 45,
                    fontStyle: "bold",
                    fillColor: [248, 250, 252],
                  },
                },
                margin: { left: 20, right: 20 },
              });
              currentY = doc.lastAutoTable.finalY + 15;
            } else {
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(8);
              doc.text(
                "Extended intelligence record unavailable for this node.",
                25,
                currentY + 5,
              );
              currentY += 15;
            }
          } catch (e) {
            currentY += 10;
          }
        }
      }

      doc.save(
        `REPORT_${mode.toUpperCase()}_${file.filename.replace(/\.[^/.]+$/, "")}_${new Date().getTime()}.pdf`,
      );
      setShowPasswordModal(true);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate report. Please check server logs.");
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const totalPages = Math.ceil(pcapFiles.length / pageSize);
  const paginatedFiles = pcapFiles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="max-w-[1400px] mx-auto pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-6 bg-card border border-theme border-dashed rounded-none">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <Activity
              size={32}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500"
            />
          </div>
          <div className="text-center">
            <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] animate-pulse">
              fetching reports...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-card border border-theme border-dashed rounded-none p-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-rose-500/10 rounded-none flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3 ">
            Intelligence Offline
          </h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">
            {error}
          </p>
          <button
            onClick={() => loadPcapFiles(selectedSet)}
            className="px-10 py-4 bg-slate-900 text-white font-black text-[12px] uppercase tracking-widest rounded-none hover:bg-black transition-all shadow-xl active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      ) : pcapFiles.length === 0 ? (
        <div className="bg-card border border-theme border-dashed rounded-none p-32 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.02),transparent_70%)]" />
          <div className="relative">
            <div className="w-24 h-24 bg-slate-500/5 rounded-none flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-700 border border-theme">
              <Database className="text-slate-300" size={48} />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">
              No Records Discovered
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto text-[15px] font-medium leading-relaxed">
              Analysis set {selectedSet} does not contain any processed PCAP.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <LayoutGroup>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-2"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {paginatedFiles.map((file) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    key={file.pcap_id}
                    className="bg-card border-2 border-slate-200/60 dark:border-slate-800 p-5 rounded-none hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 hover:ring-1 hover:ring-blue-600 transition-all group flex flex-col justify-between min-h-[180px]"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start">
                        <div className="min-w-0 flex-1">
                          <h3
                            className="text-md font-black text-foreground line-clamp-3 group-hover:text-blue-600 transition-colors"
                            title={file.filename}
                          >
                            {file.filename}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-theme">
                      <button
                        onClick={() => handleDownload(file, "country")}
                        disabled={isGeneratingPdf !== null}
                        className={`relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-none font-black text-[13px] transition-all border overflow-hidden ${
                          isGeneratingPdf?.id === file.pcap_id &&
                          isGeneratingPdf?.mode === "country"
                            ? "bg-slate-50 text-slate-400 border-theme"
                            : "bg-gradient-to-r from-blue-50 to-white text-blue-600 border-blue-100 hover:border-blue-300 hover:shadow-md active:scale-95 group/btn shadow-sm"
                        }`}
                      >
                        {isGeneratingPdf?.id === file.pcap_id &&
                        isGeneratingPdf?.mode === "country" ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span className="text-[10px]">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Globe
                              size={13}
                              className="group-hover/btn:rotate-12 transition-transform"
                            />
                            <span>Country</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownload(file, "isp")}
                        disabled={isGeneratingPdf !== null}
                        className={`relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-none font-black text-[11px] uppercase tracking-wider transition-all border overflow-hidden ${
                          isGeneratingPdf?.id === file.pcap_id &&
                          isGeneratingPdf?.mode === "isp"
                            ? "bg-slate-50 text-slate-400 border-theme"
                            : "bg-gradient-to-r from-emerald-50 to-white text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:shadow-md active:scale-95 group/btn shadow-sm"
                        }`}
                      >
                        {isGeneratingPdf?.id === file.pcap_id &&
                        isGeneratingPdf?.mode === "isp" ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span className="text-[10px]">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Server
                              size={13}
                              className="group-hover/btn:rotate-12 transition-transform"
                            />
                            <span>ISP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-3 pt-2 pb-10">
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-10 h-10 rounded-none font-black text-[12px] transition-all border ${
                        currentPage === page
                          ? "bg-blue-50 text-blue-600 border-blue-600 shadow-lg shadow-blue-500/10"
                          : "bg-card border-theme text-slate-500 hover:text-blue-600 hover:border-blue-500"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <span className="text-[11px] font-black  text-slate-600">
                Page{" "}
                <span className="text-foreground font-black">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="text-foreground font-black">{totalPages}</span>
              </span>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-card border-2 border-theme p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center rounded-none"
            >
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-6 rounded-none">
                <Shield size={32} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-4">
                PDF Securely Encrypted
              </h3>

              <div className="space-y-4 text-left w-full mb-8">
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed text-center">
                  To open the downloaded report, please use your dynamic PDF
                  password.
                </p>
                <div className="bg-slate-500/5 border border-theme p-4 text-[12px] font-black text-foreground/90 uppercase tracking-wider space-y-2 text-center rounded-none">
                  <div className="text-blue-500">Password Formula:</div>
                  <div className="text-[13px] lowercase font-mono bg-card px-3 py-2 border border-theme inline-block select-all whitespace-nowrap">
                    username(first 5) + password(first 5)
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic text-center font-medium leading-normal">
                  Example: If username is <strong>admin1</strong> and password
                  is <strong>password</strong>, the PDF password is{" "}
                  <strong className="font-mono not-italic text-blue-500">
                    adminpassw
                  </strong>
                  .
                </p>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-[12px] uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 rounded-none"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
