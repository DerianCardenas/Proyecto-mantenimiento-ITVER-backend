// ============================================================
// Tickets Import Service - Extrae datos de un PDF "Solicitud de
// Mantenimiento Correctivo" (formato ITVER) y arma una sugerencia
// de ticket. NO persiste: solo lee el PDF y devuelve campos.
// El técnico se vincula después (no viene en el formato).
// ============================================================

import { TicketPriority } from '../../types';

// pdfjs-dist (build legacy, CommonJS) para extraer texto en Node.
// Se tipa como `any` porque el subpath legacy no expone sus tipos.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib: any = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === 'string' ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
      .join('');
    fullText += pageText + '\n';
  }

  await doc.destroy();
  return fullText;
}

export interface ParsedSolicitud {
  folio: string | null;
  area: string | null;
  solicitante: string | null;
  fecha: string | null;
  categoria: string | null;
  descripcion: string | null;
}

export interface ImportTicketSuggestion {
  title: string;
  description: string;
  observations: string;
  priority: TicketPriority;
  parsed: ParsedSolicitud;
}

function cleanup(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.replace(/\s+/g, ' ').trim();
  return v.length ? v : null;
}

function matchField(text: string, label: RegExp): string | null {
  const m = text.match(label);
  return m ? cleanup(m[1]) : null;
}

const CATEGORIAS = ['Recursos Materiales y Servicios', 'Mantenimiento de Equipo', 'Centro de Cómputo'];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Detecta cuál casilla de categoría quedó marcada con "X" (best-effort:
// el layout tabular del PDF no siempre conserva la posición exacta).
function detectCategoria(text: string): string | null {
  for (const categoria of CATEGORIAS) {
    const re = new RegExp(escapeRegExp(categoria) + '\\s+X\\b', 'i');
    if (re.test(text)) return categoria;
  }
  return null;
}

function parseFields(text: string): ParsedSolicitud {
  const descripcionMatch = text.match(
    /Descripci[oó]n\s+del\s+servicio[^:\n]*:\s*([\s\S]*?)(?:C\.?\s*c\.?\s*p\.?|$)/i
  );

  return {
    folio: matchField(text, /Folio\s*:\s*([^\n]+)/i),
    area: matchField(text, /[ÁA]rea\s+Solicitante\s*:\s*([^\n]+)/i),
    solicitante: matchField(text, /Nombre\s+y\s+Firma\s+Solicitante\s*:\s*([^\n]+)/i),
    fecha: matchField(text, /Fecha\s+de\s+Elaboraci[oó]n\s*:\s*([^\n]+)/i),
    categoria: detectCategoria(text),
    descripcion: descripcionMatch ? cleanup(descripcionMatch[1]) : null,
  };
}

function buildTitle(parsed: ParsedSolicitud): string {
  const parts: string[] = [];
  if (parsed.folio) parts.push(`Solicitud ${parsed.folio}`);
  if (parsed.categoria) parts.push(parsed.categoria);
  else if (parsed.area) parts.push(parsed.area);

  const title = parts.join(' — ').trim();
  if (title.length >= 3) return title.slice(0, 200);
  return 'Solicitud de mantenimiento correctivo';
}

function buildObservations(parsed: ParsedSolicitud): string {
  const lines: string[] = [];
  if (parsed.folio) lines.push(`Folio: ${parsed.folio}`);
  if (parsed.area) lines.push(`Área solicitante: ${parsed.area}`);
  if (parsed.solicitante) lines.push(`Solicitante: ${parsed.solicitante}`);
  if (parsed.fecha) lines.push(`Fecha de elaboración: ${parsed.fecha}`);
  if (parsed.categoria) lines.push(`Categoría: ${parsed.categoria}`);
  if (lines.length) lines.unshift('Importado desde PDF de solicitud:');
  return lines.join('\n');
}

export async function parseSolicitudPdf(buffer: Buffer): Promise<ImportTicketSuggestion> {
  const text = await extractText(buffer);
  const parsed = parseFields(text);

  return {
    title: buildTitle(parsed),
    description: parsed.descripcion ?? '',
    observations: buildObservations(parsed),
    priority: 'medium',
    parsed,
  };
}
