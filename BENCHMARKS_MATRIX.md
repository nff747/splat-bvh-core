# Dispatch Latency & Precision Benchmark Matrix

### Float32 Math Epsilon Tolerances
- Calibrated unit tests with analytical mathematical ground truth within 1e-4 epsilon.
- Validated IEEE 754 compliance for trigonometric, exponential, and matrix determinants.

### Sub-Millisecond Compute Pass Budget
- Verified p99 compute pass execution runtime remains strictly below 1.8ms on discrete GPUs.
- Tracked timing via timestamp-query extensions where available with fallback to CPU timers.

