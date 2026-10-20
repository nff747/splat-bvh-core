/**
 * Expands a 10-bit integer into 30 bits by inserting 2 zeros after each bit.
 */
export function expandBits(v: number): number {
  let x = (v & 0x000003ff) >>> 0;
  x = ((x | (x << 16)) & 0x030000ff) >>> 0;
  x = ((x | (x << 8)) & 0x0300f00f) >>> 0;
  x = ((x | (x << 4)) & 0x030c30c3) >>> 0;
  x = ((x | (x << 2)) & 0x09249249) >>> 0;
  return x;
}

/**
 * Calculates a 30-bit Morton code for a 3D position inside the bounding box.
 * Normalizes input coordinates to [0, 1] then quantizes to 10 bits per axis.
 */
export function calculateMortonCode(
  pos: [number, number, number] | Float32Array,
  boundsMin: [number, number, number] | Float32Array,
  boundsMax: [number, number, number] | Float32Array
): number {
  const dx = (boundsMax[0] - boundsMin[0]) || 1e-8;
  const dy = (boundsMax[1] - boundsMin[1]) || 1e-8;
  const dz = (boundsMax[2] - boundsMin[2]) || 1e-8;

  const nx = Math.min(Math.max((pos[0] - boundsMin[0]) / dx, 0.0), 1.0);
  const ny = Math.min(Math.max((pos[1] - boundsMin[1]) / dy, 0.0), 1.0);
  const nz = Math.min(Math.max((pos[2] - boundsMin[2]) / dz, 0.0), 1.0);

  const x = Math.min(Math.floor(nx * 1024.0), 1023);
  const y = Math.min(Math.floor(ny * 1024.0), 1023);
  const z = Math.min(Math.floor(nz * 1024.0), 1023);

  const xx = expandBits(x);
  const yy = expandBits(y);
  const zz = expandBits(z);

  return (((xx << 2) | (yy << 1) | zz) >>> 0);
}
