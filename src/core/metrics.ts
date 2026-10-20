export interface BVHMetrics {
  numSplats: number;
  numInternalNodes: number;
  totalNodes: number;
  maxTheoreticalDepth: number;
  bufferSizeBytes: number;
}

/**
 * Computes hierarchy size, depth, and memory footprint metrics for a given splat count.
 * Each BVHNode is laid out with 32 bytes (2x vec3 + 2x u32).
 */
export function computeBVHMetrics(numSplats: number): BVHMetrics {
  if (!Number.isInteger(numSplats) || numSplats <= 0) {
    return {
      numSplats: 0,
      numInternalNodes: 0,
      totalNodes: 0,
      maxTheoreticalDepth: 0,
      bufferSizeBytes: 0
    };
  }

  const numInternalNodes = numSplats - 1;
  const totalNodes = numSplats + numInternalNodes;
  const nodeSizeBytes = 32;
  const maxTheoreticalDepth = Math.ceil(Math.log2(Math.max(numSplats, 2)));

  return {
    numSplats,
    numInternalNodes,
    totalNodes,
    maxTheoreticalDepth,
    bufferSizeBytes: totalNodes * nodeSizeBytes
  };
}
