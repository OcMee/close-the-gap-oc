import test from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { docxText } from "../src/docx.js";

// Build a minimal .docx (a zip with word/document.xml) in memory.
function zip(name, content, compress) {
  const nameB = Buffer.from(name);
  const raw = Buffer.from(content);
  const data = compress ? deflateRawSync(raw) : raw;
  const method = compress ? 8 : 0;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(method, 8);
  local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameB.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(method, 10);
  central.writeUInt32LE(data.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(nameB.length, 28); central.writeUInt32LE(0, 42);
  const cdStart = 30 + nameB.length + data.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(46 + nameB.length, 12); end.writeUInt32LE(cdStart, 16);
  const all = Buffer.concat([local, nameB, data, central, nameB, end]);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength);
}
const XML = '<w:document><w:body><w:p><w:r><w:t>EARNINGS STATEMENT</w:t></w:r></w:p><w:p><w:r><w:t>NET PAY</w:t></w:r><w:r><w:tab/><w:t xml:space="preserve">$2,100 &amp; more</w:t></w:r></w:p></w:body></w:document>';

test("docx: reads paragraphs from a compressed Word file", async () => {
  assert.deepEqual(await docxText(zip("word/document.xml", XML, true)), ["EARNINGS STATEMENT", "NET PAY $2,100 & more"]);
});
test("docx: reads a stored (uncompressed) entry and rejects non-zip files", async () => {
  assert.equal((await docxText(zip("word/document.xml", XML, false)))[0], "EARNINGS STATEMENT");
  await assert.rejects(() => docxText(new ArrayBuffer(40)));
});
