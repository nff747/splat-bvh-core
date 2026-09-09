export interface AABB {
  min: Float32Array; // vec3
  max: Float32Array; // vec3
}

export interface BVHNode {
  boundingBox: AABB;
  leftChild: number;
  rightChild: number;
  isLeaf: boolean;
  splatIndex: number;
}
