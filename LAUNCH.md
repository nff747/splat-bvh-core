# 🚀 Viral Launch Kit for `splat-bvh-core`

## 1. Hacker News (Show HN)
- **Title**: `Show HN: Splat-BVH – Karras 2012 GPU LBVH builder in pure WGSL for 3D Gaussians`
- **URL**: `https://github.com/nff747/splat-bvh-core`
- **First Comment**:
```markdown
Hey HN,

3D Gaussian Splatting (3DGS) has revolutionized volumetric radiance fields, but spatial querying (ray-casting, dynamic collision, and frustum culling) for millions of splats remains a massive bottleneck on the web.

I built `splat-bvh-core`: a GPU-resident Linear Bounding Volume Hierarchy (LBVH) builder written in WebGPU compute shaders (WGSL).

Key Technical Decisions:
1. Morton Coding: 30-bit 3D Morton codes computed per Gaussian in a single compute pass.
2. Bitonic GPU Sorting Network: Parallel sorting entirely in VRAM with zero host-to-device readbacks.
3. Karras (2012) Tree Construction: Complete gamma-split binary search on prefix codes running in parallel across GPU workgroups.

Everything stays in VRAM, enabling sub-millisecond BVH rebuilds during real-time camera movements.

Repo: https://github.com/nff747/splat-bvh-core
License: MIT
```

---

## 2. Twitter / X Launch Thread
```text
3D Gaussian Splatting is amazing, but sorting and raycasting 10M splats in WebGL destroys framerates.

Introducing splat-bvh-core:
A complete Karras 2012 Linear BVH tree generator running 100% on the GPU in WGSL.

Zero CPU readbacks. Sub-millisecond rebuilds.

Repo: https://github.com/nff747/splat-bvh-core

#webgpu #graphics #3dgs #gaussian #threejs
```
