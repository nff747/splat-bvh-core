# Offline & Air-Gapped Integration // Splat Bvh Core

## Zero Network Dependency Architecture
`splat-bvh-core` is fully autonomous and can be integrated into air-gapped, zero-trust infrastructure environments:

1. **Self-Contained:** Zero runtime CDN calls, unauthenticated telemetry pings, or external API requirements.
2. **Deterministic Build:** Standard Node.js / Rust native compilation with vendored or strictly pinned lockfiles.
3. **Local Testing:** Run `node tools/verify.mjs` directly without network connectivity.
