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
  downloadUrl: string;
}

export interface BooksPayload {
  total: number;
  data: Book[];
}

let cache: Promise<BooksPayload> | null = null;

export function fetchAllBooks(): Promise<BooksPayload> {
  if (!cache) {
    cache = fetch("/data/books.json")
      .then((r) => {
        if (!r.ok) throw new Error("books load failed");
        return r.json() as Promise<BooksPayload>;
      })
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
