const fs = require('fs');
let code = fs.readFileSync('src/core/BVHBuilder.ts', 'utf8');

const newMethods = `
  public async build(splats: { centerBuffer: GPUBuffer, count: number, boundsBuffer: GPUBuffer }): Promise<GPUBuffer> {
    return this.buildHierarchy(splats.centerBuffer, splats.count, splats.boundsBuffer);
  }

  public async query(ray: { origin: Float32Array; direction: Float32Array }): Promise<any> {
    // Scaffold: would typically call a raycaster instance
    console.log('[Splat BVH] Querying BVH with ray...');
    return null;
  }

  public async frustumCull(camera: { projectionMatrix: Float32Array; viewMatrix: Float32Array }): Promise<Uint32Array> {
    // Scaffold: would return array of visible splat indices
    console.log('[Splat BVH] Frustum culling splats...');
    return new Uint32Array();
  }
`;

code = code.replace(/return bvhNodesBuffer;\n  }\n}/, `return bvhNodesBuffer;\n  }\n${newMethods}}`);

fs.writeFileSync('src/core/BVHBuilder.ts', code);
