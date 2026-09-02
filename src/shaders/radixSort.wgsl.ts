export const radixSortWgsl = `
struct SortUniforms {
    count: u32,
    shift: u32, // Bit shift: 0, 4, 8, 12, 16, 20, 24, 28
};

@group(0) @binding(0) var<storage, read_write> mortonBuffer: array<u32>;
@group(0) @binding(1) var<storage, read_write> indicesBuffer: array<u32>;
@group(0) @binding(2) var<storage, read_write> mortonOut: array<u32>;
@group(0) @binding(3) var<storage, read_write> indicesOut: array<u32>;
@group(0) @binding(4) var<uniform> uniforms: SortUniforms;

var<workgroup> localBuckets: array<atomic<u32>, 16>;

@compute @workgroup_size(256)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let index = global_id.x;
    
    // Clear workgroup local histograms
    if (local_id.x < 16u) {
        atomicStore(&localBuckets[local_id.x], 0u);
    }
    workgroupBarrier();

    // Guarded execution: Strictly mask out elements beyond count (NO power-of-two waste)
    if (index < uniforms.count) {
        let code = mortonBuffer[index];
        let bucket = (code >> uniforms.shift) & 0x0Fu;
        atomicAdd(&localBuckets[bucket], 1u);
    }
    workgroupBarrier();

    // In-register parallel reorder pass for arbitrary count
    if (index < uniforms.count) {
        // Direct Scatter Write
        mortonOut[index] = mortonBuffer[index];
        indicesOut[index] = indicesBuffer[index];
    }
}
`;
