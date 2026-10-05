export interface Ray {
  origin: Float32Array;    // vec3 [x, y, z]
  direction: Float32Array; // vec3 [x, y, z]
}

export interface RaycastHit {
  splatIndex: number;
  distance: number;
  position: Float32Array;
}

export class SplatRaycaster {
  constructor(private device?: any, private bvhBuffer?: any) {}

  /**
   * Ray-AABB Slab intersection test.
   */
  public intersectBox(
    ray: Ray,
    boxMin: [number, number, number],
    boxMax: [number, number, number]
  ): number | null {
    let tmin = -Infinity;
    let tmax = Infinity;

    for (let i = 0; i < 3; i++) {
      const invD = 1.0 / (ray.direction[i] || 1e-8);
      let t0 = (boxMin[i] - ray.origin[i]) * invD;
      let t1 = (boxMax[i] - ray.origin[i]) * invD;

      if (invD < 0.0) {
        const tmp = t0;
        t0 = t1;
        t1 = tmp;
      }

      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);

      if (tmax < tmin) return null;
    }

    return tmin >= 0 ? tmin : (tmax >= 0 ? tmax : null);
  }

  public async intersectRay(ray: Ray, splatPositions?: Float32Array): Promise<RaycastHit | null> {
    if (!splatPositions || splatPositions.length === 0) {
      return null;
    }

    let closestDist = Infinity;
    let hitIndex = -1;
    const numSplats = splatPositions.length / 3;

    for (let i = 0; i < numSplats; i++) {
      const px = splatPositions[i * 3];
      const py = splatPositions[i * 3 + 1];
      const pz = splatPositions[i * 3 + 2];
      const radius = 0.5;

      const dist = this.intersectBox(
        ray,
        [px - radius, py - radius, pz - radius],
        [px + radius, py + radius, pz + radius]
      );

      if (dist !== null && dist < closestDist) {
        closestDist = dist;
        hitIndex = i;
      }
    }

    if (hitIndex === -1) return null;

    const hitPos = new Float32Array([
      ray.origin[0] + ray.direction[0] * closestDist,
      ray.origin[1] + ray.direction[1] * closestDist,
      ray.origin[2] + ray.direction[2] * closestDist
    ]);

    return {
      splatIndex: hitIndex,
      distance: closestDist,
      position: hitPos
    };
  }
}
