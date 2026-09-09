# Contributing to Splat-BVH-Core

Thank you for contributing to **Splat-BVH-Core**, a high-performance WebGPU Linear Bounding Volume Hierarchy (LBVH) builder for 3D Gaussian Splatting and spatial acceleration.

## Development & Testing

```bash
npm install
npx vitest run
```

### WGSL Guidelines

- Keep all sorting and tree construction logic inside WebGPU compute shaders (`src/shaders/`) to avoid host-device memory transfers.
- Verify workgroup sizes and memory barrier synchronization (`workgroupBarrier()`) to prevent race conditions on parallel passes.

## How to Submit Changes

1. Fork the repo and create a feature branch (`git checkout -b feat/bvh-optimization`).
2. Run `npx vitest run` to verify tests pass.
3. Open a Pull Request.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
