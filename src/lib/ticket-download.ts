import { toCanvas } from "html-to-image";

const SCALE = 3;

async function renderTicket(element: HTMLElement) {
  const options = { pixelRatio: SCALE, cacheBust: true, backgroundColor: "#ffffff" };
  // Safari can drop images on the first pass; the second render is reliable.
  await toCanvas(element, options);
  return toCanvas(element, options);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not render ticket"))),
      type,
      quality,
    ),
  );
}

/** One-page PDF, sized to the ticket, containing the rendered ticket as a JPEG. */
async function jpegToPdf(jpeg: Blob, pixelWidth: number, pixelHeight: number) {
  const image = new Uint8Array(await jpeg.arrayBuffer());
  const width = ((pixelWidth / SCALE) * 0.75).toFixed(2);
  const height = ((pixelHeight / SCALE) * 0.75).toFixed(2);
  const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (body: string) => {
    offsets.push(length);
    push(`${offsets.length} 0 obj\n${body}\nendobj\n`);
  };

  push("%PDF-1.4\n");
  object("<< /Type /Catalog /Pages 2 0 R >>");
  object("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] ` +
      "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
  );
  offsets.push(length);
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
  );
  push(image);
  push("\nendstream\nendobj\n");
  object(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xrefStart = length;
  push(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

/** Saves exactly the ticket element (no page, no margins) as a PNG image or a PDF. */
export async function downloadTicket(
  element: HTMLElement,
  format: "png" | "pdf",
  ticketNumber: string,
) {
  const canvas = await renderTicket(element);
  const name = `${ticketNumber}-met-gala-ticket`;
  if (format === "png") {
    triggerDownload(await canvasToBlob(canvas, "image/png"), `${name}.png`);
    return;
  }
  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.95);
  triggerDownload(await jpegToPdf(jpeg, canvas.width, canvas.height), `${name}.pdf`);
}
