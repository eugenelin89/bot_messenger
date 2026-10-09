import { inflateSync, crc32 } from 'node:zlib';
import type { ContentType } from '../../contracts/investment/v1/types.js';
import { checkPublicStrings, parseJson, requireContract as need, safeText, sha256 } from './schema.js';
import type { StagedContent } from './publication.js';
function csvCells(text: string): string[] {
  const cells: string[] = []; let cell = '', quoted = false, closed = false;
  for (let n = 0; n < text.length; n++) {
    const c = text[n]!;
    if (quoted) {
      if (c === '"' && text[n + 1] === '"') { cell += '"'; n++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === '"') { need(cell === '' && !closed, 'UNSUPPORTED_MEDIA'); quoted = true; }
    else if (c === ',' || c === '\n' || c === '\r') {
      cells.push(cell); cell = ''; closed = false;
      if (c === '\r' && text[n + 1] === '\n') n++;
    } else { need(!closed, 'UNSUPPORTED_MEDIA'); cell += c; }
  }
  need(!quoted, 'UNSUPPORTED_MEDIA'); cells.push(cell); return cells;
}
function normalizedPng(bytes: Buffer): void {
  need(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'UNSUPPORTED_MEDIA');
  let offset = 8, width = 0, height = 0, ended = false; const data: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const size = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    need(size <= 4194304 && offset + size + 12 <= bytes.length && !ended, 'UNSUPPORTED_MEDIA');
    const chunk = bytes.subarray(offset + 8, offset + 8 + size);
    need(crc32(bytes.subarray(offset + 4, offset + 8 + size)) === bytes.readUInt32BE(offset + 8 + size), 'UNSUPPORTED_MEDIA');
    if (type === 'IHDR') {
      need(offset === 8 && size === 13, 'UNSUPPORTED_MEDIA'); width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
      need(width > 0 && height > 0 && width <= 2048 && height <= 2048 && width * height <= 4194304, 'TOO_LARGE');
      need(chunk.subarray(8).equals(Buffer.from([8,6,0,0,0])), 'UNSUPPORTED_MEDIA');
    } else if (type === 'IDAT') { need(width > 0, 'UNSUPPORTED_MEDIA'); data.push(chunk); }
    else if (type === 'IEND') { need(size === 0 && data.length > 0, 'UNSUPPORTED_MEDIA'); ended = true; }
    else need(false, 'UNSUPPORTED_MEDIA'); // No metadata, animation, profiles, embedded text or active formats.
    offset += size + 12;
  }
  need(ended && offset === bytes.length, 'UNSUPPORTED_MEDIA');
  const expected = height * (1 + width * 4);
  let pixels: Buffer;
  try { pixels = inflateSync(Buffer.concat(data), { maxOutputLength: expected }); }
  catch { need(false, 'UNSUPPORTED_MEDIA'); }
  need(pixels.length === expected, 'UNSUPPORTED_MEDIA');
  for (let row = 0; row < height; row++) need(pixels[row * (1 + width * 4)] === 0, 'UNSUPPORTED_MEDIA');
}
export function checkContent(bytes: Buffer, type: ContentType, expectedHash: string): StagedContent {
  need(['text/plain','text/markdown','application/json','text/csv','image/png'].includes(type), 'UNSUPPORTED_MEDIA');
  need(bytes.length > 0 && bytes.length <= (type === 'image/png' ? 4194304 : 131072), 'TOO_LARGE');
  need(sha256(bytes) === expectedHash, 'CONFLICT');
  if (type === 'image/png') normalizedPng(bytes);
  else {
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { need(false, 'UNSUPPORTED_MEDIA'); }
    safeText(text!);
    if (type === 'application/json') checkPublicStrings(parseJson(bytes, 131072));
    if (type === 'text/csv') for (const cell of csvCells(text!)) need(!/^[\s]*[=+\-@]/.test(cell), 'UNSUPPORTED_MEDIA');
  }
  return { sha256: expectedHash, contentType: type, sizeBytes: bytes.length };
}
