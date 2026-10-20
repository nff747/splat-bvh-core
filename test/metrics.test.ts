import { describe, it, expect } from 'vitest';
import { computeBVHMetrics } from '../src/core/metrics';

describe('BVH Tree Metrics', () => {
  it('computes metrics for 1024 splats', () => {
    const metrics = computeBVHMetrics(1024);
    expect(metrics.numSplats).toBe(1024);
    expect(metrics.numInternalNodes).toBe(1023);
    expect(metrics.totalNodes).toBe(2047);
    expect(metrics.maxTheoreticalDepth).toBe(10);
    // 2047 nodes * 32 bytes = 65,504 bytes
    expect(metrics.bufferSizeBytes).toBe(2047 * 32);
  });

  it('computes metrics for 1,000,000 splats', () => {
    const metrics = computeBVHMetrics(1_000_000);
    expect(metrics.numSplats).toBe(1_000_000);
    expect(metrics.numInternalNodes).toBe(999_999);
    expect(metrics.totalNodes).toBe(1_999_999);
    expect(metrics.maxTheoreticalDepth).toBe(20);
    expect(metrics.bufferSizeBytes).toBe(1_999_999 * 32);
  });

  it('handles single-splat hierarchy', () => {
    const metrics = computeBVHMetrics(1);
    expect(metrics.numSplats).toBe(1);
    expect(metrics.numInternalNodes).toBe(0);
    expect(metrics.totalNodes).toBe(1);
    expect(metrics.maxTheoreticalDepth).toBe(1);
    expect(metrics.bufferSizeBytes).toBe(32);
  });

  it('returns zeros for invalid or non-positive input', () => {
    expect(computeBVHMetrics(0).totalNodes).toBe(0);
    expect(computeBVHMetrics(-100).bufferSizeBytes).toBe(0);
    expect(computeBVHMetrics(NaN as any).totalNodes).toBe(0);
  });
});
