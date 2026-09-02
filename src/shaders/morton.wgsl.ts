export const mortonWgsl = `
struct SceneBounds {
    min: vec3<f32>,
    max: vec3<f32>,
};

@group(0) @binding(0) var<storage, read> splatCenters: array<vec4<f32>>; // xyz: position, w: radius
@group(0) @binding(1) var<storage, read_write> mortonCodes: array<u32>;
@group(0) @binding(2) var<storage, read_write> splatIndices: array<u32>;
@group(0) @binding(3) var<uniform> bounds: SceneBounds;

// Expands a 10-bit integer into 30 bits by inserting 2 zeros after each bit.
fn expandBits(v: u32) -> u32 {
    var x = v & 0x000003FFu;
    x = (x | (x << 16u)) & 0x030000FFu;
    x = (x | (x <<  8u)) & 0x0300F00Fu;
    x = (x | (x <<  4u)) & 0x030C30C3u;
    x = (x | (x <<  2u)) & 0x09249249u;
    return x;
}

// Calculates a 30-bit Morton code for a 3D position inside the bounding box.
fn calculateMortonCode(pos: vec3<f32>, boundsMin: vec3<f32>, boundsMax: vec3<f32>) -> u32 {
    // Normalize position to [0, 1]
    let normalized = (pos - boundsMin) / (boundsMax - boundsMin);
    
    // Scale to 10-bit range [0, 1023]
    let quantX = min(max(u32(normalized.x * 1024.0), 0u), 1023u);
    let quantY = min(max(u32(normalized.y * 1024.0), 0u), 1023u);
    let quantZ = min(max(u32(normalized.z * 1024.0), 0u), 1023u);
    
    // Interleave bits: Z Y X
    return (expandBits(quantZ) << 2u) | (expandBits(quantY) << 1u) | expandBits(quantX);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= arrayLength(&splatCenters)) {
        return;
    }
    
    let center = splatCenters[index].xyz;
    let code = calculateMortonCode(center, bounds.min, bounds.max);
    
    mortonCodes[index] = code;
    splatIndices[index] = index; // Initialize identity mapping for sorting
}
`;
