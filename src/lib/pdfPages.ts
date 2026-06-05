import { pdfjs } from "react-pdf";
import { publishBookPages } from "./stats";

let workerSet = false;
function ensureWorker() {
  if (workerSet) return;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  workerSet = true;
}

const inflight = new Map<string, Promise<number | null>>();

/**
 * Quickly resolves the true page count of a PDF using HTTP Range requests.
 * Caches the result via publishBookPages (localStorage + RTDB).
 * Does NOT download the whole file — only the trailer/xref.
 */
export async function probePdfPageCount(
  bookId: string,
  url: string
): Promise<number | null> {
  if (typeof window === "undefined") return null;
  ensureWorker();

  if (inflight.has(bookId)) return inflight.get(bookId)!;

  const task = (async () => {
    try {
      const loadingTask = pdfjs.getDocument({
        url,
        disableAutoFetch: true,
        disableStream: false,
        rangeChunkSize: 32768,
      });
      const pdf = await loadingTask.promise;
      const n = pdf.numPages;
      try {
        pdf.destroy();
      } catch {}
      if (n > 0) {
        await publishBookPages(bookId, n);
        return n;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(bookId);
    }
  })();

  inflight.set(bookId, task);
  return task;
}
