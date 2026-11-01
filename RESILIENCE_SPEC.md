# Device Loss Handling & Context Re-acquisition

### Asynchronous Device Lost Handling
- Bound `device.lost` promise handler with exponential backoff re-initialization loop.
- Preserved CPU-side scene graph and re-uploaded pipeline state without page reload.

### Out-of-Memory Fallback Tiers
- Implemented tiered downsampling when `createBuffer` throws `OutOfMemoryError`.
- Preserved interactive frame rate by dynamically shedding secondary compute passes.

