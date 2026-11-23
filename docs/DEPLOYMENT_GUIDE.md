# Production Deployment & Embed Guide // Splat Bvh Core

## 1. Browser Native & Web Worker Environment
Install via your preferred package manager:
```bash
npm install splat-bvh-core
```

```javascript
import { EngineContext } from 'splat-bvh-core';

const engine = new EngineContext({
  arenaSize: 32 * 1024 * 1024,
  strictMode: true
});

await engine.initialize();
```

## 2. Air-Gapped / Sovereign Deployments
Download the zero-dependency bundle or clone directly. No external registry or network access is required at runtime.
