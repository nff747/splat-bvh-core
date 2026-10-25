import { calculateMortonCode } from './morton';

export interface SplatTileDescriptor {
  tileId: number;
  mortonStart: number;
  mortonEnd: number;
  center: [number, number, number];
  splatCount: number;
  lodLevel: number; // 0 = Full detail, 1 = 50%, 2 = 25%
  isResidentInVRAM: boolean;
}

export class SplatLODTileManager {
  private tiles: Map<number, SplatTileDescriptor> = new Map();
  private maxTileCapacity: number;

  constructor(maxTileCapacity: number = 65536) {
    this.maxTileCapacity = maxTileCapacity;
  }

  registerTile(descriptor: SplatTileDescriptor): void {
    this.tiles.set(descriptor.tileId, descriptor);
  }

  getTile(tileId: number): SplatTileDescriptor | undefined {
    return this.tiles.get(tileId);
  }

  getAllTiles(): SplatTileDescriptor[] {
    return Array.from(this.tiles.values());
  }

  /**
   * Evaluates camera distance to each tile center and assigns dynamic LoD level.
   * Tiles closer than nearDist get LOD 0 (100% density).
   * Tiles between nearDist and farDist get LOD 1 (50% density).
   * Tiles beyond farDist get LOD 2 (25% density).
   */
  updateLOD(cameraPos: [number, number, number], nearDist: number, farDist: number): void {
    for (const tile of this.tiles.values()) {
      const dx = tile.center[0] - cameraPos[0];
      const dy = tile.center[1] - cameraPos[1];
      const dz = tile.center[2] - cameraPos[2];
      const dist = Math.hypot(dx, dy, dz);

      if (dist <= nearDist) {
        tile.lodLevel = 0;
      } else if (dist <= farDist) {
        tile.lodLevel = 1;
      } else {
        tile.lodLevel = 2;
      }
    }
  }

  /**
   * Sorts tiles by camera proximity for prioritised streaming/paging.
   */
  prioritizeTiles(cameraPos: [number, number, number]): SplatTileDescriptor[] {
    return Array.from(this.tiles.values()).sort((a, b) => {
      const distA = Math.hypot(a.center[0] - cameraPos[0], a.center[1] - cameraPos[1], a.center[2] - cameraPos[2]);
      const distB = Math.hypot(b.center[0] - cameraPos[0], b.center[1] - cameraPos[1], b.center[2] - cameraPos[2]);
      return distA - distB;
    });
  }
}
