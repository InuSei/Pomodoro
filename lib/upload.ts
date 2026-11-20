// Browser-only helpers for flashcard uploads.

const MAX_SIDE = 2000; // px: still crisp for handwriting, far smaller than a raw phone photo

/**
 * Gets a picked file ready to upload: labels HEIC photos (Windows browsers often report them with no type) and
 * shrinks big JPG/PNG/WebP photos to a ≤2000px JPEG so several fit under the 4 MB limit. PDFs pass through.
 */
export async function prepareUpload(file: File): Promise<File> {
  if (!file.type && /\.(heic|heif)$/i.test(file.name)) return new File([file], file.name, { type: "image/heic" });
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // unreadable here; the server's checks still apply
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1_000_000) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // JPEG has no transparency; keep see-through PNGs readable
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

// pdf-lib (~0.5 MB) is loaded only when a PDF is actually picked.
const loadPdf = async (file: File) => (await import("pdf-lib")).PDFDocument.load(await file.arrayBuffer());

export async function pdfPageCount(file: File) {
  return (await loadPdf(file)).getPageCount();
}

/** A new PDF with only the given 0-based pages; handwriting, highlights and images come along. */
export async function cutPdf(file: File, pageIndexes: number[]) {
  const { PDFDocument } = await import("pdf-lib");
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  for (const page of await out.copyPages(src, pageIndexes)) out.addPage(page);
  const bytes = await out.save();
  return new File([new Uint8Array(bytes)], file.name, { type: "application/pdf" });
}
