"use client";

import { useState } from "react";

export function QrDownloadButton({
  dataUrl,
  gymName,
}: {
  dataUrl: string;
  gymName: string;
}) {
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${gymName.replace(/\s+/g, "-").toLowerCase()}-checkin-qr.png`;
    link.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
    >
      {downloaded ? "Downloaded!" : "Download PNG"}
    </button>
  );
}

export function QrPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
    >
      Print
    </button>
  );
}
