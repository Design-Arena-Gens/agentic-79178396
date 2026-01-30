"use client";

import { useMemo, useState } from "react";
import type { LeadRecord } from "@/lib/data";

type LeadsTableProps = {
  leads: LeadRecord[];
};

const columns: Array<keyof LeadRecord> = [
  "Name",
  "Full Address",
  "Business No.",
  "Mobile",
  "Instagram",
  "LinkedIn",
  "Website",
  "Target Area",
];

const formatFileName = (extension: "xlsx" | "pdf") =>
  `tripura-ai-agency-leads.${extension}`;

const DownloadButtons = ({
  onDownload,
  downloading,
}: {
  onDownload: (type: "excel" | "pdf") => void;
  downloading: null | "excel" | "pdf";
}) => (
  <div className="download-actions">
    <button
      type="button"
      onClick={() => onDownload("excel")}
      className="primary"
      disabled={downloading === "excel"}
    >
      {downloading === "excel" ? "Generating Excel…" : "Download Excel"}
    </button>
    <button
      type="button"
      onClick={() => onDownload("pdf")}
      className="secondary"
      disabled={downloading === "pdf"}
    >
      {downloading === "pdf" ? "Rendering PDF…" : "Download PDF"}
    </button>
  </div>
);

const SummaryPanel = ({ leads }: { leads: LeadRecord[] }) => {
  const areaBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    leads.forEach((lead) => {
      counts.set(lead["Target Area"], (counts.get(lead["Target Area"]) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  return (
    <section className="summary">
      <div>
        <p className="summary-title">Total Records</p>
        <p className="summary-value">{leads.length}</p>
      </div>
      <div>
        <p className="summary-title">Target Areas</p>
        <ul>
          {areaBreakdown.map(([area, count]) => (
            <li key={area}>
              <span>{area}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  const [downloading, setDownloading] = useState<null | "excel" | "pdf">(null);

  const handleDownload = async (format: "excel" | "pdf") => {
    try {
      setDownloading(format);
      const response = await fetch(`/api/export/${format}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = formatFileName(format === "excel" ? "xlsx" : "pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Unable to download file. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="lead-table-wrapper">
      <header className="lead-table-header">
        <div>
          <h1>Tripura Hospitality Lead Database</h1>
          <p>Client-ready dataset for AI outreach initiatives in Tripura.</p>
        </div>
        <DownloadButtons onDownload={handleDownload} downloading={downloading} />
      </header>
      <SummaryPanel leads={leads} />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr key={`${lead.Name}-${index}`}>
                {columns.map((column) => (
                  <td key={column}>{lead[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
