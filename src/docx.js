// Read the text of a Word .docx file on this device. A .docx is a zip; the text lives in word/document.xml.
// No library: the zip directory is parsed by hand and the entry is inflated with the browser's DecompressionStream.

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function zipEntry(buf, wanted) {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a zip file");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let k = 0; k < count; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    if (name === wanted) {
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      return { method, data: new Uint8Array(buf, start, size) };
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("No document text found");
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" };
const unescape = (s) => s.replace(/&(amp|lt|gt|quot|apos|#(\d+)|#x([0-9a-f]+));/gi, (m, n, d, h) => ENT[n] || String.fromCodePoint(d ? Number(d) : parseInt(h, 16)));

// Returns one string per paragraph or table row, like pdfText does for PDF rows.
export async function docxText(buffer) {
  const e = zipEntry(buffer, "word/document.xml");
  const bytes = e.method === 8 ? await inflateRaw(e.data) : e.data;
  const xml = new TextDecoder().decode(bytes);
  const rows = [];
  for (const block of xml.split(/<\/w:p>|<\/w:tr>/)) {
    const text = block
      .replace(/<w:tab\/>|<w:br\/>|<\/w:tc>/g, "<w:t> </w:t>")
      .match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g);
    if (!text) continue;
    const line = unescape(text.map((t) => t.replace(/<[^>]+>/g, "")).join("")).replace(/\s+/g, " ").trim();
    if (line) rows.push(line);
  }
  return rows;
}
