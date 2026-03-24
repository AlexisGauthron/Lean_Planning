"use client";

import { Room, Booking, FreeSlot } from "@/lib/types";
import { computeFreeSlots } from "@/lib/availability";
import { Users, Wifi, MapPin } from "lucide-react";

interface RoomListProps {
  rooms: Room[];
  bookings: Booking[];
  date: string;
}

function SlotBadge({ slot, type }: { slot: { start: string; end: string }; type: "free" | "busy" }) {
  const isFree = type === "free";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isFree ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {slot.start} - {slot.end}
    </span>
  );
}

export function RoomList({ rooms, bookings, date }: RoomListProps) {
  if (!date) {
    return (
      <div className="text-center py-12 text-gray-400">
        Selectionnez une date pour voir la disponibilite des salles
      </div>
    );
  }

  const roomsWithAvailability = rooms
    .map((room) => {
      const { freeSlots, busySlots } = computeFreeSlots(room.id, date, bookings);
      return { room, freeSlots, busySlots };
    })
    .sort((a, b) => b.freeSlots.length - a.freeSlots.length);

  return (
    <div className="grid gap-3">
      {roomsWithAvailability.map(({ room, freeSlots, busySlots }) => {
        const isFree = freeSlots.length > 0;
        return (
          <div
            key={room.id}
            className={`p-4 rounded-xl border transition-shadow hover:shadow-md ${
              isFree ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{room.id}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isFree ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isFree ? `${freeSlots.length} creneau(x) libre(s)` : "Occupe"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{room.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {room.campus}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {room.capacity} places
              </span>
              {room.equipment.length > 0 && (
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  {room.equipment.join(", ")}
                </span>
              )}
            </div>

            {freeSlots.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-600 mr-2">Libre :</span>
                <div className="inline-flex flex-wrap gap-1">
                  {freeSlots.map((slot, i) => (
                    <SlotBadge key={i} slot={slot} type="free" />
                  ))}
                </div>
              </div>
            )}

            {busySlots.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-600 mr-2">Occupe :</span>
                <div className="inline-flex flex-wrap gap-1">
                  {busySlots.map((slot, i) => (
                    <SlotBadge key={i} slot={slot} type="busy" />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
