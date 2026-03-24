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
  const percentage = total > 0 ? Math.round((freeCount / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-green-600">{freeCount}</span>
        <span className="text-gray-500">/ {total} salles libres</span>
      </div>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-400">{percentage}%</span>
    </div>
  );
}
