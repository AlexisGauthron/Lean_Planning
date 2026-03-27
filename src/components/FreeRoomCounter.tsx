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

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "var(--secondary-container)" }}
    >
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--on-secondary-container)" }}>
        Live Availability
      </span>
      <div className="flex items-baseline gap-2">
        <span
          className="text-4xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-secondary-container)" }}
        >
          {freeCount}
        </span>
        <span className="text-base font-semibold" style={{ color: "var(--on-secondary-container)" }}>
          Rooms Free
        </span>
      </div>
      <div className="flex gap-1 mt-1">
        {[...Array(Math.min(5, freeCount))].map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 border-white"
            style={{ background: `hsl(${140 + i * 10}, 60%, 50%)`, marginLeft: i > 0 ? "-8px" : "0" }}
          />
        ))}
        {freeCount > 5 && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--secondary)", color: "white", marginLeft: "-8px" }}
          >
            +{freeCount - 5}
          </div>
        )}
      </div>
    </div>
  );
}
