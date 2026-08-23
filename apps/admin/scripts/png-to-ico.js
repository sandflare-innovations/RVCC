/**
 * Pack one or more PNG buffers into a .ico file (PNG-encoded ICO, Vista+).
 */
function pngToIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  const payloads = [];
  let offset = 6 + 16 * count;

  for (const { buf, width, height } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...payloads]);
}

module.exports = { pngToIco };
