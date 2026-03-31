"use client";

import { Room, Booking } from "@/lib/types";
import { isRoomFreeAt } from "@/lib/availability";

interface FreeRoomCounterProps {
  rooms: Room[];
  bookings: Booking[];
  date: string;
  time: string;
}

export function FreeRoomCounter({ rooms, bookings, date, time }: FreeRoomCounterProps) {
  const freeCount = rooms.filter((room) => isRoomFreeAt(room.id, date, time, bookings)).length;
  const total = rooms.length;

  return (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-5"
      style={{ background: "var(--secondary-container)" }}
    >
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--on-secondary-container)" }}
        >
          Live Availability
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-extrabold"
            style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-secondary-container)" }}
          >
            {freeCount}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--on-secondary-container)" }}>
            Rooms Free
          </span>
          {total > 0 && (
            <span className="text-xs" style={{ color: "var(--secondary)" }}>
              / {total}
            </span>
          )}
        </div>
      </div>

      {/* Avatar stack */}
      <div className="flex items-center">
        {[...Array(Math.min(4, freeCount))].map((_, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--secondary)",
              borderColor: "var(--secondary-container)",
              color: "white",
              marginLeft: i > 0 ? "-8px" : "0",
              zIndex: 4 - i,
            }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        {freeCount > 4 && (
          <div
            className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--on-secondary-container)",
              borderColor: "var(--secondary-container)",
              color: "white",
              marginLeft: "-8px",
            }}
          >
            +{freeCount - 4}
          </div>
        )}
      </div>
    </div>
  );
}
