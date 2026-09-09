import * as THREE from 'three';
import { BVHBuilder, SplatRaycaster } from 'splat-bvh-core';

// Example integration with antimatter15/splat or mkkellogg/GaussianSplats3D
export async function setupSplatRaycasting(
  device: GPUDevice, 
  splatCenters: Float32Array,
  numSplats: number
) {
  // 1. Create GPU buffers for splat centers and bounds
  const centerBuffer = device.createBuffer({
    size: splatCenters.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(centerBuffer, 0, splatCenters);

  const boundsBuffer = device.createBuffer({
    size: 24, // min(vec3), max(vec3)
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  // (Compute scene bounds and write to boundsBuffer)

  // 2. Build the BVH
  const builder = new BVHBuilder(device);
  
  // Using the new API
  const bvhBuffer = await builder.build({
    centerBuffer,
    count: numSplats,
    boundsBuffer
  });

  // 3. Setup Raycaster
  const raycaster = new SplatRaycaster(device, bvhBuffer);

  // 4. Hook into Three.js raycasting
  const threeRaycaster = new THREE.Raycaster();
  
  window.addEventListener('click', async (event) => {
    // Standard Three.js pointer logic
    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // We assume you have a 'camera' in scope
    // threeRaycaster.setFromCamera(pointer, camera);
    
    // Query our WebGPU BVH!
    const hit = await raycaster.intersectRay({
      origin: new Float32Array(threeRaycaster.ray.origin.toArray()),
      direction: new Float32Array(threeRaycaster.ray.direction.toArray())
    });

    if (hit) {
      console.log('Hit splat index:', hit.splatIndex);
    }
  });

  return bvhBuffer;
}
