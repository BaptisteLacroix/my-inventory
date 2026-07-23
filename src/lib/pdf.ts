import jsPDF from 'jspdf';
import type { Room } from '../state/types';
import { FIELDS, itemTitle } from './fields';
import { parsePrice, fmtEuro } from './price';
import { getInventoryPaths } from './inventoryFile';
import { readFile, join } from './storage';

const ACCENT_RGB: [number, number, number] = [47, 125, 110];

export interface FlatItem {
  roomName: string;
  title: string;
  photoDataUrl: string | null;
  fields: { label: string; value: string }[];
}

export interface PrintMeta {
  dateStr: string;
  roomCount: number;
  itemCount: number;
  totalStr: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function printMeta(rooms: Room[]): PrintMeta {
  let itemCount = 0;
  let total = 0;
  rooms.forEach((r) =>
    r.items.forEach((it) => {
      itemCount++;
      total += parsePrice(it.fields.prix);
    }),
  );
  return {
    dateStr: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    roomCount: rooms.length,
    itemCount,
    totalStr: fmtEuro(total),
  };
}

/** Flattens rooms into print-ready items, reading each photo file and inlining it as a base64 data URL for jsPDF's addImage(). */
export async function flatItems(rooms: Room[]): Promise<FlatItem[]> {
  const { imagesDir } = await getInventoryPaths();
  const out: FlatItem[] = [];
  for (const room of rooms) {
    for (const it of room.items) {
      const fields = FIELDS.filter((fd) => (it.fields[fd.key] ?? '').trim()).map((fd) => ({
        label: fd.label,
        value: (it.fields[fd.key] ?? '').toString(),
      }));
      let photoDataUrl: string | null = null;
      if (it.photoFile) {
        try {
          const path = await join(imagesDir, it.photoFile);
          const bytes = await readFile(path);
          photoDataUrl = `data:image/jpeg;base64,${bytesToBase64(bytes)}`;
        } catch {
          photoDataUrl = null;
        }
      }
      out.push({ roomName: room.name, title: itemTitle(it), photoDataUrl, fields });
    }
  }
  return out;
}

export interface GeneratedPdf {
  blob: Blob;
  pageCount: number;
}

/**
 * Pure layout/pagination logic, ported ~verbatim from the mockup's generatePDF(): cover page + one page
 * per item, breaking to a new page mid-item when the field table runs past PH-M-14. Takes already-flattened
 * data (no Tauri file I/O) so the pagination math can be unit-tested without a Tauri runtime.
 */
export function buildPdfFromFlatItems(items: FlatItem[], meta: PrintMeta): GeneratedPdf {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const PW = 210;
  const PH = 297;
  const M = 16;
  const cx = PW / 2;
  const [ar, ag, ab] = ACCENT_RGB;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(138, 128, 115);
  doc.setFontSize(11);
  doc.text("INVENTAIRE POUR L'ASSURANCE", cx, 118, { align: 'center' });
  doc.setTextColor(42, 38, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('Liste de mes objets', cx, 138, { align: 'center' });
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.8);
  doc.line(cx - 24, 146, cx + 24, 146);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(92, 83, 70);
  doc.text(meta.dateStr, cx, 166, { align: 'center' });
  doc.text(`${meta.roomCount} pièce(s) · ${meta.itemCount} objet(s)`, cx, 176, { align: 'center' });
  doc.text(`Valeur totale estimée : ${meta.totalStr}`, cx, 186, { align: 'center' });

  for (const it of items) {
    doc.addPage();
    let y = M + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(138, 128, 115);
    doc.text((it.roomName || '').toUpperCase(), M, y);
    doc.setDrawColor(221, 212, 196);
    doc.setLineWidth(0.3);
    doc.line(M, y + 3, PW - M, y + 3);
    y += 13;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(42, 38, 32);
    doc.text(it.title, M, y);
    y += 8;

    if (it.photoDataUrl) {
      try {
        const pr = doc.getImageProperties(it.photoDataUrl);
        const maxW = PW - 2 * M;
        const maxH = 125;
        const r = Math.min(maxW / pr.width, maxH / pr.height);
        const w = pr.width * r;
        const h = pr.height * r;
        const ix = cx - w / 2;
        y += 4;
        doc.addImage(it.photoDataUrl, 'JPEG', ix, y, w, h);
        y += h + 10;
      } catch {
        y += 6;
      }
    }

    if (it.fields.length) {
      doc.setFontSize(12);
      for (const f of it.fields) {
        if (y > PH - M - 14) {
          doc.addPage();
          y = M + 6;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(92, 83, 70);
        doc.text(f.label, M, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(42, 38, 32);
        const lines = doc.splitTextToSize(f.value, PW - M - 72);
        doc.text(lines, 72, y);
        const rowH = Math.max(8, lines.length * 6);
        doc.setDrawColor(238, 230, 216);
        doc.setLineWidth(0.2);
        doc.line(M, y + rowH - 3, PW - M, y + rowH - 3);
        y += rowH + 2;
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(169, 146, 122);
      doc.text('Aucune information renseignée pour cet objet.', M, y);
    }
  }

  return { blob: doc.output('blob'), pageCount: doc.getNumberOfPages() };
}

/** Reads the current inventory's rooms/photos from disk and builds the full PDF. */
export async function generatePDF(rooms: Room[]): Promise<GeneratedPdf> {
  const items = await flatItems(rooms);
  return buildPdfFromFlatItems(items, printMeta(rooms));
}
