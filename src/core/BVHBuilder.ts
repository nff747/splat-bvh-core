import { BVHOptions, BVHNode } from './types';
import { mortonShader } from '../shaders/morton.wgsl';
import { radixSortShader } from '../shaders/radixSort.wgsl';
import { bvhBuildShader } from '../shaders/bvhBuild.wgsl';
import { SplatRaycaster, Ray, RaycastHit } from '../raycast/SplatRaycaster';

export class BVHBuilder {
  private device: GPUDevice;
  private mortonPipeline!: GPUComputePipeline;
  private radixSortPipeline!: GPUComputePipeline;
  private bvhPipeline!: GPUComputePipeline;
  private raycaster: SplatRaycaster;

  constructor(device: GPUDevice, private options: BVHOptions = {}) {
    this.device = device;
    this.raycaster = new SplatRaycaster(device);
    this.initPipelines();
  }

  private initPipelines(): void {
    this.mortonPipeline = this.device.createComputePipeline({
      label: 'Morton Code Generator Pipeline',
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: mortonShader }),
        entryPoint: 'main'
      }
    });

    this.radixSortPipeline = this.device.createComputePipeline({
      label: 'Bitonic Radix Sort Pipeline',
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: radixSortShader }),
        entryPoint: 'main'
      }
    });

    this.bvhPipeline = this.device.createComputePipeline({
      label: 'Radix Tree BVH Construction Pipeline',
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: bvhBuildShader }),
        entryPoint: 'main'
      }
    });
  }

  public async buildHierarchy(splatCenterBuffer: GPUBuffer, numSplats: number, boundsBuffer: GPUBuffer): Promise<GPUBuffer> {
    const mortonBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const indicesBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const mortonOutBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const indicesOutBuffer = this.device.createBuffer({
      size: numSplats * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const numInternalNodes = numSplats - 1;
    const bvhNodesBuffer = this.device.createBuffer({
      size: numInternalNodes * 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const commandEncoder = this.device.createCommandEncoder();

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

    let nextPow2 = 1;
    while (nextPow2 < numSplats) {
      nextPow2 <<= 1;
    }

    let currentInMorton = mortonBuffer;
    let currentInIndices = indicesBuffer;
    let currentOutMorton = mortonOutBuffer;
    let currentOutIndices = indicesOutBuffer;

    const stepUniformsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    for (let stage = 2; stage <= nextPow2; stage <<= 1) {
      for (let step = stage >> 1; step > 0; step >>= 1) {
        this.device.queue.writeBuffer(stepUniformsBuffer, 0, new Uint32Array([numSplats, stage, step, 1]));

        const sortBindGroup = this.device.createBindGroup({
          layout: this.radixSortPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: currentInMorton } },
            { binding: 1, resource: { buffer: currentInIndices } },
            { binding: 2, resource: { buffer: currentOutMorton } },
            { binding: 3, resource: { buffer: currentOutIndices } },
            { binding: 4, resource: { buffer: stepUniformsBuffer } }
          ]
        });

        const sortPass = commandEncoder.beginComputePass({ label: `Bitonic Sort Pass stage ${stage} step ${step}` });
        sortPass.setPipeline(this.radixSortPipeline);
        sortPass.setBindGroup(0, sortBindGroup);
        sortPass.dispatchWorkgroups(workgroups);
        sortPass.end();

        const tempM = currentInMorton;
        currentInMorton = currentOutMorton;
        currentOutMorton = tempM;

        const tempI = currentInIndices;
        currentInIndices = currentOutIndices;
        currentOutIndices = tempI;
      }
    }
    
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

    if (typeof (this.device.queue as any).onSubmittedWorkDone === 'function') {
      await (this.device.queue as any).onSubmittedWorkDone();
    }
    
    // Safely cleanup temporary GPU buffers without throwing ReferenceError
    mortonBuffer?.destroy?.();
    indicesBuffer?.destroy?.();
    mortonOutBuffer?.destroy?.();
    indicesOutBuffer?.destroy?.();
    stepUniformsBuffer?.destroy?.();
    
    return bvhNodesBuffer;
  }

  public async build(splats: { centerBuffer: GPUBuffer, count: number, boundsBuffer: GPUBuffer }): Promise<GPUBuffer> {
    return this.buildHierarchy(splats.centerBuffer, splats.count, splats.boundsBuffer);
  }

  public async query(ray: Ray, splatPositions?: Float32Array): Promise<RaycastHit | null> {
    return this.raycaster.intersectRay(ray, splatPositions);
  }

  public async frustumCull(
    camera: { projectionMatrix: Float32Array; viewMatrix: Float32Array },
    splatPositions?: Float32Array
  ): Promise<Uint32Array> {
    if (!splatPositions || splatPositions.length === 0) {
      return new Uint32Array(0);
    }
    const numSplats = splatPositions.length / 3;
    const visible: number[] = [];

    // Simple bounding sphere test in view-space
    for (let i = 0; i < numSplats; i++) {
      const x = splatPositions[i * 3];
      const y = splatPositions[i * 3 + 1];
      const z = splatPositions[i * 3 + 2];
      
      // Transform by viewMatrix (assuming row-major 4x4)
      const vz = camera.viewMatrix[2] * x + camera.viewMatrix[6] * y + camera.viewMatrix[10] * z + camera.viewMatrix[14];
      
      // Near and far plane test
      if (vz < 0.1 && vz > -1000.0) {
        visible.push(i);
      }
    }

    return new Uint32Array(visible);
  }
}
