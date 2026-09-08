import { mortonWgsl } from '../shaders/morton.wgsl';
import { bvhBuildWgsl } from '../shaders/bvhBuild.wgsl';
import { radixSortWgsl } from '../shaders/radixSort.wgsl';

export interface BVHOptions {
  debug?: boolean;
}

export class BVHBuilder {
  private device: GPUDevice;
  private mortonPipeline: GPUComputePipeline;
  private bvhPipeline: GPUComputePipeline;
  private radixSortPipeline: GPUComputePipeline;

  constructor(device: GPUDevice, private options: BVHOptions = {}) {
    this.device = device;
    this.mortonPipeline = this.createPipeline(mortonWgsl, 'MortonEncoder');
    this.bvhPipeline = this.createPipeline(bvhBuildWgsl, 'BVHConstructor');
    this.radixSortPipeline = this.createPipeline(radixSortWgsl, 'RadixSort');
  }

  private createPipeline(code: string, label: string): GPUComputePipeline {
    const module = this.device.createShaderModule({ code, label: `${label}Module` });
    return this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module,
        entryPoint: 'main',
      },
      label: `${label}Pipeline`
    });
  }

  public async buildHierarchy(splatCenterBuffer: GPUBuffer, numSplats: number, boundsBuffer: GPUBuffer): Promise<GPUBuffer> {
    const commandEncoder = this.device.createCommandEncoder({ label: 'LBVH Build Encoder' });

    // Exact allocation for arbitrary splat counts - Zero power-of-two padding waste
    const mortonBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });
    
    const indicesBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });

    const mortonOutBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });

    const indicesOutBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });

    const sortUniformsBuffer = this.device.createBuffer({
      size: 16, // count (u32), shift (u32), padding
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.device.queue.writeBuffer(sortUniformsBuffer, 0, new Uint32Array([numSplats, 0, 0, 0]));

    const bvhNodesBuffer = this.device.createBuffer({
      size: ((numSplats * 2) - 1) * 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const mortonBindGroup = this.device.createBindGroup({
      layout: this.mortonPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: splatCenterBuffer } },
        { binding: 1, resource: { buffer: mortonBuffer } },
        { binding: 2, resource: { buffer: indicesBuffer } },
        { binding: 3, resource: { buffer: boundsBuffer } }
      ]
    });

    const workgroups = Math.ceil(numSplats / 256);
    const mortonPass = commandEncoder.beginComputePass({ label: 'Morton Compute Pass' });
    mortonPass.setPipeline(this.mortonPipeline);
    mortonPass.setBindGroup(0, mortonBindGroup);
    mortonPass.dispatchWorkgroups(workgroups);
    mortonPass.end();

    // Compute next power of two for bitonic sort stages
    let nextPow2 = 1;
    while (nextPow2 < numSplats) {
      nextPow2 <<= 1;
    }

    // Ping-pong sort buffers
    let currentInMorton = mortonBuffer;
    let currentInIndices = indicesBuffer;
    let currentOutMorton = mortonOutBuffer;
    let currentOutIndices = indicesOutBuffer;

    for (let stage = 2; stage <= nextPow2; stage <<= 1) {
      for (let step = stage >> 1; step > 0; step >>= 1) {
        const uniformsBuffer = this.device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(uniformsBuffer, 0, new Uint32Array([numSplats, stage, step, 1]));

        const sortBindGroup = this.device.createBindGroup({
          layout: this.radixSortPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: currentInMorton } },
            { binding: 1, resource: { buffer: currentInIndices } },
            { binding: 2, resource: { buffer: currentOutMorton } },
            { binding: 3, resource: { buffer: currentOutIndices } },
            { binding: 4, resource: { buffer: uniformsBuffer } }
          ]
        });

        const sortPass = commandEncoder.beginComputePass({ label: `Bitonic Sort Pass stage ${stage} step ${step}` });
        sortPass.setPipeline(this.radixSortPipeline);
        sortPass.setBindGroup(0, sortBindGroup);
        sortPass.dispatchWorkgroups(workgroups);
        sortPass.end();

        // Swap ping-pong buffers
        const tempM = currentInMorton;
        currentInMorton = currentOutMorton;
        currentOutMorton = tempM;

        const tempI = currentInIndices;
        currentInIndices = currentOutIndices;
        currentOutIndices = tempI;
      }
    }
    
    // Ensure final sorted morton buffer is wired into BVH construction
    const finalSortedMortonBuffer = currentInMorton;
    
    const bvhBindGroup = this.device.createBindGroup({
      layout: this.bvhPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: finalSortedMortonBuffer } },
        { binding: 1, resource: { buffer: bvhNodesBuffer } }
      ]
    });

    const bvhPass = commandEncoder.beginComputePass({ label: 'BVH Compute Pass' });
    bvhPass.setPipeline(this.bvhPipeline);
    bvhPass.setBindGroup(0, bvhBindGroup);
    bvhPass.dispatchWorkgroups(workgroups);
    bvhPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
    
    if (this.options.debug) {
      console.log(`[Splat BVH] Hierarchy constructed for ${numSplats} arbitrary splats (Zero Padded VRAM).`);
    }

    return bvhNodesBuffer;
  }
}
