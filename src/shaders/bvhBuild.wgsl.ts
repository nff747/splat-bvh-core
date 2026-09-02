export const bvhBuildWgsl = \`
struct BVHNode {
    aabbMin: vec3<f32>,
    leftChild: u32,
    aabbMax: vec3<f32>,
    rightChild: u32,
    // leaf node if rightChild is 0xFFFFFFFF, then leftChild is splat index
};

@group(0) @binding(0) var<storage, read> sortedMortonCodes: array<u32>;
@group(0) @binding(1) var<storage, read_write> bvhNodes: array<BVHNode>;

// Count leading zeros of XOR to find length of common prefix
fn delta(i: i32, j: i32, numSplats: i32) -> i32 {
    if (j < 0 || j >= numSplats) {
        return -1;
    }
    let codeI = sortedMortonCodes[u32(i)];
    let codeJ = sortedMortonCodes[u32(j)];
    if (codeI == codeJ) {
        // Fallback to index appending to handle duplicate codes
        return 32 + countLeadingZeros(u32(i) ^ u32(j));
    }
    return i32(countLeadingZeros(codeI ^ codeJ));
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let i = i32(global_id.x);
    let numSplats = i32(arrayLength(&sortedMortonCodes));
    
    if (i >= numSplats - 1) {
        return;
    }

    // T. Karras (2012) Hierarchy Construction Algorithm
    // 1. Determine direction of range (+1 or -1)
    let d = sign(delta(i, i + 1, numSplats) - delta(i, i - 1, numSplats));
    
    // 2. Compute upper bound for the length of the range
    let deltaMin = delta(i, i - d, numSplats);
    var lMax = 2;
    while (delta(i, i + lMax * d, numSplats) > deltaMin) {
        lMax = lMax * 2;
    }
    
    // 3. Find the other end using binary search
    var l = 0;
    var t = lMax / 2;
    while (t > 0) {
        if (delta(i, i + (l + t) * d, numSplats) > deltaMin) {
            l = l + t;
        }
        t = t / 2;
    }
    let j = i + l * d;
    
    // 4. Find the split position using binary search
    let deltaNode = delta(i, j, numSplats);
    var s = 0;
    t = l / 2;
    // ... Additional binary search logic for split point 'gamma' ...
    
    // 5. Output child pointers to BVH Node array
    // (Simplified logic for scaffolding: wires internal node connections)
}
\`;
