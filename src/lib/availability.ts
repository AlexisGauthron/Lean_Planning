import { Room, Booking, FreeSlot, RoomAvailability } from "./types";

// Creneaux standard de la journee
const DAY_START = "08:30";
const DAY_END = "20:30";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calcule les creneaux libres pour une salle a une date donnee
 */
export function computeFreeSlots(
  roomId: string,
  date: string,
  bookings: Booking[]
): { freeSlots: FreeSlot[]; busySlots: { start: string; end: string }[] } {
  // Filtrer les bookings pour cette salle et cette date
  const roomBookings = bookings
    .filter((b) => b.roomId === roomId && b.date === date)
    .map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  // Fusionner les creneaux qui se chevauchent
  const merged: { start: number; end: number }[] = [];
  for (const slot of roomBookings) {
    if (merged.length > 0 && slot.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, slot.end);
    } else {
      merged.push({ ...slot });
    }
  }

  // Calculer les creneaux libres (inverse des occupes)
  const dayStart = timeToMinutes(DAY_START);
  const dayEnd = timeToMinutes(DAY_END);
  const freeSlots: FreeSlot[] = [];

  let current = dayStart;
  for (const busy of merged) {
    if (current < busy.start) {
      freeSlots.push({
        start: minutesToTime(current),
        end: minutesToTime(busy.start),
      });
    }
    current = Math.max(current, busy.end);
  }
  if (current < dayEnd) {
    freeSlots.push({
      start: minutesToTime(current),
      end: minutesToTime(dayEnd),
    });
  }

  const busySlots = merged.map((s) => ({
    start: minutesToTime(s.start),
    end: minutesToTime(s.end),
  }));

  return { freeSlots, busySlots };
}

/**
 * Calcule la disponibilite de toutes les salles pour une date
 */
export function computeAllAvailability(
  rooms: Room[],
  bookings: Booking[],
  date: string
): RoomAvailability[] {
  return rooms.map((room) => {
    const { freeSlots, busySlots } = computeFreeSlots(room.id, date, bookings);
    return { room, date, freeSlots, busySlots };
  });
}

/**
 * Verifie si une salle est libre a un moment donne
 */
export function isRoomFreeAt(
  roomId: string,
  date: string,
  time: string,
  bookings: Booking[]
): boolean {
  const timeMin = timeToMinutes(time);
  return !bookings.some(
    (b) =>
      b.roomId === roomId &&
      b.date === date &&
      timeMin >= timeToMinutes(b.startTime) &&
      timeMin < timeToMinutes(b.endTime)
  );
}

/**
 * Compte les salles libres a un moment donne
 */
export function countFreeRooms(
  rooms: Room[],
  bookings: Booking[],
  date: string,
  time: string
): number {
  return rooms.filter((room) => isRoomFreeAt(room.id, date, time, bookings)).length;
}
