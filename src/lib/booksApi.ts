export interface Book {
  id: string;
  _id: string;
  titleSlug: string;
  title: string;
  author?: string;
  publisher?: string;
  language?: string;
  genre?: string[];
  subject?: string[];
  shortDescription?: string;
  description?: string;
  tags?: string[];
  totalPages?: number;
  yearPublished?: number;
  difficulty?: string;
  examRelevance?: string[];
  isFeatured?: boolean;
  thumbnailUrl?: string;
  downloadCount?: number;
  viewCount?: number;
  compressedSizeBytes?: number;
  createdAt?: string;
  /** Direct R2-backed download URL (old books). Derive upstream hex ID from this. */
  downloadUrl?: string;
}

export interface BooksPayload {
  total: number;
  data: Book[];
}

let cache: Promise<BooksPayload> | null = null;

function normalizeBooksPayload(payload: BooksPayload): BooksPayload {
  const seen = new Set<string>();
  const books = payload.data.filter((book) => {
    if (!book.downloadUrl) return false;
    const key = book.downloadUrl || book._id || book.id || book.titleSlug || book.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { total: books.length, data: books };
}

export function fetchAllBooks(): Promise<BooksPayload> {
  if (!cache) {
    cache = fetch("/data/books.json")
      .then((r) => {
        if (!r.ok) throw new Error("books load failed");
        return r.json() as Promise<BooksPayload>;
      })
      .then(normalizeBooksPayload)
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export function formatBytes(n?: number): string {
  if (!n || n <= 0) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${u[i]}`;
}
