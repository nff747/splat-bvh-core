import { mortonWgsl } from '../shaders/morton.wgsl';
import { bvhBuildWgsl } from '../shaders/bvhBuild.wgsl';

export interface BVHOptions {
  debug?: boolean;
}

export class BVHBuilder {
  private device: GPUDevice;
  private mortonPipeline: GPUComputePipeline;
  private bvhPipeline: GPUComputePipeline;

  constructor(device: GPUDevice, private options: BVHOptions = {}) {
    this.device = device;
    this.mortonPipeline = this.createPipeline(mortonWgsl, 'MortonEncoder');
    this.bvhPipeline = this.createPipeline(bvhBuildWgsl, 'BVHConstructor');
  }

  private createPipeline(code: string, label: string): GPUComputePipeline {
    const module = this.device.createShaderModule({ code, label: \`\${label}Module\` });
    return this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module,
        entryPoint: 'main',
      },
      label: \`\${label}Pipeline\`
    });
  }

  /**
   * Orchestrates the Linear Bounding Volume Hierarchy (LBVH) creation.
   * Runs entirely on the GPU.
   * 
   * @param splatCenterBuffer GPUBuffer containing the XYZ center and Radius of each splat.
   * @param numSplats Total number of splats (e.g., 5,000,000).
   * @param boundsBuffer GPUBuffer containing the global min/max bounding box.
   */
  public async buildHierarchy(splatCenterBuffer: GPUBuffer, numSplats: number, boundsBuffer: GPUBuffer): Promise<GPUBuffer> {
    const commandEncoder = this.device.createCommandEncoder({ label: 'LBVH Build Encoder' });

    // 1. Allocate intermediate buffers
    const mortonBuffer = this.device.createBuffer({
      size: numSplats * 4, // u32
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });
    
    const indicesBuffer = this.device.createBuffer({
      size: numSplats * 4, // u32
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });

    const bvhNodesBuffer = this.device.createBuffer({
      // Internal nodes = numSplats - 1. Total nodes = 2n - 1. 
      // Size: 32 bytes per node (min vec3, max vec3, leftChild u32, rightChild u32)
      size: ((numSplats * 2) - 1) * 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    // 2. Dispatch Morton Encoding Pass
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

    // 3. TODO: Dispatch Radix Sort Pass (Sorts mortonBuffer & indicesBuffer)
    // For scaffolding, this assumes an external GPU radix sort implementation is injected here.
    
    // 4. Dispatch LBVH Construction Pass (Karras 2012)
    const bvhBindGroup = this.device.createBindGroup({
      layout: this.bvhPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: mortonBuffer } },
        { binding: 1, resource: { buffer: bvhNodesBuffer } }
      ]
    });

    const bvhPass = commandEncoder.beginComputePass({ label: 'BVH Compute Pass' });
    bvhPass.setPipeline(this.bvhPipeline);
    bvhPass.setBindGroup(0, bvhBindGroup);
    bvhPass.dispatchWorkgroups(workgroups); // n-1 threads actually needed
    bvhPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
    
    if (this.options.debug) {
      console.log(\`[Splat BVH] Hierarchy constructed for \${numSplats} splats.\`);
    }

    return bvhNodesBuffer;
  }
}
