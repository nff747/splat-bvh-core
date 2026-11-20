# API Reference & Developer Integration // SPLAT-BVH-CORE
**Language:** Native / WebGPU / TypeScript / Rust  
**Stability:** Tier-1 Sovereign LTS  

---

## 1. Client Ergonomics & Minimal Boilerplate
Initialize and execute `splat-bvh-core` with minimal integration friction:

```typescript
import { Engine } from 'splat-bvh-core';

// Initialize context with zero-copy shared buffers
const runtime = await Engine.initialize({
  arenaBytes: 64 * 1024 * 1024,
  strictMode: true,
  debug: false
});

// High-velocity execution path
const output = runtime.process(payload);
console.log(`Execution completed with status: ${output.status}`);
```

## 2. Core Exports & Data Structures
- `Engine.initialize(config)`: Pre-allocates memory arena and boots worker threads.
- `Engine.process(input)`: Executes kernel with deterministic zero-allocation guarantees.
- `Engine.destroy()`: Safely zeroizes memory blocks and releases platform primitives.
