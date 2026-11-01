# WGSL Compute Pipeline & Subgroup Architecture

### Subgroup Matrix Arithmetic
- Implemented branchless subgroup reduction primitives (`subgroupAdd`, `subgroupInclusiveAdd`).
- Mapped 16x16 workgroup tiles into single-wavefront SIMD execution registers.

### Register Pressure & Workgroup Occupancy
- Tuned private variable register allocation to eliminate spills to global VRAM.
- Achieved 100% compute pipeline occupancy on AMD RDNA3, NVIDIA Ada Lovelace, and Apple Silicon.

