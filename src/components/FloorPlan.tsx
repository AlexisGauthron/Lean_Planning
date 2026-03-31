"use client";

import { useMemo } from "react";
import { Room } from "@/lib/types";
import { buildFloorLayouts, getManualFloorPlan, ManualFloorLayout } from "@/lib/floor-plan-data";

// ── Shared constants ──────────────────────────────────────────────────────────
const CELL_W = 80;   // px per grid column
const CELL_H = 56;   // px per grid row
const PAD_X  = 48;
const PAD_Y  = 40;

interface FloorPlanProps {
  rooms: Room[];
  campus: string;
  floor: number;
  selectedRoomId?: string;
  onSelectRoom?: (roomId: string) => void;
}

// ── Pulse animation (shared) ─────────────────────────────────────────────────
const PULSE_CSS = `
  @keyframes fp-ping {
    0%,100% { transform:scale(1); opacity:0.9; }
    50%      { transform:scale(1.8); opacity:0.25; }
  }
  .fp-ping {
    transform-box:fill-box;
    transform-origin:center;
    animation:fp-ping 1.6s ease-in-out infinite;
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function toSvgX(col: number) { return PAD_X + col * CELL_W; }
function toSvgY(row: number) { return PAD_Y + row * CELL_H; }

// ── Room box ─────────────────────────────────────────────────────────────────
function RoomBox({
  x, y, w, h, label, isSelected, onClick,
}: {
  x: number; y: number; w: number; h: number;
  label: string; isSelected: boolean;
  onClick?: () => void;
}) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <rect
        x={x} y={y} width={w} height={h} rx={6}
        fill={isSelected ? "#00478d" : "#ffffff"}
        stroke={isSelected ? "#00478d" : "#c2c6d4"}
        strokeWidth={isSelected ? 2 : 1}
      />
      {/* door notch */}
      <rect
        x={x + w / 2 - 8} y={y + h - 1}
        width={16} height={3} rx={1}
        fill={isSelected ? "rgba(255,255,255,0.4)" : "#c2c6d4"}
      />
      <text
        x={x + w / 2} y={y + h / 2 + 4}
        textAnchor="middle" fontSize={10} fontWeight="600"
        fill={isSelected ? "#ffffff" : "#191c1d"}
      >
        {label}
      </text>
      {isSelected && (
        <>
          <circle className="fp-ping" cx={x + w - 10} cy={y + 10} r={5}
            fill="rgba(255,255,255,0.55)" />
          <circle cx={x + w - 10} cy={y + 10} r={3.5}
            fill="white" opacity={0.95} />
        </>
      )}
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Manual (real) floor plan renderer ────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function ManualPlan({
  layout, selectedRoomId, onSelectRoom,
}: {
  layout: ManualFloorLayout;
  selectedRoomId?: string;
  onSelectRoom?: (id: string) => void;
}) {
  const svgW = PAD_X * 2 + layout.gridCols * CELL_W;
  const svgH = PAD_Y * 2 + layout.gridRows * CELL_H;

  const polyPoints = layout.polygon
    .map(([c, r]) => `${toSvgX(c)},${toSvgY(r)}`)
    .join(" ");

  const ROOM_W = CELL_W - 10;
  const ROOM_H = CELL_H - 10;

  return (
    <div className="w-full overflow-x-auto">
      <style>{PULSE_CSS}</style>
      <svg
        width={svgW} height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ fontFamily: "Inter, sans-serif", maxWidth: "100%", display: "block" }}
      >
        {/* ── Outer wall shadow ── */}
        <polygon
          points={polyPoints}
          fill="none"
          stroke="#b0b8c8"
          strokeWidth={3}
          strokeLinejoin="round"
          opacity={0.35}
          transform="translate(2,3)"
        />

        {/* ── Building fill ── */}
        <polygon
          points={polyPoints}
          fill="#f0f2f5"
          stroke="#9aa3b8"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* ── Staircase annexe hints (decorative dashes) ── */}
        {/* top-left corner annex */}
        <rect
          x={toSvgX(0) - 28} y={toSvgY(0)}
          width={30} height={toSvgY(2) - toSvgY(0)}
          rx={6}
          fill="#e8eaf0" stroke="#b8bece"
          strokeWidth={1} strokeDasharray="4 3"
        />
        {/* bottom annex */}
        <rect
          x={toSvgX(5)} y={toSvgY(layout.gridRows)}
          width={toSvgX(7) - toSvgX(5)} height={28}
          rx={6}
          fill="#e8eaf0" stroke="#b8bece"
          strokeWidth={1} strokeDasharray="4 3"
        />

        {/* ── Corridors ── */}
        {layout.corridors.map((c, i) => (
          <rect
            key={i}
            x={toSvgX(c.col)} y={toSvgY(c.row)}
            width={c.colSpan * CELL_W} height={c.rowSpan * CELL_H}
            rx={4} fill="#d4d9ee"
          />
        ))}

        {/* ── Staircase icon (top-left) ── */}
        <g opacity={0.5} transform={`translate(${toSvgX(0) + 6},${toSvgY(0) + 6})`}>
          <rect x={0} y={8} width={8}  height={4} rx={1} fill="#424752" />
          <rect x={0} y={4} width={13} height={4} rx={1} fill="#424752" />
          <rect x={0} y={0} width={18} height={4} rx={1} fill="#424752" />
        </g>

        {/* ── Elevator icon (near stairs) ── */}
        <g opacity={0.4} transform={`translate(${toSvgX(1) + 6},${toSvgY(0) + 8})`}>
          <rect x={0} y={0} width={14} height={16} rx={2}
            fill="none" stroke="#424752" strokeWidth={1.5} />
          <text x={7} y={12} textAnchor="middle" fontSize={8} fill="#424752" fontWeight="700">
            ASC
          </text>
        </g>

        {/* ── Wing/section labels ── */}
        <text
          x={toSvgX(2.5)} y={toSvgY(0) + 14}
          textAnchor="middle" fontSize={9} fontWeight="700"
          fill="#6b7280" letterSpacing="1"
        >
          BRAS HORIZONTAL
        </text>
        <text
          x={toSvgX(5) + 12} y={toSvgY(5.5)}
          fontSize={9} fontWeight="700"
          fill="#6b7280" letterSpacing="1"
          transform={`rotate(-90, ${toSvgX(5) + 12}, ${toSvgY(5.5)})`}
        >
          BRAS VERTICAL
        </text>

        {/* ── Room boxes ── */}
        {layout.rooms.map((rm) => (
          <RoomBox
            key={rm.id}
            x={toSvgX(rm.col)} y={toSvgY(rm.row)}
            w={ROOM_W} h={ROOM_H}
            label={rm.id}
            isSelected={rm.id === selectedRoomId}
            onClick={() => onSelectRoom?.(rm.id)}
          />
        ))}
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Auto-layout floor plan renderer ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
const CORRIDOR_H  = 14;
const ROW_SPACING = 32;

function AutoPlan({
  rooms, campus, floor, selectedRoomId, onSelectRoom,
}: FloorPlanProps) {
  const layouts = useMemo(() => buildFloorLayouts(rooms), [rooms]);
  const layout  = layouts.get(campus)?.get(floor);

  if (!layout || layout.rooms.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 rounded-2xl text-sm"
        style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
      >
        Aucune salle connue sur cet étage
      </div>
    );
  }

  const numWings = layout.wings.length;
  const AUTO_PAD_X = 56;
  const AUTO_PAD_Y = 44;
  const svgW = AUTO_PAD_X * 2 + layout.maxCols * (CELL_W + 8) - 8;
  const svgH =
    AUTO_PAD_Y * 2 +
    numWings * CELL_H +
    Math.max(0, numWings - 1) * ROW_SPACING;

  const wingY = (wi: number) => AUTO_PAD_Y + wi * (CELL_H + ROW_SPACING);
  const ROOM_W = CELL_W;
  const ROOM_H = CELL_H - 4;

  return (
    <div className="w-full overflow-x-auto">
      <style>{PULSE_CSS}</style>
      <svg
        width={svgW} height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ fontFamily: "Inter, sans-serif", maxWidth: "100%", display: "block" }}
      >
        {/* Building shell */}
        <rect
          x={AUTO_PAD_X / 2 - 4} y={AUTO_PAD_Y / 2 - 4}
          width={svgW - AUTO_PAD_X + 8} height={svgH - AUTO_PAD_Y + 8}
          rx={14} fill="#f2f4f5" stroke="#c2c6d4" strokeWidth={1.5}
        />

        {/* Corridor strips */}
        {layout.wings.map((_, wi) => {
          if (wi >= numWings - 1) return null;
          const cy = wingY(wi) + ROOM_H + (ROW_SPACING - CORRIDOR_H) / 2;
          return (
            <rect
              key={`c${wi}`}
              x={AUTO_PAD_X / 2} y={cy}
              width={svgW - AUTO_PAD_X} height={CORRIDOR_H}
              rx={4} fill="#dde1f0"
            />
          );
        })}

        {/* Staircase */}
        <g opacity={0.4} transform={`translate(${AUTO_PAD_X / 2 + 6},${AUTO_PAD_Y / 2 + 6})`}>
          <rect x={0} y={8} width={6}  height={4} rx={1} fill="#424752" />
          <rect x={0} y={4} width={10} height={4} rx={1} fill="#424752" />
          <rect x={0} y={0} width={14} height={4} rx={1} fill="#424752" />
        </g>

        {/* Wing labels */}
        {layout.wings.map((wing, wi) => (
          <text
            key={`wl${wing}`}
            x={AUTO_PAD_X / 2 + 6}
            y={wingY(wi) + ROOM_H / 2 + 4}
            fontSize={9} fontWeight="700" fill="#6b7280" letterSpacing="0.6"
          >
            {wing}
          </text>
        ))}

        {/* Rooms */}
        {layout.rooms.map((cell) => {
          const x = AUTO_PAD_X + cell.colIndex * (CELL_W + 8);
          const y = wingY(cell.wingIndex);
          return (
            <RoomBox
              key={cell.roomId}
              x={x} y={y} w={ROOM_W} h={ROOM_H}
              label={cell.roomId}
              isSelected={cell.roomId === selectedRoomId}
              onClick={() => onSelectRoom?.(cell.roomId)}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Public component (dispatcher) ────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
export function FloorPlan(props: FloorPlanProps) {
  const manual = getManualFloorPlan(props.campus, props.floor);

  if (manual) {
    return (
      <ManualPlan
        layout={manual}
        selectedRoomId={props.selectedRoomId}
        onSelectRoom={props.onSelectRoom}
      />
    );
  }

  return <AutoPlan {...props} />;
}
