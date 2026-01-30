import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import { generateLeads, type LeadRecord } from "@/lib/data";

type ColumnConfig = {
  key: keyof LeadRecord;
  header: string;
  width: number;
};

const columns: ColumnConfig[] = [
  { key: "Name", header: "Name", width: 80 },
  { key: "Full Address", header: "Full Address", width: 235 },
  { key: "Business No.", header: "Business No.", width: 70 },
  { key: "Mobile", header: "Mobile", width: 75 },
  { key: "Instagram", header: "Instagram", width: 95 },
  { key: "LinkedIn", header: "LinkedIn", width: 100 },
  { key: "Website", header: "Website", width: 90 },
  { key: "Target Area", header: "Target Area", width: 55 },
];

const pageWidth = 842; // A4 landscape width in points
const pageHeight = 595; // A4 landscape height in points
const marginTop = 70;
const marginBottom = 40;
const marginLeft = 21;
const tableWidth = columns.reduce((total, column) => total + column.width, 0);
const lineColor = rgb(0.73, 0.78, 0.93);
const headerColor = rgb(0.16, 0.21, 0.46);
const headerBorderColor = rgb(0.12, 0.16, 0.34);
const evenRowColor = rgb(0.95, 0.96, 1);
const bodyTextColor = rgb(0.12, 0.15, 0.32);

const breakWordToWidth = (
  word: string,
  maximumWidth: number,
  font: PDFFont,
  fontSize: number
) => {
  if (font.widthOfTextAtSize(word, fontSize) <= maximumWidth) {
    return [word];
  }

  const parts: string[] = [];
  let current = "";

  for (const char of word) {
    const test = current + char;
    if (font.widthOfTextAtSize(test, fontSize) <= maximumWidth) {
      current = test;
    } else {
      if (current) {
        parts.push(current);
      }
      current = char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
};

const wrapText = (
  text: string,
  maximumWidth: number,
  font: PDFFont,
  fontSize: number
) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const segments = breakWordToWidth(word, maximumWidth, font, fontSize);
    segments.forEach((segment, index) => {
      const candidate = currentLine
        ? `${currentLine} ${segment}`
        : segment;
      if (
        index === 0 &&
        font.widthOfTextAtSize(candidate, fontSize) <= maximumWidth
      ) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = segment;
      }
    });
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const createPdfBuffer = async (leads: LeadRecord[]) => {
  const pdfDocument = await PDFDocument.create();
  const regularFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
  const textFontSize = 9;
  const lineHeight = textFontSize + 2;
  let page = pdfDocument.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - marginTop;

  const addNewPage = () => {
    page = pdfDocument.addPage([pageWidth, pageHeight]);
    cursorY = pageHeight - marginTop;
  };

  const ensureSpace = (height: number, options: { header?: boolean } = {}) => {
    if (cursorY - height < marginBottom) {
      addNewPage();
      if (!options.header) {
        drawHeader();
      }
    }
  };

  const drawHeader = () => {
    const headerHeight = 28;
    ensureSpace(headerHeight, { header: true });
    cursorY -= headerHeight;

    let columnX = marginLeft;
    columns.forEach((column) => {
      page.drawRectangle({
        x: columnX,
        y: cursorY,
        width: column.width,
        height: headerHeight,
        color: headerColor,
        borderColor: headerBorderColor,
        borderWidth: 0.5,
      });

      const textY = cursorY + headerHeight - 12;
      page.drawText(column.header, {
        x: columnX + 6,
        y: textY - textFontSize,
        size: 10,
        font: boldFont,
        color: rgb(1, 1, 1),
        maxWidth: column.width - 12,
      });

      columnX += column.width;
    });
  };

  page.drawText("Tripura Hospitality Lead Database", {
    x: marginLeft,
    y: cursorY,
    size: 20,
    font: boldFont,
    color: bodyTextColor,
  });
  cursorY -= 26;

  page.drawText(
    "Client-ready dataset featuring 1,000 hospitality businesses across Tripura, India.",
    {
      x: marginLeft,
      y: cursorY,
      size: 11,
      font: regularFont,
      color: bodyTextColor,
      maxWidth: Math.min(520, tableWidth),
    }
  );
  cursorY -= 30;

  drawHeader();

  leads.forEach((lead, leadIndex) => {
    const cellLines = columns.map((column) =>
      wrapText(
        lead[column.key] ?? "N/A",
        column.width - 12,
        regularFont,
        textFontSize
      )
    );

    const rowHeight = Math.max(
      24,
      ...cellLines.map((lines) => lines.length * lineHeight + 8)
    );

    ensureSpace(rowHeight);
    cursorY -= rowHeight;

    let columnX = marginLeft;
    columns.forEach((column, columnIndex) => {
      page.drawRectangle({
        x: columnX,
        y: cursorY,
        width: column.width,
        height: rowHeight,
        color: leadIndex % 2 === 0 ? evenRowColor : undefined,
        borderColor: lineColor,
        borderWidth: 0.4,
      });

      const lines = cellLines[columnIndex];
      lines.forEach((line, lineIndex) => {
        const lineY =
          cursorY +
          rowHeight -
          6 -
          textFontSize -
          lineIndex * lineHeight;

        page.drawText(line, {
          x: columnX + 6,
          y: lineY,
          size: textFontSize,
          font: regularFont,
          color: bodyTextColor,
          maxWidth: column.width - 12,
        });
      });

      columnX += column.width;
    });
  });

  const pdfBytes = await pdfDocument.save();
  return Buffer.from(pdfBytes);
};

export const dynamic = "force-static";

export async function GET() {
  const leads = generateLeads(1000);
  const buffer = await createPdfBuffer(leads);
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="tripura-hospitality-leads.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
