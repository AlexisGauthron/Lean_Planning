"use client";

import { Room, Booking } from "@/lib/types";
import { computeFreeSlots } from "@/lib/availability";
import { Users, MapPin, Layers } from "lucide-react";

interface RoomListProps {
  rooms: Room[];
  bookings: Booking[];
  date: string;
}

const EQUIPMENT_ICONS: Record<string, string> = {
  "Labo Elec": "⚡",
  "Labo Info": "💻",
  "Labo Elec / Info": "⚡",
  "Labo": "🔬",
  "Meet-up": "📡",
  "Jabra": "🎙️",
  "Clevertouch": "🖥️",
  "Chariot info": "🛒",
};

function SlotChip({ slot }: { slot: { start: string; end: string } }) {
  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
    >
      {slot.start}
    </span>
  );
}

export function RoomList({ rooms, bookings, date }: RoomListProps) {
  if (!date) {
    return (
      <div
        className="text-center py-16 rounded-2xl"
        style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
      >
        Sélectionnez une date pour voir la disponibilité des salles
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
    <div className="flex flex-col">
      {/* Table header */}
      <div
        className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr_auto] gap-4 px-4 py-2 rounded-xl mb-2"
        style={{ background: "transparent" }}
      >
        {["Room Information", "Capacity", "Floor", "Status", "Available Slots", "Action"].map((h) => (
          <span key={h} className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {roomsWithAvailability.map(({ room, freeSlots, busySlots }) => {
          const isFree = freeSlots.length > 0;
          return (
            <div
              key={room.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr_auto] gap-4 items-center px-4 py-4 rounded-2xl transition-all hover:shadow-[0_4px_20px_rgba(25,28,29,0.06)]"
              style={{ background: "var(--surface-container-lowest)" }}
            >
              {/* Room info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: "var(--surface-container-low)" }}
                >
                  {room.equipment.length > 0
                    ? (EQUIPMENT_ICONS[room.equipment[0]] ?? "🏫")
                    : "🏫"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
                    {room.id}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <MapPin className="w-3 h-3" />
                      {room.campus}
                    </span>
                    {room.equipment.slice(0, 2).map((eq) => (
                      <span
                        key={eq}
                        className="px-1.5 py-0.5 rounded-md text-xs"
                        style={{ background: "var(--tertiary-fixed)", color: "var(--on-surface-variant)" }}
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--surface-container)", color: "var(--on-surface)" }}
                >
                  {room.capacity > 0 ? room.capacity : "—"}
                </div>
              </div>

              {/* Floor */}
              <div className="flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                <Layers className="w-3.5 h-3.5" />
                {room.floor > 0 ? `L${room.floor}` : "—"}
              </div>

              {/* Status */}
              <div>
                {isFree ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006e1c] inline-block" />
                    Available
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#ffdad6", color: "#93000a" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] inline-block" />
                    Occupied
                  </span>
                )}
              </div>

              {/* Available slots */}
              <div className="flex items-center flex-wrap gap-1.5">
                {freeSlots.length > 0 ? (
                  <>
                    {freeSlots.slice(0, 3).map((slot, i) => (
                      <SlotChip key={i} slot={slot} />
                    ))}
                    {freeSlots.length > 3 && (
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        +{freeSlots.length - 3}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>—</span>
                )}
              </div>

              {/* Action */}
              <div>
                {isFree ? (
                  <button
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                      color: "var(--on-primary)",
                    }}
                  >
                    Book
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: "var(--surface-container)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Waitlist
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
