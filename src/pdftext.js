// Reads the text of a simple PDF in the browser. Nothing is uploaded: the file never leaves this device.
// Handles ASCII85 and Flate streams and the common text operators. Rotated text (watermarks) is skipped.

function ascii85(bytes) {
  const s = new TextDecoder("latin1").decode(bytes).replace(/\s+/g, "").replace(/^<~/, "").replace(/~>.*$/, "");
  const out = [];
  let group = [];
  for (const ch of s) {
    if (ch === "z" && group.length === 0) { out.push(0, 0, 0, 0); continue; }
    group.push(ch.charCodeAt(0) - 33);
    if (group.length === 5) {
      let v = 0;
      for (const g of group) v = v * 85 + g;
      out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
      group = [];
    }
  }
  if (group.length) {
    const n = group.length;
    while (group.length < 5) group.push(84);
    let v = 0;
    for (const g of group) v = v * 85 + g;
    const b = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
    out.push(...b.slice(0, n - 1));
  }
  return new Uint8Array(out);
}

async function inflate(bytes) {
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findStreams(buf) {
  const text = new TextDecoder("latin1").decode(buf);
  const found = [];
  const re = /<<([^]*?)>>\s*stream\r?\n/g;
  let m;
  while ((m = re.exec(text))) {
    const dict = m[1];
    const start = m.index + m[0].length;
    const end = text.indexOf("endstream", start);
    if (end < 0) break;
    let stop = end;
    while (stop > start && (text[stop - 1] === "\n" || text[stop - 1] === "\r")) stop -= 1;
    const filters = (dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/) || [, ""])[1];
    found.push({ filters, bytes: buf.slice(start, stop) });
    re.lastIndex = end;
  }
  return found;
}

function readString(src, i) {
  let depth = 1;
  let out = "";
  i += 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === "\\") {
      const n = src[i + 1];
      const map = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
      if (map[n] !== undefined) { out += map[n]; i += 2; continue; }
      if (/[0-7]/.test(n)) { const oct = src.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)[0]; out += String.fromCharCode(parseInt(oct, 8)); i += 1 + oct.length; continue; }
      i += 2; continue;
    }
    if (c === "(") depth += 1;
    if (c === ")") { depth -= 1; if (depth === 0) break; }
    out += c;
    i += 1;
  }
  return [out, i + 1];
}

// Turns one content stream into positioned text pieces.
function pieces(src) {
  const items = [];
  const stack = [];
  let tm = [1, 0, 0, 1, 0, 0];
  let line = [0, 0];
  let leading = 0;
  let i = 0;
  const show = (t) => { if (tm[1] === 0 && tm[2] === 0 && t.trim()) items.push({ x: line[0], y: line[1], t }); };
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === "(") { const [s, j] = readString(src, i); stack.push(s); i = j; continue; }
    if (c === "[") { stack.push("["); i += 1; continue; }
    if (c === "]") { const arr = []; while (stack.length && stack[stack.length - 1] !== "[") arr.unshift(stack.pop()); stack.pop(); stack.push({ arr }); i += 1; continue; }
    if (c === "<" && src[i + 1] === "<") { i = src.indexOf(">>", i) + 2; continue; }
    if (c === "<") { const j = src.indexOf(">", i); const hex = src.slice(i + 1, j).replace(/\s/g, ""); let s = ""; for (let k = 0; k < hex.length; k += 2) s += String.fromCharCode(parseInt(hex.slice(k, k + 2), 16)); stack.push(s); i = j + 1; continue; }
    if (c === "/") { const m = src.slice(i).match(/^\/[^\s/<>[\]()]+/); stack.push(m[0]); i += m[0].length; continue; }
    if (c === "%") { while (i < src.length && src[i] !== "\n") i += 1; continue; }
    const m = src.slice(i).match(/^[^\s/<>[\]()%]+/);
    if (!m) { i += 1; continue; }
    const tok = m[0];
    i += tok.length;
    if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(tok)) { stack.push(Number(tok)); continue; }
    const nums = () => stack.filter((x) => typeof x === "number");
    switch (tok) {
      case "BT": tm = [1, 0, 0, 1, 0, 0]; line = [0, 0]; break;
      case "Tm": { const n = nums().slice(-6); tm = n; line = [n[4], n[5]]; break; }
      case "Td": { const n = nums().slice(-2); line = [line[0] + n[0], line[1] + n[1]]; break; }
      case "TD": { const n = nums().slice(-2); leading = -n[1]; line = [line[0] + n[0], line[1] + n[1]]; break; }
      case "TL": { leading = nums().slice(-1)[0]; break; }
      case "T*": line = [line[0], line[1] - leading]; break;
      case "Tj": show(String(stack[stack.length - 1] ?? "")); break;
      case "'": line = [line[0], line[1] - leading]; show(String(stack[stack.length - 1] ?? "")); break;
      case "TJ": { const a = stack[stack.length - 1]; if (a && a.arr) show(a.arr.filter((x) => typeof x === "string").join("")); break; }
      default: break;
    }
    stack.length = 0;
  }
  return items;
}

// Returns the PDF's text as lines, top to bottom, left to right.
export async function pdfText(buffer) {
  const buf = new Uint8Array(buffer);
  const all = [];
  for (const s of findStreams(buf)) {
    let bytes = s.bytes;
    try {
      if (/ASCII85Decode/.test(s.filters)) bytes = ascii85(bytes);
      if (/FlateDecode/.test(s.filters)) bytes = await inflate(bytes);
      else if (s.filters && !/ASCII85Decode/.test(s.filters)) continue;
    } catch { continue; }
    const src = new TextDecoder("latin1").decode(bytes);
    if (!/\bBT\b/.test(src)) continue;
    all.push(...pieces(src));
  }
  const rows = [];
  for (const it of all.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r.y - it.y) < 3);
    if (row) row.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  return rows.sort((a, b) => b.y - a.y).map((r) => r.items.sort((a, b) => a.x - b.x).map((p) => p.t).join("  ").replace(/\s+/g, " ").trim()).filter(Boolean);
}
