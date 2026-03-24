"use client";

import { Room, Booking } from "@/lib/types";
import { isRoomFreeAt } from "@/lib/availability";
import { getMonday, getWeekDays, getDayName, formatShortDate, toLocalISO } from "@/lib/date-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TIME_SLOTS = [
  "08:30", "09:30", "10:45", "13:00", "14:00", "15:15", "16:15", "17:30", "18:30", "19:45",
];

const TIME_LABELS = [
  "08:30", "09:30", "10:45", "13:00", "14:00", "15:15", "16:15", "17:30", "18:30", "19:45",
];

interface WeekGridProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: string;
  onWeekChange: (mondayISO: string) => void;
}

export function WeekGrid({ rooms, bookings, selectedDate, onWeekChange }: WeekGridProps) {
  const monday = selectedDate
    ? getMonday(new Date(selectedDate + "T00:00:00"))
    : getMonday(new Date());
  const weekDays = getWeekDays(monday);

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
    <div className="flex flex-col gap-3">
      {/* Navigation semaine */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          Semaine du {formatShortDate(weekDays[0])} au {formatShortDate(weekDays[4])}
        </span>
        <button
          onClick={nextWeek}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grille */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-20 border-b border-r border-gray-200">
                Salle
              </th>
              {weekDays.map((day) => (
                <th
                  key={day}
                  colSpan={TIME_SLOTS.length}
                  className="px-2 py-2.5 text-center text-xs font-semibold text-gray-700 border-b border-l border-gray-200"
                >
                  {getDayName(day)} {formatShortDate(day)}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 border-b border-r border-gray-200" />
              {weekDays.map((day) =>
                TIME_LABELS.map((time, i) => (
                  <th
                    key={`${day}-${time}`}
                    className={`px-0.5 py-1.5 text-center text-[10px] text-gray-400 border-b border-gray-200 ${i === 0 ? "border-l" : ""}`}
                  >
                    {time}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, rowIdx) => (
              <tr key={room.id} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="sticky left-0 bg-inherit px-3 py-1.5 font-medium text-gray-800 text-xs whitespace-nowrap border-r border-gray-200">
                  <div>{room.id}</div>
                  <div className="text-[10px] text-gray-400 font-normal">{room.capacity}p</div>
                </td>
                {weekDays.map((day) =>
                  TIME_SLOTS.map((time, i) => {
                    const free = isRoomFreeAt(room.id, day, time, bookings);
                    return (
                      <td
                        key={`${room.id}-${day}-${time}`}
                        className={`px-0 py-1.5 text-center border-gray-200 ${i === 0 ? "border-l" : ""}`}
                        title={`${room.id} - ${getDayName(day)} ${time} - ${free ? "Libre" : "Occupe"}`}
                      >
                        <div
                          className={`mx-auto w-4 h-4 rounded-sm ${
                            free
                              ? "bg-green-400 hover:bg-green-500"
                              : "bg-red-400 hover:bg-red-500"
                          } transition-colors cursor-default`}
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

      {/* Legende */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <span>Occupe</span>
        </div>
      </div>
    </div>
  );
}
