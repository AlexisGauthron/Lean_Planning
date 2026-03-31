import { Room } from "./types";

// ─── Manual (real) floor plans ────────────────────────────────────────────────

export interface ManualRoomPos {
  id: string;
  col: number;   // fractional grid column
  row: number;   // fractional grid row
}

export interface ManualFloorLayout {
  campus: string;
  floor: number;
  gridCols: number;
  gridRows: number;
  /** Building outline as [col, row] polygon vertices */
  polygon: [number, number][];
  /** Corridor strips as fractional grid rects */
  corridors: Array<{ col: number; row: number; colSpan: number; rowSpan: number }>;
  rooms: ManualRoomPos[];
}

// ── Eiffel 1 ──────────────────────────────────────────────────────────────────
// Shape: Γ (inverted-L)
//   • Horizontal arm: cols 0→7, rows 0→2  (7 bays wide, 2 bays tall)
//   • Vertical arm  : cols 5→7, rows 2→9  (2 bays wide, 7 bays tall)
// Corridor:
//   • Horizontal: y-center ≈ 1.0  (between rows 0 and 2)
//   • Vertical  : x-center ≈ 6.0  (between cols 5 and 7)
// Room numbering convention (from the plans):
//   • Vertical arm, WEST side (even): 12,14,16,18,20,22,24,26 → top→bottom
//   • Vertical arm, EAST side (odd) : 11,13,15,17,19,21,23,25 → top→bottom
//   • Horizontal arm (higher numbers) : 26+ wrap into horizontal arm
const E1_POLY: [number, number][] = [
  [0, 0], [7, 0], [7, 9], [5, 9], [5, 2], [0, 2],
];
const E1_CORRIDORS = [
  // Horizontal arm corridor (y-center = 1.0)
  { col: 0,    row: 0.82, colSpan: 5.05, rowSpan: 0.36 },
  // Vertical arm corridor (x-center = 6.0)
  { col: 5.82, row: 2,    colSpan: 0.36, rowSpan: 7.1  },
];
const E1_GRID = { cols: 7, rows: 9 };

// West side helper: room number N → row  = 2.15 + (N/2 - 6) * 1
//   12→2.15, 14→3.15, 16→4.15, 18→5.15, 20→6.15, 22→7.15, 24→8.15
// East side helper: odd N → row = 2.15 + ((N-11)/2) * 1
//   11→2.15, 13→3.15, 15→4.15, 17→5.15

const WEST = (n: number): ManualRoomPos => ({ id: `EM${n}`, col: 5.15, row: 2.15 + (n / 2 - 6) });
const EAST = (n: number): ManualRoomPos => ({ id: `EM${n}`, col: 6.15, row: 2.15 + ((n - 11) / 2) });

const EIFFEL1_FLOOR_ROOMS: Record<number, ManualRoomPos[]> = {
  2: [
    WEST(216), WEST(218), WEST(220), WEST(222), WEST(224),
  ],
  3: [
    WEST(312), WEST(314), EAST(317),
    // EM326: even, position 8 → row 2.15 + (26/2 - 6) = row 9.15 is outside arm,
    // so place it in the horizontal arm (south side of h-corridor)
    { id: "EM326", col: 3.15, row: 1.25 },
  ],
  4: [
    WEST(410), WEST(412),
  ],
};

export const MANUAL_FLOOR_PLANS: ManualFloorLayout[] = [2, 3, 4].map((floor) => ({
  campus: "Eiffel 1",
  floor,
  gridCols: E1_GRID.cols,
  gridRows: E1_GRID.rows,
  polygon: E1_POLY,
  corridors: E1_CORRIDORS,
  rooms: EIFFEL1_FLOOR_ROOMS[floor] ?? [],
}));

export function getManualFloorPlan(campus: string, floor: number): ManualFloorLayout | null {
  return MANUAL_FLOOR_PLANS.find((p) => p.campus === campus && p.floor === floor) ?? null;
}

export interface LayoutRoom {
  roomId: string;
  wing: string;
  wingIndex: number;
  colIndex: number;
}

export interface FloorLayout {
  campus: string;
  floor: number;
  rooms: LayoutRoom[];
  wings: string[];
  maxCols: number;
}

/** Extract the wing letter/prefix from a room ID */
function getWing(roomId: string): string {
  // CD-1.11, CD-4.01 → "CD"
  if (roomId.startsWith("CD-")) return "CD";

  // E5-S-1.05 → "E5-S"
  const e5 = roomId.match(/^(E\d-S)/);
  if (e5) return e5[1];

  // G4-H18 → "G4-H"
  const g4 = roomId.match(/^(G\d-[A-Z])/);
  if (g4) return g4[1];

  // EM216, EM312 → "EM"
  const em = roomId.match(/^([A-Z]{2})\d/);
  if (em) return em[1];

  // A-303, B-304, I-401 → "A", "B", "I"
  const letterDash = roomId.match(/^([A-Z])-/);
  if (letterDash) return letterDash[1];

  // 102, 103 (Chartrons) → "Hall"
  if (/^\d/.test(roomId)) return "Hall";

  return roomId[0];
}

/** Numeric sort key within a wing (last number group) */
function sortKey(roomId: string): number {
  const nums = roomId.match(/\d+/g);
  if (!nums) return 0;
  return parseInt(nums[nums.length - 1], 10);
}

/**
 * Groups rooms by campus → floor → wing and assigns grid positions.
 * Returns a nested map: campus → floor → FloorLayout
 */
export function buildFloorLayouts(rooms: Room[]): Map<string, Map<number, FloorLayout>> {
  // Accumulate: campus → floor → wing → roomIds[]
  const tree = new Map<string, Map<number, Map<string, string[]>>>();

  for (const room of rooms) {
    if (!tree.has(room.campus)) tree.set(room.campus, new Map());
    const floorMap = tree.get(room.campus)!;
    if (!floorMap.has(room.floor)) floorMap.set(room.floor, new Map());
    const wingMap = floorMap.get(room.floor)!;
    const wing = getWing(room.id);
    if (!wingMap.has(wing)) wingMap.set(wing, []);
    wingMap.get(wing)!.push(room.id);
  }

  const result = new Map<string, Map<number, FloorLayout>>();

  for (const [campus, floorMap] of tree) {
    const resultFloorMap = new Map<number, FloorLayout>();
    result.set(campus, resultFloorMap);

    for (const [floor, wingMap] of floorMap) {
      const wings = [...wingMap.keys()].sort();
      const layoutRooms: LayoutRoom[] = [];
      let maxCols = 0;

      for (const [wingIndex, wing] of wings.entries()) {
        const ids = wingMap.get(wing)!;
        ids.sort((a, b) => sortKey(a) - sortKey(b));
        for (const [colIndex, roomId] of ids.entries()) {
          layoutRooms.push({ roomId, wing, wingIndex, colIndex });
        }
        maxCols = Math.max(maxCols, ids.length);
      }

      resultFloorMap.set(floor, { campus, floor, rooms: layoutRooms, wings, maxCols });
    }
  }

  return result;
}
