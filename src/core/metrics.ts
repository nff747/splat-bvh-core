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

/**
 * Calculates surface area of an Axis-Aligned Bounding Box (AABB).
 * SA = 2 * (dx*dy + dy*dz + dz*dx)
 */
export function computeAABBSurfaceArea(min: [number, number, number], max: [number, number, number]): number {
  const dx = Math.max(0, max[0] - min[0]);
  const dy = Math.max(0, max[1] - min[1]);
  const dz = Math.max(0, max[2] - min[2]);
  return 2.0 * (dx * dy + dy * dz + dz * dx);
}

/**
 * Computes Surface Area Heuristic (SAH) cost for a binary partition split.
 * Cost = C_traverse + (SA_L / SA_P) * N_L * C_intersect + (SA_R / SA_P) * N_R * C_intersect
 */
export function computeSAHCost(
  parentSA: number,
  leftSA: number,
  rightSA: number,
  numLeft: number,
  numRight: number,
  costTraversal: number = 1.0,
  costIntersection: number = 1.5
): number {
  if (parentSA <= 1e-6) {
    return (numLeft + numRight) * costIntersection;
  }
  const probLeft = leftSA / parentSA;
  const probRight = rightSA / parentSA;
  return costTraversal + (probLeft * numLeft + probRight * numRight) * costIntersection;
}
