import { describe, it, expect } from 'vitest';
import { SplatLODTileManager, SplatTileDescriptor } from '../src/core/SplatLODTileManager';

describe('SplatLODTileManager', () => {
  it('updates dynamic LoD levels and prioritizes streaming order by camera distance', () => {
    const manager = new SplatLODTileManager();

    const tileNear: SplatTileDescriptor = {
      tileId: 1,
      mortonStart: 0,
      mortonEnd: 100,
      center: [0, 0, 5],
      splatCount: 1000,
      lodLevel: 0,
      isResidentInVRAM: true,
    };

    const tileFar: SplatTileDescriptor = {
      tileId: 2,
      mortonStart: 101,
      mortonEnd: 200,
      center: [0, 0, 50],
      splatCount: 1000,
      lodLevel: 0,
      isResidentInVRAM: false,
    };

    manager.registerTile(tileNear);
    manager.registerTile(tileFar);

    const cameraPos: [number, number, number] = [0, 0, 0];
    manager.updateLOD(cameraPos, 10, 30);

    // tileNear is at dist 5 <= 10 -> lodLevel 0
    expect(manager.getTile(1)?.lodLevel).toBe(0);
    // tileFar is at dist 50 > 30 -> lodLevel 2
    expect(manager.getTile(2)?.lodLevel).toBe(2);

    // Prioritized list should place closest tile first
    const prioritized = manager.prioritizeTiles(cameraPos);
    expect(prioritized[0].tileId).toBe(1);
    expect(prioritized[1].tileId).toBe(2);
  });
});
