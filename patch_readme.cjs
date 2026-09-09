const fs = require('fs');
let code = fs.readFileSync('README.md', 'utf8');

const useCases = `
## Use Cases

By maintaining a fast, GPU-resident BVH for your Gaussian Splatting scene, you can efficiently perform:
- **Ray Casting**: Instantly select, edit, or interact with individual splats using mouse clicks.
- **Frustum Culling**: Dynamically skip rendering splats outside the camera view, saving massive rasterization overhead.
- **Collision Detection**: Implement physics engines that interact directly with the scanned environment.
- **LOD Selection**: Dynamically adjust splat resolution based on bounding box distance from the camera.
`;

const apiRef = `
## API Reference

### \`BVHBuilder.build(splats)\`
Builds the Linear Bounding Volume Hierarchy from a GPU buffer of splat centers.
\`\`\`typescript
const bvhTreeBuffer = await builder.build({
  centerBuffer: splatCentersBuffer,
  count: numSplats,
  boundsBuffer: sceneBoundsBuffer
});
\`\`\`

### \`BVHBuilder.query(ray)\`
Performs a fast GPU-accelerated ray intersection against the BVH.
\`\`\`typescript
const hit = await builder.query({
  origin: Float32Array.from([0, 0, 0]),
  direction: Float32Array.from([0, 0, -1])
});
\`\`\`

### \`BVHBuilder.frustumCull(camera)\`
Traverses the BVH to return a tight list of visible splats.
\`\`\`typescript
const visibleSplats = await builder.frustumCull({
  projectionMatrix: camera.projectionMatrix,
  viewMatrix: camera.viewMatrix
});
\`\`\`
`;

const threeIntegration = `
## Integration with Three.js + 3DGS

\`splat-bvh-core\` is renderer-agnostic and drops right into popular Three.js renderers like \`antimatter15/splat\` or \`mkkellogg/GaussianSplats3D\`.

\`\`\`typescript
import * as THREE from 'three';
import { BVHBuilder, SplatRaycaster } from 'splat-bvh-core';

// 1. Build the tree on the GPU
const builder = new BVHBuilder(device);
const bvhBuffer = await builder.build({
  centerBuffer: mySplatCenters,
  count: 5_000_000,
  boundsBuffer: mySceneBounds
});

// 2. Setup Raycaster
const raycaster = new SplatRaycaster(device, bvhBuffer);
const threeRaycaster = new THREE.Raycaster();

// 3. Hook into standard Three.js events
window.addEventListener('click', async (event) => {
  const hit = await raycaster.intersectRay({
    origin: new Float32Array(threeRaycaster.ray.origin.toArray()),
    direction: new Float32Array(threeRaycaster.ray.direction.toArray())
  });
  if (hit) console.log('Hit splat:', hit.splatIndex);
});
\`\`\`
`;

const asciiDiagram = `
### Tree Architecture

\`\`\`text
                 [ Root Node (AABB) ]
                /                    \\
      [ Internal Node ]        [ Internal Node ]
      (Prefix: 010...)         (Prefix: 110...)
      /              \\           /            \\
 [ Leaf 0 ]      [ Leaf 1 ]  [ Leaf 2 ]    [ Leaf 3 ]
(Morton: 0100) (Morton: 0101)(Morton: 1100)(Morton: 1101)
\`\`\`
`;

// Insert after "The Solution..." section
code = code.replace(/## How It Works: The Karras LBVH Pipeline/, useCases + '\n## How It Works: The Karras LBVH Pipeline');
code = code.replace(/### 3\. Tree Construction\n([^\n]+)/, '### 3. Tree Construction\n$1\n' + asciiDiagram);
code = code.replace(/## API Usage/, apiRef + '\n' + threeIntegration + '\n## Core Workflow');

fs.writeFileSync('README.md', code);
