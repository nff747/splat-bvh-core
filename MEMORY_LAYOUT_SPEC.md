# GPU Memory Virtualization & Uniform Layout

### 16-Byte Structure Alignment Invariant
- Strict enforcement of WebGPU 16-byte alignment rules across all uniform and storage structs.
- Padded matrix structures to avoid undefined driver clamping on Vulkan/Metal backends.

