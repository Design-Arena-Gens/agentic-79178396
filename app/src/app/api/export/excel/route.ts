import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { generateLeads } from "@/lib/data";

const columns = [
  "Name",
  "Full Address",
  "Business No.",
  "Mobile",
  "Instagram",
  "LinkedIn",
  "Website",
  "Target Area",
] as const;

export const dynamic = "force-static";

export async function GET() {
  const leads = generateLeads(1000);
  const headerRow = [...columns];
  const worksheetData = [
    headerRow,
    ...leads.map((lead) => headerRow.map((column) => lead[column])),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 75 },
    { wch: 22 },
    { wch: 22 },
    { wch: 38 },
    { wch: 40 },
    { wch: 36 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tripura Leads");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="tripura-hospitality-leads.xlsx"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
