"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  RefreshCcw,
  Trash2,
  Download,
  CheckCircle,
  AlertCircle,
  FileX,
  File,
  FileText,
} from "lucide-react";

const API_BASE = "/api/ceph";

const ALLOWED_EXT = new Set([
  ".pcap",
  ".pcapng",
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  ".tbz2",
  ".xz",
  ".txz",
  ".zst",
  ".7z",
  ".rar",
  ".log",
]);

/* ── helpers ────────────────────────────────────── */
function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function fileExt(name = "") {
  return (name.split(".").pop() || "").toLowerCase();
}

function getFileType(name = "") {
  const ext = "." + fileExt(name);
  if ([".pcap", ".pcapng"].includes(ext)) return { label: "PCAP" };
  if (
    [
      ".zip",
      ".tar",
      ".gz",
      ".tgz",
      ".bz2",
      ".tbz2",
      ".xz",
      ".txz",
      ".zst",
      ".7z",
      ".rar",
    ].includes(ext)
  )
    return { label: "Archive" };
  if (ext === ".log") return { label: "Log" };
  return { label: ext.replace(".", "").toUpperCase() || "File" };
}

function FileIcon({ name }) {
  const ext = fileExt(name);
  const isPcap = ["pcap", "pcapng", "cap"].includes(ext);
  const isPdf = ext === "pdf";

  if (isPcap)
    return (
      <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[7px] shrink-0 bg-[rgba(37,99,235,0.10)] text-[#2563eb] dark:bg-[rgba(59,130,246,0.13)] dark:text-[#3b82f6]">
        <File size={14} />
      </span>
    );
  if (isPdf)
    return (
      <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[7px] shrink-0 bg-[rgba(220,38,38,0.09)] text-[#dc2626] dark:bg-[rgba(248,113,113,0.09)] dark:text-[#f87171]">
        <FileText size={14} />
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-[7px] shrink-0 bg-[rgba(75,107,154,0.10)] text-[#4b6b9a] dark:bg-[rgba(148,163,184,0.10)] dark:text-[#94a3b8]">
      <File size={14} />
    </span>
  );
}

/* ── main component ─────────────────────────────── */
export default function UploadPage() {
  const [buckets, setBuckets] = useState([]);
  const [activeBucket, setActiveBucket] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [toast, setToast] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [isCreatingBucket, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadBuckets = useCallback(
    async ({ selectFirst = false } = {}) => {
      try {
        const res = await fetch(`${API_BASE}/buckets`);
        const json = await res.json();
        if (!res.ok) {
          showToast(json.error || "Unable to fetch datasets", "error");
          return;
        }
        const data = json.data || [];
        setBuckets(data);
        if (selectFirst && data.length)
          setActiveBucket((prev) => prev || data[0].name);
      } catch (e) {
        showToast(e.message || "Network error", "error");
      }
    },
    [showToast],
  );

  async function createBucket() {
    const name = newBucketName.trim();
    if (!name) {
      showToast("Enter a dataset name", "error");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE}/buckets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: name }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Dataset "${name}" created`);
        setNewBucketName("");
        await loadBuckets();
        setActiveBucket(name);
      } else {
        showToast(
          json.error || json.message || "Failed to create dataset",
          "error",
        );
      }
    } catch (e) {
      showToast(e.message || "Network error", "error");
    } finally {
      setIsCreating(false);
    }
  }

  function confirmDeleteBucket(name, event) {
    event.stopPropagation();
    setDeleteModal({
      type: "bucket",
      key: name,
      name: `dataset "${name}" and all its files`,
    });
  }

  async function executeBucketDelete(name) {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/buckets/${encodeURIComponent(name)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) {
        showToast(
          json.error || json.message || "Failed to delete dataset",
          "error",
        );
        return;
      }
      showToast(`Dataset "${name}" deleted`);
      if (activeBucket === name) {
        setActiveBucket(null);
        setFiles([]);
      }
      await loadBuckets();
    } catch (e) {
      showToast(e.message || "Network error", "error");
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  }

  const loadFiles = useCallback(
    async (bucket) => {
      try {
        const res = await fetch(
          `${API_BASE}/buckets/${encodeURIComponent(bucket)}/objects`,
        );
        const json = await res.json();
        if (!res.ok) {
          showToast(json.error || "Unable to fetch files", "error");
          setFiles([]);
          return;
        }
        setFiles(json.data || []);
      } catch (e) {
        showToast(e.message || "Network error", "error");
        setFiles([]);
      }
    },
    [showToast],
  );

  useEffect(() => {
    const t = setTimeout(() => loadBuckets({ selectFirst: true }), 0);
    return () => clearTimeout(t);
  }, [loadBuckets]);

  useEffect(() => {
    if (!activeBucket) return;
    const t = setTimeout(() => loadFiles(activeBucket), 0);
    return () => clearTimeout(t);
  }, [activeBucket, loadFiles]);

  async function uploadFiles(fileList) {
    if (!activeBucket || !fileList.length) return;

    const arr = Array.from(fileList);
    const rejected = arr.filter((f) => !ALLOWED_EXT.has("." + fileExt(f.name)));
    const allowed = arr.filter((f) => ALLOWED_EXT.has("." + fileExt(f.name)));

    if (rejected.length) {
      showToast(
        `Rejected ${rejected.length} file(s): ${rejected.map((f) => f.name).join(", ")} — unsupported type`,
        "error",
      );
    }
    if (!allowed.length) return;

    setUploading(true);
    setProgress(0);

    for (let i = 0; i < allowed.length; i++) {
      const file = allowed[i];
      setProgressLabel(`Uploading ${file.name} (${i + 1} / ${allowed.length})`);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(
          `${API_BASE}/buckets/${encodeURIComponent(activeBucket)}/objects/${encodeURIComponent(file.name)}`,
          { method: "PUT", body: form },
        );
        const json = await res.json();
        if (!res.ok)
          showToast(json.error || `Upload failed: ${file.name}`, "error");
      } catch (e) {
        showToast(e.message || `Upload failed: ${file.name}`, "error");
      }
      setProgress(Math.round(((i + 1) / allowed.length) * 100));
    }
    setUploading(false);
    setProgressLabel(`${allowed.length} file(s) uploaded`);
    showToast(`Uploaded ${allowed.length} file(s) to "${activeBucket}"`);
    loadFiles(activeBucket);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function confirmDeleteFile(key) {
    if (!activeBucket) return;
    setDeleteModal({ type: "file", key, name: key });
  }

  async function executeFileDelete(key) {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/buckets/${encodeURIComponent(activeBucket)}/objects/${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Delete failed", "error");
        return;
      }
      showToast(`Deleted "${key}"`);
      loadFiles(activeBucket);
    } catch (e) {
      showToast(e.message || "Network error", "error");
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  }

  function handleConfirmDelete() {
    if (!deleteModal) return;
    if (deleteModal.type === "file") executeFileDelete(deleteModal.key);
    else executeBucketDelete(deleteModal.key);
  }

  async function downloadFile(key) {
    if (!activeBucket) return;
    try {
      const res = await fetch(
        `${API_BASE}/buckets/${encodeURIComponent(activeBucket)}/objects/${encodeURIComponent(key)}`,
      );
      if (!res.ok) {
        showToast("Download failed", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = key.split("/").pop();
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e.message || "Network error", "error");
    }
  }

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  /* ── shared class fragments ─────────────────────
     Tailwind can't express CSS custom properties directly,
     so light/dark pairs are inlined as arbitrary values with
     a `dark:` variant. This assumes dark mode is toggled via
     a `dark` class on a parent element (Tailwind's default
     class strategy) — swap the variant selector in
     tailwind.config.js if your app instead toggles
     `data-theme="dark"`.
  ── */
  const border =
    "border-[rgba(30,58,95,0.10)] dark:border-[rgba(59,130,246,0.13)]";
  const borderAcc =
    "border-[rgba(37,99,235,0.22)] dark:border-[rgba(59,130,246,0.28)]";
  const cardBg = "bg-white dark:bg-[#0f172a]";
  const card2Bg = "bg-[#e8eef7] dark:bg-[#1e293b]";
  const pageBg = "bg-[#f0f4f8] dark:bg-[#0a0f1e]";
  const acc10 = "bg-[rgba(37,99,235,0.10)] dark:bg-[rgba(59,130,246,0.13)]";
  const acc05 = "bg-[rgba(37,99,235,0.05)] dark:bg-[rgba(59,130,246,0.06)]";
  const fg = "text-[#0f1f3d] dark:text-[#e2e8f0]";
  const fgm = "text-[#4b6b9a] dark:text-[#94a3b8]";
  const fgd = "text-[#a8bcd4] dark:text-[#1e3a5f]";
  const accText = "text-[#2563eb] dark:text-[#3b82f6]";
  const shadowSm =
    "shadow-[0_1px_3px_rgba(30,58,95,0.07),0_4px_16px_rgba(30,58,95,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.25)]";

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        @keyframes up-slide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes up-fade  { from{opacity:0} to{opacity:1} }
        @keyframes up-pop   { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
        .up-slide { animation: up-slide .25s ease; }
        .up-fade  { animation: up-fade .18s ease; }
        .up-pop   { animation: up-pop .22s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      <div
        className={`font-[DM_Sans,-apple-system,BlinkMacSystemFont,sans-serif] text-[17px] antialiased min-h-screen p-7 ${pageBg} ${fg}`}
      >
        {/* header — now theme-aware, no hardcoded blue-50/blue-200 */}
        <div
          className={`relative overflow-hidden flex items-center justify-center gap-3 px-4 py-6 mb-4 border ${border} ${cardBg}`}
        >
          <div
            className={`absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl ${acc10}`}
          />

          <div
            className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border ${borderAcc} ${acc10}`}
          >
            <UploadCloud size={22} className={accText} />
          </div>

          <h2 className={`relative z-10 text-3xl font-bold ${accText}`}>
            Upload PCAPs &amp; Related Files
          </h2>
        </div>

        <div className="grid grid-cols-[256px_1fr] gap-[18px] items-start max-[860px]:grid-cols-1">
          {/* sidebar */}
          <div className={` p-5 border ${border} ${cardBg} ${shadowSm}`}>
            <div
              className={`text-xs uppercase tracking-[0.12em] font-semibold mb-[3px] ${fgm}`}
            >
              PCAP Dataset Management
            </div>
            <div
              className={`text-[1.05rem] font-semibold tracking-[-0.02em] mb-3 ${fg}`}
            >
              Select or create a dataset
            </div>

            <div className="flex flex-col gap-[3px] mb-3">
              {buckets.length === 0 ? (
                <div
                  className={`text-[0.9rem] text-center py-3.5 border border-dashed rounded-lg ${border} ${fgm}`}
                >
                  No datasets yet
                </div>
              ) : (
                buckets.map((b) => {
                  const on = activeBucket === b.name;
                  return (
                    <div
                      key={b.name}
                      role="button"
                      tabIndex={0}
                      className={`group w-full text-left px-2.5 py-2 rounded-[9px] border cursor-pointer text-[0.95rem] flex items-center justify-between transition-all tracking-[-0.01em]
                      ${
                        on
                          ? `${acc10} ${borderAcc} ${accText} font-medium`
                          : `border-transparent ${fgm} hover:${card2Bg} hover:${fg}`
                      }`}
                      onClick={() => setActiveBucket(b.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setActiveBucket(b.name);
                      }}
                    >
                      <span className="flex items-center min-w-0 flex-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full bg-current shrink-0 mr-2 ${on ? "opacity-100" : "opacity-35"}`}
                        />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {b.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-[5px] shrink-0">
                        <span className={`text-[0.8rem] opacity-65 ${fgm}`}>
                          {b.created
                            ? new Date(b.created).toLocaleDateString()
                            : "—"}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className={`inline-flex items-center justify-center w-[22px] h-[22px] border border-transparent rounded-[5px] bg-transparent opacity-35 group-hover:opacity-70 transition-all cursor-pointer ${fgm}
                          hover:!opacity-100 hover:text-[#dc2626] hover:border-[rgba(220,38,38,0.22)] hover:bg-[rgba(220,38,38,0.08)]
                          dark:hover:text-[#f87171] dark:hover:border-[rgba(248,113,113,0.25)] dark:hover:bg-[rgba(248,113,113,0.08)]`}
                          title={`Delete ${b.name}`}
                          onClick={(e) => confirmDeleteBucket(b.name, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              confirmDeleteBucket(b.name, e);
                          }}
                        >
                          <Trash2 size={11} />
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className={`flex gap-[7px] pt-3 border-t ${border}`}>
              <input
                className={`flex-1 rounded-lg px-2.5 py-[7px] text-[0.9rem] transition-colors border ${border} ${pageBg} ${fg} placeholder:${fgd} focus:outline-none focus:border-[#2563eb] dark:focus:border-[#3b82f6]`}
                type="text"
                placeholder="new-dataset-name"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createBucket()}
              />
              <button
                className="rounded-lg px-3.5 py-[7px] text-base font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={createBucket}
                disabled={isCreatingBucket}
              >
                {isCreatingBucket ? "…" : "+"}
              </button>
            </div>
          </div>

          {/* main */}
          <div
            className={` p-6 flex flex-col gap-[18px] border ${border} ${cardBg} ${shadowSm}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div
                className={`text-[1.15rem] font-semibold tracking-[-0.02em] ${fg}`}
              >
                {activeBucket || "No dataset selected"}
              </div>
              <div
                className={`inline-flex items-center gap-[7px] rounded-full px-3 py-[5px] text-[0.9rem] border ${border} ${pageBg} ${fgm}`}
              >
                <span
                  className={`w-[7px] h-[7px] rounded-full transition-colors ${
                    files.length > 0 || uploading
                      ? "bg-[#059669] shadow-[0_0_5px_#059669] dark:bg-[#00e5a0] dark:shadow-[0_0_5px_#00e5a0]"
                      : "bg-[#a8bcd4] dark:bg-[#1e3a5f]"
                  }`}
                />
                <span
                  className={`font-medium text-[0.92rem] tracking-[-0.01em] ${fg}`}
                >
                  {uploading
                    ? "Uploading…"
                    : files.length
                      ? `${files.length} file${files.length !== 1 ? "s" : ""}`
                      : "No files uploaded"}
                </span>
              </div>
            </div>

            {/* drop zone */}
            <div
              role="button"
              tabIndex={0}
              className={`relative overflow-hidden  px-6 py-[38px] text-center cursor-pointer transition-all border-[1.5px] border-dashed ${
                isDragOver
                  ? `border-[#2563eb] dark:border-[#3b82f6] ${acc05}`
                  : `${borderAcc} ${pageBg}`
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                fileInputRef.current?.click()
              }
            >
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.05)_0%,transparent_65%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.06)_0%,transparent_65%)]" />
              <div className={`mb-2.5 opacity-65 ${accText}`}>
                <UploadCloud size={34} />
              </div>
              <div
                className={`text-[1.05rem] font-semibold mb-1 tracking-[-0.02em] ${fg}`}
              >
                Drop files here to upload
              </div>
              <div className={`text-[1rem] ${fgm}`}>
                or{" "}
                <span className={`cursor-pointer hover:underline ${accText}`}>
                  browse files
                </span>
              </div>
              <div className={`text-[1rem] mt-1.5 ${fgd}`}>
                Accepted: .pcap, .pcapng, .tar, .zip, .rar, .log
                <br />{" "}
                <div className={`text-[1rem] ${accText}`}>
                  Maximum upload size: <strong>10 GB</strong>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pcap,.pcapng,.zip,.tar,.gz,.tgz,.bz2,.tbz2,.xz,.txz,.zst,.7z,.rar,.log"
                onChange={(e) => {
                  if (e.target.files?.length) uploadFiles(e.target.files);
                }}
              />
            </div>

            {/* progress */}
            {uploading && (
              <div
                className={`rounded-[10px] px-[15px] py-3 border ${border} ${pageBg}`}
              >
                <div className="flex justify-between mb-[7px] text-[0.9rem]">
                  <span className={fgm}>{progressLabel}</span>
                  <span className={`font-semibold ${accText}`}>
                    {progress}%
                  </span>
                </div>
                <div
                  className={`h-[3px] rounded overflow-hidden ${border} bg-[rgba(30,58,95,0.10)] dark:bg-[rgba(59,130,246,0.13)]`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] dark:from-[#0f172a] dark:to-[#3b82f6] transition-[width] duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* files table */}
            <div
              className={`rounded-xl overflow-hidden border ${border} ${cardBg}`}
            >
              <div
                className={`flex items-center justify-between px-[18px] py-3 border-b ${border} ${cardBg}`}
              >
                <div className="flex items-center">
                  <span
                    className={`text-base font-semibold tracking-[-0.01em] ${fg}`}
                  >
                    Uploaded Files
                  </span>
                  {files.length > 0 && (
                    <span
                      className={`text-[0.78rem] font-medium ml-[7px] px-2 py-[2px] rounded-[10px] ${acc10} ${accText}`}
                    >
                      {files.length}
                    </span>
                  )}
                </div>
                <button
                  className={`inline-flex items-center justify-center w-[30px] h-[30px] rounded-[7px] border transition-all ${border} ${card2Bg} ${fgm} hover:text-[#2563eb] hover:border-[#2563eb] dark:hover:text-[#3b82f6] dark:hover:border-[#3b82f6]`}
                  onClick={() => activeBucket && loadFiles(activeBucket)}
                  title="Refresh files"
                >
                  <RefreshCcw size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center py-12 px-6 gap-2.5">
                    <div
                      className={`w-[50px] h-[50px] rounded-[13px] mb-1 flex items-center justify-center border ${acc10} ${borderAcc} ${accText} opacity-75`}
                    >
                      <FileX size={22} />
                    </div>
                    <div
                      className={`text-base font-semibold tracking-[-0.01em] ${fg}`}
                    >
                      No files uploaded yet
                    </div>
                    <div
                      className={`text-[0.9rem] text-center max-w-[260px] leading-[1.55] ${fgm}`}
                    >
                      {activeBucket
                        ? `Drop files above to upload them to "${activeBucket}"`
                        : "Select a dataset first, then drop files to upload"}
                    </div>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-[0.95rem] table-fixed">
                    <colgroup>
                      <col className="w-[32%]" />
                      <col className="w-[11%]" />
                      <col className="w-[10%]" />
                      <col className="w-[22%]" />
                      <col className="w-[25%]" />
                    </colgroup>
                    <thead>
                      <tr className={`border-b ${border} ${pageBg}`}>
                        <th
                          className={`px-[18px] py-2.5 text-left text-[0.88rem] font-medium whitespace-nowrap ${fgm}`}
                        >
                          Name
                        </th>
                        <th
                          className={`px-[18px] py-2.5 text-left text-[0.88rem] font-medium whitespace-nowrap ${fgm}`}
                        >
                          Type
                        </th>
                        <th
                          className={`px-[18px] py-2.5 text-left text-[0.88rem] font-medium whitespace-nowrap ${fgm}`}
                        >
                          Size
                        </th>
                        <th
                          className={`px-[18px] py-2.5 text-left text-[0.88rem] font-medium whitespace-nowrap ${fgm}`}
                        >
                          Modified
                        </th>
                        <th
                          className={`px-[18px] py-2.5 text-right text-[0.88rem] font-medium whitespace-nowrap ${fgm}`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f) => {
                        const fileType = getFileType(f.key);
                        return (
                          <tr
                            key={f.key}
                            className={`border-b last:border-b-0 transition-colors hover:bg-[rgba(37,99,235,0.04)] dark:hover:bg-[rgba(59,130,246,0.06)] ${border}`}
                          >
                            {/* name */}
                            <td className="px-[18px] py-3 align-middle">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <FileIcon name={f.key} />
                                <span
                                  className={`text-[0.95rem] font-medium tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap ${fg}`}
                                  title={f.key}
                                >
                                  {f.key}
                                </span>
                              </div>
                            </td>
                            {/* type */}
                            <td className="px-[18px] py-3 align-middle">
                              <span
                                className={`text-[0.78rem] font-normal ${fgm}`}
                              >
                                {fileType.label}
                              </span>
                            </td>
                            {/* size */}
                            <td className="px-[18px] py-3 align-middle">
                              <span
                                className={`text-[0.92rem] tabular-nums ${fgm}`}
                              >
                                {formatSize(f.size)}
                              </span>
                            </td>
                            {/* modified */}
                            <td className="px-[18px] py-3 align-middle">
                              <span className={`text-[0.9rem] ${fgm}`}>
                                {f.last_modified
                                  ? new Date(f.last_modified).toLocaleString()
                                  : "—"}
                              </span>
                            </td>
                            {/* actions */}
                            <td className="px-[18px] py-3 align-middle text-right">
                              <div className="flex gap-1.5 items-center justify-end">
                                <button
                                  className="inline-flex items-center gap-[5px] px-3 py-[5px] rounded-[7px] text-[0.88rem] font-medium tracking-[-0.01em] transition-all border border-[rgba(37,99,235,0.22)] bg-[rgba(37,99,235,0.07)] text-[#2563eb] hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(37,99,235,0.10)]"
                                  onClick={() => downloadFile(f.key)}
                                >
                                  <Download size={12} /> Download
                                </button>
                                <button
                                  className="inline-flex items-center gap-[5px] px-3 py-[5px] rounded-[7px] text-[0.88rem] font-medium tracking-[-0.01em] transition-all border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] text-[#dc2626] hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(220,38,38,0.15)]"
                                  onClick={() => confirmDeleteFile(f.key)}
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* delete modal */}
        {deleteModal && (
          <div
            role="presentation"
            className="up-fade fixed inset-0 z-[500] bg-[rgba(15,31,63,0.48)] dark:bg-black/65 backdrop-blur-sm flex items-center justify-center"
            onClick={() => !isDeleting && setDeleteModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className={`up-pop rounded-2xl p-7 w-full max-w-[390px] border border-[rgba(220,38,38,0.22)] dark:border-[rgba(248,113,113,0.25)] shadow-[0_20px_48px_rgba(0,0,0,0.16),0_0_0_1px_rgba(220,38,38,0.15)] ${cardBg}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-[46px] h-[46px] rounded-[11px] mb-4 flex items-center justify-center border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] text-[#dc2626] dark:border-[rgba(248,113,113,0.25)] dark:bg-[rgba(248,113,113,0.08)] dark:text-[#f87171]">
                <Trash2 size={20} />
              </div>
              <div
                className={`text-[1.15rem] font-semibold mb-[7px] tracking-[-0.02em] ${fg}`}
              >
                Confirm Deletion
              </div>
              <div className={`text-[0.92rem] leading-[1.6] mb-[22px] ${fgm}`}>
                This action cannot be undone. You are about to permanently
                delete:
                <br />
                <span className="inline-block rounded-[5px] px-[7px] py-[3px] text-[0.75rem] font-semibold mt-[5px] break-all bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.15)] text-[#dc2626] dark:bg-[rgba(248,113,113,0.08)] dark:border-[rgba(248,113,113,0.15)] dark:text-[#f87171]">
                  {deleteModal.name}
                </span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className={`px-[17px] py-2 rounded-lg text-[0.92rem] font-medium tracking-[-0.01em] transition-all border ${border} ${card2Bg} ${fgm} hover:text-[#0f1f3d] hover:border-[#2563eb] dark:hover:text-[#e2e8f0] dark:hover:border-[#3b82f6]`}
                  onClick={() => setDeleteModal(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="px-[18px] py-2 rounded-lg text-[0.92rem] font-semibold tracking-[-0.01em] transition-all bg-[#dc2626] text-white shadow-[0_3px_9px_rgba(220,38,38,0.15)] hover:bg-[#b91c1c] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* toast */}
        {toast && (
          <div
            className={`up-slide fixed bottom-6 right-6 z-[1000] rounded-[10px] px-[15px] py-[11px] text-[0.92rem] flex items-center gap-[9px] max-w-[320px] font-normal tracking-[-0.01em] border ${
              toast.type === "error"
                ? "border-[rgba(220,38,38,0.35)]"
                : "border-[rgba(37,99,235,0.35)]"
            } bg-[#1e3a5f] text-[#dbeafe] dark:bg-[#0f172a] dark:text-[#e2e8f0] shadow-[0_4px_24px_rgba(30,58,95,0.09)] dark:shadow-[0_6px_28px_rgba(0,0,0,0.4)]`}
          >
            {toast.type === "success" ? (
              <CheckCircle
                size={14}
                className="text-[#059669] dark:text-[#00e5a0]"
              />
            ) : (
              <AlertCircle
                size={14}
                className="text-[#dc2626] dark:text-[#f87171]"
              />
            )}
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
