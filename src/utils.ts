export function hex2float(hexNum: string): number {
  const bytes = new Uint8Array(hexNum.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const bits = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const sign = bits >>> 31 == 0 ? 1.0 : -1.0;
  const e = (bits >>> 23) & 0xff;
  const m = e == 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  const f = sign * m * Math.pow(2, e - 150);

  return Number(f.toFixed(2));
}
