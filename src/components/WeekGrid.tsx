"use client";

import { Room, Booking, SharedBooking } from "@/lib/types";
import { isRoomFreeAt } from "@/lib/availability";
import { getMonday, getWeekDays, getDayName, formatShortDate, toLocalISO } from "@/lib/date-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TIME_SLOTS = [
  "08:30", "09:30", "10:45", "13:00", "14:00", "15:15", "16:15", "17:30", "18:30", "19:45",
];

interface WeekGridProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: string;
  sharedBookings?: SharedBooking[];
  mySharedBookings?: SharedBooking[];
  onWeekChange: (mondayISO: string) => void;
  onSelectDate?: (dateISO: string) => void;
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function WeekGrid({ rooms, bookings, selectedDate, sharedBookings = [], mySharedBookings = [], onWeekChange, onSelectDate }: WeekGridProps) {
  const monday = selectedDate
    ? getMonday(new Date(selectedDate + "T00:00:00"))
    : getMonday(new Date());
  const weekDays = getWeekDays(monday);

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const prevWeek = () => {
    const prev = new Date(monday);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(toLocalISO(prev));
  };

  const nextWeek = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    onWeekChange(toLocalISO(next));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Nav semaine */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevWeek}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
          Semaine du {formatShortDate(weekDays[0])} au {formatShortDate(weekDays[4])}
        </span>
        <button
          onClick={nextWeek}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grille */}
      <div
        className="overflow-x-auto rounded-2xl"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "0 4px 20px rgba(25,28,29,0.04)" }}
      >
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th
                className="sticky left-0 px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest w-24"
                style={{
                  background: "var(--surface-container-low)",
                  color: "var(--on-surface-variant)",
                  borderRight: "1px solid var(--surface-container)",
                  borderBottom: "1px solid var(--surface-container)",
                }}
              >
                Salle
              </th>
              {weekDays.map((day) => {
                const isSelected = day === selectedDate;
                const isDayPast = day < todayISO;
                return (
                  <th
                    key={day}
                    colSpan={TIME_SLOTS.length}
                    className="px-2 py-3 text-center text-xs font-semibold transition-colors"
                    style={{
                      background: isSelected ? "rgba(0,71,141,0.08)" : "var(--surface-container-low)",
                      color: isDayPast ? "var(--on-surface-variant)" : isSelected ? "var(--primary)" : "var(--on-surface)",
                      borderLeft: "1px solid var(--surface-container)",
                      borderBottom: "1px solid var(--surface-container)",
                      opacity: isDayPast ? 0.5 : 1,
                      cursor: isDayPast ? "default" : "pointer",
                    }}
                    onClick={() => !isDayPast && onSelectDate?.(day)}
                    title={isDayPast ? `${getDayName(day)} ${formatShortDate(day)} — date passée` : `Voir le ${getDayName(day)} ${formatShortDate(day)}`}
                  >
                    {getDayName(day)} {formatShortDate(day)}
                    {isDayPast && <div className="text-[9px] font-normal opacity-70">passé</div>}
                  </th>
                );
              })}
            </tr>
            <tr>
              <th
                className="sticky left-0"
                style={{
                  background: "var(--surface-container-low)",
                  borderRight: "1px solid var(--surface-container)",
                  borderBottom: "1px solid var(--surface-container)",
                }}
              />
              {weekDays.map((day) =>
                TIME_SLOTS.map((time, i) => (
                  <th
                    key={`${day}-${time}`}
                    className="px-0.5 py-2 text-center text-[8px] sm:text-[10px]"
                    style={{
                      color: "var(--on-surface-variant)",
                      background: "var(--surface-container-low)",
                      borderLeft: i === 0 ? "1px solid var(--surface-container)" : undefined,
                      borderBottom: "1px solid var(--surface-container)",
                    }}
                  >
                    {time}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, rowIdx) => (
              <tr key={room.id}>
                <td
                  className="sticky left-0 px-3 py-2 text-xs font-medium whitespace-nowrap"
                  style={{
                    background: rowIdx % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
                    color: "var(--on-surface)",
                    borderRight: "1px solid var(--surface-container)",
                    borderBottom: "1px solid var(--surface-container-high)",
                  }}
                >
                  <div style={{ fontFamily: "Manrope, sans-serif" }}>{room.id}</div>
                  <div className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                    {room.capacity > 0 ? `${room.capacity}p` : "—"}
                  </div>
                </td>
                {weekDays.map((day) =>
                  TIME_SLOTS.map((time, i) => {
                    const free = isRoomFreeAt(room.id, day, time, bookings);
                    // Check partial: free but has partial shared bookings at that time
                    const hasPartial = free && sharedBookings.some(
                      (sb) => sb.roomId === room.id && sb.date === day && sb.type === "partial"
                        && sb.start <= time && sb.end > time
                    );
                    const hasAsso = sharedBookings.some(
                      (sb) => sb.roomId === room.id && sb.date === day && sb.type === "full"
                        && sb.start <= time && sb.end > time
                    );
                    const hasMine = mySharedBookings.some(
                      (sb) => sb.roomId === room.id && sb.date === day
                        && sb.start <= time && sb.end > time
                    );
                    const isPast = day < todayISO || (day === todayISO && toMinutes(time) < nowMinutes);
                    const dotColor = isPast
                      ? "var(--surface-container-high)"
                      : hasMine ? "var(--primary)"
                      : (!free || hasAsso) ? "#ef9a9a"
                      : hasPartial ? "#ffa000"
                      : "var(--secondary)";
                    const label = isPast ? "Passé" : !free || hasAsso ? "Occupé" : hasPartial ? "Places limitées" : "Libre";
                    return (
                      <td
                        key={`${room.id}-${day}-${time}`}
                        className="px-0 py-2 text-center"
                        style={{
                          background: rowIdx % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
                          borderLeft: i === 0 ? "1px solid var(--surface-container)" : undefined,
                          borderBottom: "1px solid var(--surface-container-high)",
                          opacity: isPast ? 0.45 : 1,
                        }}
                        title={`${room.id} · ${getDayName(day)} ${time} · ${label}`}
                      >
                        <div
                          className={`mx-auto w-4 h-4 rounded-sm transition-all ${!isPast ? "hover:opacity-70 cursor-pointer hover:scale-110" : "cursor-default"}`}
                          style={{ background: dotColor }}
                          onClick={() => !isPast && free && onSelectDate?.(day)}
                        />
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--secondary)" }} />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#ffa000" }} />
          <span>Places limitées</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#ef9a9a" }} />
          <span>Occupé</span>
        </div>
      </div>
    </div>
  );
}
