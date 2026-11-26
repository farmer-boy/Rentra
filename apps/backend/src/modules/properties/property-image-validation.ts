import { BadRequestException } from '@nestjs/common';

export const PROPERTY_PHOTO_CATEGORIES = new Set([
  'EXTERIOR', 'MAIN_ROOM', 'KITCHEN', 'BATHROOM', 'BEDROOM', 'OTHER',
]);

export function inspectPropertyImage(buffer: Buffer, claimedMime: string) {
  let mimeType = '';
  let width = 0;
  let height = 0;
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    mimeType = 'image/png'; width = buffer.readUInt32BE(16); height = buffer.readUInt32BE(20);
  } else if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    mimeType = 'image/webp';
    const kind = buffer.toString('ascii', 12, 16);
    if (kind === 'VP8X') {
      width = 1 + buffer.readUIntLE(24, 3); height = 1 + buffer.readUIntLE(27, 3);
    } else if (kind === 'VP8 ') {
      const frame = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
      if (frame >= 0 && frame + 7 <= buffer.length) {
        width = buffer.readUInt16LE(frame + 3) & 0x3fff;
        height = buffer.readUInt16LE(frame + 5) & 0x3fff;
      }
    } else if (kind === 'VP8L' && buffer[20] === 0x2f) {
      const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
      width = 1 + b1 + ((b2 & 0x3f) << 8);
      height = 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10);
    }
  } else if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    mimeType = 'image/jpeg';
    let offset = 2;
    while (offset + 4 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      while (buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        height = buffer.readUInt16BE(offset + 3); width = buffer.readUInt16BE(offset + 5); break;
      }
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2) break;
      offset += segmentLength;
    }
  }
  if (!mimeType || claimedMime !== mimeType) throw new BadRequestException('Photos must be valid JPG, PNG, or WebP image files.');
  if (!width || !height || width < 720 || height < 720) throw new BadRequestException('Each photo must be at least 720 × 720 pixels.');
  return { mimeType, width, height };
}
