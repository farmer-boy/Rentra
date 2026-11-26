import { BadRequestException } from '@nestjs/common';

type Box = { type: string; start: number; dataStart: number; end: number };

function readBoxes(buffer: Buffer, start: number, end: number): Box[] {
  const boxes: Box[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      const largeSize = buffer.readBigUInt64BE(offset + 8);
      if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(largeSize); header = 16;
    } else if (size === 0) size = end - offset;
    if (size < header || offset + size > end) break;
    boxes.push({ type, start: offset, dataStart: offset + header, end: offset + size });
    offset += size;
  }
  return boxes;
}

function children(buffer: Buffer, parent: Box) {
  return readBoxes(buffer, parent.dataStart, parent.end);
}

export function inspectMp4H264(buffer: Buffer) {
  if (buffer.length < 32 || buffer.toString('ascii', 4, 8) !== 'ftyp') {
    throw new BadRequestException('Video must be a valid MP4 file.');
  }
  const root = readBoxes(buffer, 0, buffer.length);
  const moov = root.find((box) => box.type === 'moov');
  const mvhd = moov && children(buffer, moov).find((box) => box.type === 'mvhd');
  if (!moov || !mvhd) throw new BadRequestException('The MP4 video metadata could not be read.');
  const version = buffer[mvhd.dataStart];
  const timeScaleOffset = mvhd.dataStart + (version === 1 ? 20 : 12);
  const durationOffset = mvhd.dataStart + (version === 1 ? 24 : 16);
  if (timeScaleOffset + 4 > mvhd.end) throw new BadRequestException('The video duration could not be read.');
  const timescale = buffer.readUInt32BE(timeScaleOffset);
  const durationUnits = version === 1
    ? Number(buffer.readBigUInt64BE(durationOffset))
    : buffer.readUInt32BE(durationOffset);
  const durationSeconds = durationUnits / timescale;
  let width = 0;
  let height = 0;
  let h264 = false;
  for (const track of children(buffer, moov).filter((box) => box.type === 'trak')) {
    const mdia = children(buffer, track).find((box) => box.type === 'mdia');
    if (!mdia) continue;
    const mediaChildren = children(buffer, mdia);
    const hdlr = mediaChildren.find((box) => box.type === 'hdlr');
    if (!hdlr || buffer.toString('ascii', hdlr.dataStart + 8, hdlr.dataStart + 12) !== 'vide') continue;
    const minf = mediaChildren.find((box) => box.type === 'minf');
    const stbl = minf && children(buffer, minf).find((box) => box.type === 'stbl');
    const stsd = stbl && children(buffer, stbl).find((box) => box.type === 'stsd');
    if (!stsd || stsd.dataStart + 8 > stsd.end) continue;
    const entries = readBoxes(buffer, stsd.dataStart + 8, stsd.end);
    const sample = entries[0];
    if (!sample) continue;
    h264 = sample.type === 'avc1' || sample.type === 'avc3';
    if (sample.start + 36 <= sample.end) {
      width = buffer.readUInt16BE(sample.start + 32);
      height = buffer.readUInt16BE(sample.start + 34);
    }
    break;
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds < 20 || durationSeconds > 90) {
    throw new BadRequestException('The property video must be between 20 and 90 seconds.');
  }
  if (!h264) throw new BadRequestException('The property video must use H.264 encoding.');
  if (width < 1280 || height < 720 || width > 1920 || height > 1080) {
    throw new BadRequestException('The video must be 720p or 1080p.');
  }
  return { durationSeconds, width, height, codec: 'H.264' as const };
}
