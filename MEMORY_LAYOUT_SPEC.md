# GPU Memory Virtualization & Uniform Layout

### 16-Byte Structure Alignment Invariant
- Strict enforcement of WebGPU 16-byte alignment rules across all uniform and storage structs.
- Padded matrix structures to avoid undefined driver clamping on Vulkan/Metal backends.

### Zero-Allocation Scratch Buffers
- Pre-allocated zero-GC scratch buffer pools for dynamic per-frame vertex and compute staging.
- Eliminated garbage collection pressure during continuous 60/120 FPS simulation passes.

