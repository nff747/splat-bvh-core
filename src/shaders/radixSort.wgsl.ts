export const radixSortWgsl = `
struct SortUniforms {
    count: u32,
    stage: u32,
    step: u32,
    direction: u32
};

@group(0) @binding(0) var<storage, read_write> mortonBuffer: array<u32>;
@group(0) @binding(1) var<storage, read_write> indicesBuffer: array<u32>;
@group(0) @binding(2) var<storage, read_write> mortonOut: array<u32>;
@group(0) @binding(3) var<storage, read_write> indicesOut: array<u32>;
@group(0) @binding(4) var<uniform> uniforms: SortUniforms;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let i = global_id.x;
    let n = uniforms.count;
    
    if (i >= n) {
        return;
    }

    let stage = uniforms.stage;
    let step = uniforms.step;

    let pairDist = step;
    let isLeft = (i & pairDist) == 0u;
    let partner = select(i - pairDist, i + pairDist, isLeft);
    let dirAscending = (i & stage) == 0u;

    if (isLeft && partner < n) {
        let keyA = mortonBuffer[i];
        let valA = indicesBuffer[i];
        let keyB = mortonBuffer[partner];
        let valB = indicesBuffer[partner];

        let shouldSwap = select(keyA < keyB, keyA > keyB, dirAscending);

        if (shouldSwap) {
            mortonOut[i] = keyB;
            indicesOut[i] = valB;
            mortonOut[partner] = keyA;
            indicesOut[partner] = valA;
        } else {
            mortonOut[i] = keyA;
            indicesOut[i] = valA;
            mortonOut[partner] = keyB;
            indicesOut[partner] = valB;
        }
    } else if (partner >= n) {
        mortonOut[i] = mortonBuffer[i];
        indicesOut[i] = indicesBuffer[i];
    }
}
`;
