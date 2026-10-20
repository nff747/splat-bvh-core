import { describe, it, expect } from 'vitest';
import { BVHBuilder } from '../src/core/BVHBuilder';

describe('Frustum Culling', () => {
  const mockDevice: any = {
    createComputePipeline: () => ({ getBindGroupLayout: () => ({}) }),
    createShaderModule: () => ({}),
    queue: {}
  };

  const builder = new BVHBuilder(mockDevice);

  // Identity view matrix: [row-major: index 14 is translation z]
  const camera = {
    projectionMatrix: new Float32Array(16),
    viewMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])
  };

  it('returns empty array when splatPositions is undefined or empty', async () => {
    const res1 = await builder.frustumCull(camera, undefined);
    expect(res1.length).toBe(0);
    const res2 = await builder.frustumCull(camera, new Float32Array(0));
    expect(res2.length).toBe(0);
  });

  it('correctly filters splats based on view-space depth planes', async () => {
    // 3 splats:
    // splat 0: z = -5.0 (visible, in range (-1000, 0.1))
    // splat 1: z = 10.0 (culled, vz >= 0.1)
    // splat 2: z = -2000.0 (culled, vz <= -1000.0)
    const positions = new Float32Array([
      0, 0, -5,
      0, 0, 10,
      0, 0, -2000
    ]);

    const visibleIndices = await builder.frustumCull(camera, positions);
    expect(visibleIndices.length).toBe(1);
    expect(visibleIndices[0]).toBe(0);
  });
});
