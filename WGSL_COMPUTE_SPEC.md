# WGSL Compute Pipeline & Subgroup Architecture

### Subgroup Matrix Arithmetic
- Implemented branchless subgroup reduction primitives (`subgroupAdd`, `subgroupInclusiveAdd`).
- Mapped 16x16 workgroup tiles into single-wavefront SIMD execution registers.

