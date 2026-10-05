import { describe, it, expect, vi } from 'vitest';
import { BVHBuilder } from '../src/core/BVHBuilder';

// Mock WebGPU globals in Node
(globalThis as any).GPUBufferUsage = {
  STORAGE: 128,
  COPY_SRC: 4,
  COPY_DST: 8,
  UNIFORM: 64
};

const mockPipeline = {
  getBindGroupLayout: vi.fn().mockReturnValue({})
};

const mockBuffer = {
  destroy: vi.fn()
};

const mockPass = {
  setPipeline: vi.fn(),
  setBindGroup: vi.fn(),
  dispatchWorkgroups: vi.fn(),
  end: vi.fn()
};

const mockEncoder = {
  beginComputePass: vi.fn().mockReturnValue(mockPass),
  finish: vi.fn().mockReturnValue({})
};

const mockDevice = {
  createShaderModule: vi.fn().mockReturnValue({}),
  createComputePipeline: vi.fn().mockReturnValue(mockPipeline),
  createBuffer: vi.fn().mockReturnValue(mockBuffer),
  createBindGroup: vi.fn().mockReturnValue({}),
  createCommandEncoder: vi.fn().mockReturnValue(mockEncoder),
  queue: {
    writeBuffer: vi.fn(),
    submit: vi.fn(),
    onSubmittedWorkDone: vi.fn().mockResolvedValue(undefined)
  }
} as unknown as GPUDevice;

describe('BVHBuilder', () => {
  it('should initialize compute pipelines correctly', () => {
    const builder = new BVHBuilder(mockDevice);
    expect(builder).toBeDefined();
    expect(mockDevice.createComputePipeline).toHaveBeenCalledTimes(3);
  });

  it('should build hierarchy and dispatch parallel sorting network', async () => {
    const builder = new BVHBuilder(mockDevice);
    const splats = {
      centerBuffer: mockBuffer as unknown as GPUBuffer,
      count: 1024,
      boundsBuffer: mockBuffer as unknown as GPUBuffer
    };

    const result = await builder.build(splats);
    expect(result).toBeDefined();
    expect(mockEncoder.beginComputePass).toHaveBeenCalled();
  });

  it('performs real raycast query against splat bounding volumes', async () => {
    const builder = new BVHBuilder(mockDevice);
    const ray = {
      origin: new Float32Array([0, 0, -5]),
      direction: new Float32Array([0, 0, 1])
    };
    const splatPositions = new Float32Array([0, 0, 0, 10, 10, 10]);

    const hit = await builder.query(ray, splatPositions);
    expect(hit).toBeDefined();
    expect(hit?.splatIndex).toBe(0);
    expect(hit?.distance).toBeCloseTo(4.5);
  });
});
