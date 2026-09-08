import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BVHBuilder } from '../src/core/BVHBuilder';

// Mock WebGPU globals
(globalThis as any).GPUBufferUsage = {
  STORAGE: 128,
  COPY_SRC: 4,
  COPY_DST: 8,
  UNIFORM: 64,
};

const mockBuffer = {
  destroy: vi.fn(),
};

const mockPass = {
  setPipeline: vi.fn(),
  setBindGroup: vi.fn(),
  dispatchWorkgroups: vi.fn(),
  end: vi.fn(),
};

const mockCommandEncoder = {
  beginComputePass: vi.fn().mockReturnValue(mockPass),
  finish: vi.fn().mockReturnValue({}),
};

const mockDevice = {
  createShaderModule: vi.fn().mockReturnValue({}),
  createComputePipeline: vi.fn().mockReturnValue({
    getBindGroupLayout: vi.fn().mockReturnValue({}),
  }),
  createBuffer: vi.fn().mockReturnValue(mockBuffer),
  createBindGroup: vi.fn().mockReturnValue({}),
  createCommandEncoder: vi.fn().mockReturnValue(mockCommandEncoder),
  queue: {
    writeBuffer: vi.fn(),
    submit: vi.fn(),
  }
};

describe('BVHBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize compute pipelines correctly', () => {
    const builder = new BVHBuilder(mockDevice as any);
    expect(mockDevice.createComputePipeline).toHaveBeenCalledTimes(3);
  });

  it('should build hierarchy and dispatch parallel sorting network', async () => {
    const builder = new BVHBuilder(mockDevice as any);
    const splatCenterBuffer = mockBuffer as any;
    const boundsBuffer = mockBuffer as any;

    const numSplats = 8;
    const resultBuffer = await builder.buildHierarchy(splatCenterBuffer, numSplats, boundsBuffer);

    expect(resultBuffer).toBeDefined();
    expect(mockCommandEncoder.beginComputePass).toHaveBeenCalled();
    expect(mockPass.dispatchWorkgroups).toHaveBeenCalled();
    expect(mockDevice.queue.submit).toHaveBeenCalledTimes(1);
  });
});

