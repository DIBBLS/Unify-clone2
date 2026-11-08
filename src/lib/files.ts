/* Turning an uploaded class list into a table or text. Each reader is loaded only when that kind of file arrives. */
import { linesFromPdfItems, looksLikeMatric, trimToTable } from './classList';

export type ReadResult = { kind: 'table'; matrix: unknown[][]; note: string } | { kind: 'text'; text: string; note: string };

const ext = (name: string) => name.toLowerCase().split('.').pop() ?? '';
export const ACCEPT = '.xlsx,.xls,.csv,.ods,.docx,.pdf,.txt';
const MAX_BYTES = 10 * 1024 * 1024;

const matricCount = (m: unknown[][]) => m.reduce<number>((n, r) => n + r.filter(looksLikeMatric).length, 0);

export async function readClassListFile(file: File): Promise<ReadResult> {
  if (file.size > MAX_BYTES) throw new Error('That file is over 10 MB. Save just the class list and try again.');
  const e = ext(file.name);
  if (['xlsx', 'xls', 'csv', 'ods'].includes(e)) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    // Use the sheet with the most matric numbers on it (lists often sit on Sheet 2).
    let best: { name: string; matrix: unknown[][]; score: number } | null = null;
    for (const name of wb.SheetNames) {
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: '', blankrows: false });
      const score = matricCount(matrix);
      if (!best || score > best.score) best = { name, matrix, score };
    }
    if (!best || best.matrix.length === 0) throw new Error('That file looks empty.');
    return { kind: 'table', matrix: trimToTable(best.matrix), note: wb.SheetNames.length > 1 ? `from sheet "${best.name}"` : '' };
  }
  if (e === 'docx') {
    const mammoth = await import('mammoth');
    const buf = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tables = [...doc.querySelectorAll('table')].map((t) => [...t.querySelectorAll('tr')].map((tr) => [...tr.querySelectorAll('td,th')].map((c) => c.textContent ?? '')));
    const table = tables.sort((a, b) => matricCount(b) - matricCount(a))[0];
    if (table && matricCount(table) > 0) return { kind: 'table', matrix: trimToTable(table), note: tables.length > 1 ? 'from the biggest table in the document' : '' };
    const { value: text } = await mammoth.extractRawText({ arrayBuffer: buf });
    return { kind: 'text', text, note: '' };
  }
  if (e === 'pdf') {
    // The legacy build runs on older phones too (the modern one needs Chrome 119+ / Safari 17.4+).
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const lines: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const content = await (await pdf.getPage(p)).getTextContent();
      const items = (content.items as { str?: string; transform?: number[] }[])
        .filter((i) => typeof i.str === 'string' && i.transform)
        .map((i) => ({ str: i.str as string, x: i.transform![4], y: i.transform![5] }));
      lines.push(...linesFromPdfItems(items));
    }
    if (lines.length === 0) throw new Error('No text found in that PDF. If it is a scan, ask the department for the Excel or Word version.');
    return { kind: 'text', text: lines.join('\n'), note: `${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}` };
  }
  if (e === 'txt') return { kind: 'text', text: await file.text(), note: '' };
  if (e === 'doc') throw new Error('Old Word files (.doc) can\'t be read. Open it in Word and save it as .docx or PDF.');
  throw new Error('Upload an Excel, CSV, Word (.docx) or PDF file.');
}

export async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([['SURNAME', 'FIRST NAME', 'MIDDLE NAME', 'MATRIC NO'], ['OLOTUCHE', 'Joshua', 'Oluwaseun', '220801234']]);
  ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Class list');
  XLSX.writeFile(wb, 'Unify class list template.xlsx');
}
