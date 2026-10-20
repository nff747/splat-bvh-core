import { describe, it, expect } from 'vitest';
import { SplatRaycaster } from '../src/raycast/SplatRaycaster';

describe('SplatRaycaster', () => {
  const raycaster = new SplatRaycaster();
  const boxMin: [number, number, number] = [-1, -1, -1];
  const boxMax: [number, number, number] = [1, 1, 1];

  it('intersects ray directed straight through box center', () => {
    const ray = {
      origin: new Float32Array([0, 0, -5]),
      direction: new Float32Array([0, 0, 1])
    };
    const t = raycaster.intersectBox(ray, boxMin, boxMax);
    expect(t).toBeCloseTo(4.0);
  });

  it('correctly detects parallel ray completely outside box', () => {
    const ray = {
      origin: new Float32Array([5, 0, -5]),
      direction: new Float32Array([0, 0, 1]) // x=5 is outside [-1, 1]
    };
    const t = raycaster.intersectBox(ray, boxMin, boxMax);
    expect(t).toBeNull();
  });

  it('handles ray originating inside bounding box', () => {
    const ray = {
      origin: new Float32Array([0, 0, 0]),
      direction: new Float32Array([0, 1, 0])
    };
    const t = raycaster.intersectBox(ray, boxMin, boxMax);
    expect(t).toBeCloseTo(1.0);
  });

  it('returns null when ray points away from bounding box', () => {
    const ray = {
      origin: new Float32Array([0, 0, -5]),
      direction: new Float32Array([0, 0, -1]) // pointing opposite direction
    };
    const t = raycaster.intersectBox(ray, boxMin, boxMax);
    expect(t).toBeNull();
  });

  it('handles negative ray direction coordinates', () => {
    const ray = {
      origin: new Float32Array([5, 0, 0]),
      direction: new Float32Array([-1, 0, 0])
    };
    const t = raycaster.intersectBox(ray, boxMin, boxMax);
    expect(t).toBeCloseTo(4.0);
  });
});
