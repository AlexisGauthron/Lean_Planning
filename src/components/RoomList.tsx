"use client";

import { useState } from "react";
import { Room, Booking, SharedBooking } from "@/lib/types";
import { computeFreeSlots } from "@/lib/availability";
import { MapPin, Layers, Users, Heart, X, Check, Map, Clock, ArrowRight, Minus, Plus } from "lucide-react";

interface RoomListProps {
  rooms: Room[];
  bookings: Booking[];
  date: string;
  favorites: Set<string>;
  slotDuration?: number; // hours, default 1
  userType?: "student" | "association" | "prof" | "admin";
  studentMaxSeats?: number;
  sharedBookings?: SharedBooking[];
  mySharedBookings?: SharedBooking[];
  onToggleFavorite: (roomId: string) => void;
  onViewOnMap?: (roomId: string) => void;
  onSelectRoom?: (roomId: string) => void;
  onBook?: (roomId: string, campus: string, date: string, slot: { start: string; end: string }, bookingType: "full" | "partial", seats: number) => void;
}

const EQUIPMENT_ICONS: Record<string, string> = {
  "Labo Elec": "⚡", "Labo Info": "💻", "Labo Elec / Info": "⚡",
  "Labo": "🔬", "Meet-up": "📡", "Jabra": "🎙️",
  "Clevertouch": "🖥️", "Chariot info": "🛒",
};

// ─── Time helpers ──────────────────────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getCurrentTimeMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
// Round up to the next 30-min mark so "now" blocks start at a clean time
function roundUpTo30(min: number) {
  return Math.ceil(min / 30) * 30;
}

function generateBlocks(freeSlots: { start: string; end: string }[], durationH: number, filterPastFor?: string) {
  const blocks: { start: string; end: string }[] = [];
  // Date entièrement passée → aucun créneau
  if (filterPastFor && filterPastFor < getTodayISO()) return blocks;
  const durationMin = durationH * 60;
  const isToday = !!filterPastFor && filterPastFor === getTodayISO();
  // Start from the next clean 30-min mark so ongoing free windows are shown
  const startFloor = isToday ? roundUpTo30(getCurrentTimeMinutes()) : 0;

  for (const slot of freeSlots) {
    const slotEnd = timeToMinutes(slot.end);
    // Start from max(slot start, current rounded time) to skip past blocks
    let cur = isToday
      ? Math.max(timeToMinutes(slot.start), startFloor)
      : timeToMinutes(slot.start);

    while (cur + durationMin <= slotEnd) {
      blocks.push({ start: minutesToTime(cur), end: minutesToTime(cur + durationMin) });
      cur += durationMin;
    }
  }
  return blocks;
}

// ─── Booking modal ─────────────────────────────────────────────────────────────
function BookingModal({ room, slot, date, onClose, onBook, userType = "student", seatsLeft, hasAnyBooking, studentMaxSeats }: {
  room: Room; slot: { start: string; end: string }; date: string; onClose: () => void;
  onBook?: (roomId: string, campus: string, date: string, slot: { start: string; end: string }, bookingType: "full" | "partial", seats: number) => void;
  userType?: "student" | "association" | "prof" | "admin";
  seatsLeft?: number;
  hasAnyBooking?: boolean;
  studentMaxSeats?: number;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const maxSeats = seatsLeft ?? room.capacity;
  const canBookFull = userType !== "student";
  const effectiveSeatMax = (userType === "student" && studentMaxSeats) ? Math.min(maxSeats, studentMaxSeats) : maxSeats;
  const [seats, setSeats] = useState(Math.min(1, effectiveSeatMax));

  // Full-room bookers blocked if anyone else already has seats
  const assocBlocked = canBookFull && (hasAnyBooking ?? false);
  // Student blocked if no seats left
  const studentBlocked = !canBookFull && maxSeats <= 0;
  const isBlocked = assocBlocked || studentBlocked;

  const handleConfirm = () => {
    if (isBlocked) return;
    const bookingType = canBookFull ? "full" : "partial";
    const bookedSeats = canBookFull ? room.capacity : seats;
    onBook?.(room.id, room.campus, date, slot, bookingType, bookedSeats);
    setConfirmed(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "0 24px 60px rgba(25,28,29,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--secondary-container)" }}>
              <Check className="w-7 h-7" style={{ color: "var(--secondary)" }} />
            </div>
            <p className="font-bold text-lg text-center" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
              Réservation confirmée !
            </p>
            <p className="text-sm text-center" style={{ color: "var(--on-surface-variant)" }}>
              {room.id} · {slot.start} – {slot.end}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Confirmer la réservation
                </p>
                <h3 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
                  {room.id}
                </h3>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{room.campus}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                <X className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
              </button>
            </div>

            {/* Summary */}
            <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--surface-container-low)" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  <span className="text-base font-bold" style={{ color: "var(--on-surface)" }}>{slot.start} – {slot.end}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
                  {(timeToMinutes(slot.end) - timeToMinutes(slot.start)) / 60}h
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--on-surface-variant)" }}>Date</span>
                <span className="font-medium" style={{ color: "var(--on-surface)" }}>{date}</span>
              </div>
              {canBookFull ? (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--on-surface-variant)" }}>Réservation</span>
                  <span className="font-medium" style={{ color: "var(--on-surface)" }}>Salle entière ({room.capacity > 0 ? `${room.capacity} places` : "—"})</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--on-surface-variant)" }}>Places disponibles</span>
                    <span className="font-medium" style={{ color: maxSeats > 0 ? "var(--on-surface)" : "rgba(255,100,100,1)" }}>{maxSeats} / {room.capacity}</span>
                  </div>
                  {studentMaxSeats && effectiveSeatMax < maxSeats && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--on-surface-variant)" }}>Votre limite</span>
                      <span className="font-medium" style={{ color: "rgba(255,160,0,1)" }}>max {studentMaxSeats} places</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Nombre de places</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSeats((s) => Math.max(1, s - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                        <Minus className="w-3 h-3" style={{ color: "var(--on-surface)" }} />
                      </button>
                      <span className="text-base font-bold w-6 text-center" style={{ color: "var(--on-surface)" }}>{seats}</span>
                      <button onClick={() => setSeats((s) => Math.min(effectiveSeatMax, s + 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                        <Plus className="w-3 h-3" style={{ color: "var(--on-surface)" }} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {isBlocked && (
              <div className="rounded-xl px-4 py-3 text-xs text-center" style={{ background: "rgba(255,100,100,0.15)", color: "rgba(255,100,100,1)" }}>
                {assocBlocked
                  ? "Des places sont déjà réservées dans ce créneau. Une association doit avoir la salle entière."
                  : "Plus aucune place disponible sur ce créneau."}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-full text-sm font-semibold" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={isBlocked}
                className="flex-1 py-3 rounded-full text-sm font-semibold"
                style={{
                  background: isBlocked ? "var(--surface-container-high)" : "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                  color: isBlocked ? "var(--on-surface-variant)" : "var(--on-primary)",
                  cursor: isBlocked ? "not-allowed" : "pointer",
                }}
              >
                {canBookFull ? "Réserver la salle" : `Réserver ${seats} place${seats > 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── RoomList ─────────────────────────────────────────────────────────────────
function getSlotAvailability(
  roomId: string, capacity: number, date: string, start: string, end: string, sharedBookings: SharedBooking[]
): { seatsLeft: number; hasAnyBooking: boolean } {
  const relevant = sharedBookings.filter(
    (b) => b.roomId === roomId && b.date === date && !(b.end <= start || b.start >= end)
  );
  if (relevant.some((b) => b.type === "full")) return { seatsLeft: 0, hasAnyBooking: true };
  const usedSeats = relevant.reduce((sum, b) => sum + b.seats, 0);
  return { seatsLeft: Math.max(0, capacity - usedSeats), hasAnyBooking: relevant.length > 0 };
}

export function RoomList({ rooms, bookings, date, favorites, slotDuration = 1, userType = "student", studentMaxSeats, sharedBookings = [], mySharedBookings = [], onToggleFavorite, onViewOnMap, onSelectRoom, onBook }: RoomListProps) {
  const [bookingModal, setBookingModal] = useState<{ room: Room; slot: { start: string; end: string } } | null>(null);

  if (!date) {
    return (
      <div className="text-center py-16 rounded-2xl text-sm" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
        Sélectionnez une date pour voir la disponibilité
      </div>
    );
  }

  const roomsWithBlocks = rooms.map((room) => {
    const { freeSlots, busySlots } = computeFreeSlots(room.id, date, bookings);
    const hourBlocks = generateBlocks(freeSlots, slotDuration, date);
    return { room, hourBlocks, busySlots };
  });

  return (
    <>
      {bookingModal && (() => {
        const { seatsLeft, hasAnyBooking } = getSlotAvailability(
          bookingModal.room.id, bookingModal.room.capacity, date,
          bookingModal.slot.start, bookingModal.slot.end, sharedBookings
        );
        return (
          <BookingModal
            room={bookingModal.room}
            slot={bookingModal.slot}
            date={date}
            onClose={() => setBookingModal(null)}
            onBook={onBook}
            userType={userType}
            seatsLeft={seatsLeft}
            hasAnyBooking={hasAnyBooking}
            studentMaxSeats={studentMaxSeats}
          />
        );
      })()}

      <div className="flex flex-col gap-3">
        {roomsWithBlocks.map(({ room, hourBlocks }) => {
          const isFree = hourBlocks.length > 0;
          const icon   = room.equipment.length > 0 ? (EQUIPMENT_ICONS[room.equipment[0]] ?? "🏫") : "🏫";
          const isFav  = favorites.has(room.id);
          const MAX_INLINE = 5;

          // Shared booking state for this room on this date
          const roomShared = sharedBookings.filter((sb) => sb.roomId === room.id && sb.date === date);
          const hasAssoBooking = roomShared.some((sb) => sb.type === "full");
          const hasPartialBooking = !hasAssoBooking && roomShared.some((sb) => sb.type === "partial");

          // Slot-level partial check: does this block overlap a partial shared booking?
          const slotHasPartial = (block: { start: string; end: string }) =>
            roomShared.some((sb) => sb.type === "partial" && !(sb.end <= block.start || sb.start >= block.end));

          // Slot-level "my booking" check
          const roomMine = mySharedBookings.filter((sb) => sb.roomId === room.id && sb.date === date);
          const slotIsMyBooking = (block: { start: string; end: string }) =>
            roomMine.some((sb) => !(sb.end <= block.start || sb.start >= block.end));

          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom?.(room.id)}
              className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:brightness-[0.98]"
              style={{
                background: "var(--surface-container-lowest)",
                border: hasAssoBooking ? "1px solid rgba(255,100,100,0.4)" : hasPartialBooking ? "1px solid rgba(255,180,0,0.4)" : "1px solid var(--surface-container-high)",
                cursor: onSelectRoom ? "pointer" : "default",
              }}
            >
              {/* ── Top row ── */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: "var(--surface-container-low)" }}>
                  {icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-bold text-base leading-tight"
                      style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}
                    >
                      {room.id}
                    </span>
                    {hasAssoBooking ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,100,100,0.15)", color: "rgba(255,100,100,1)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,100,100,1)" }} />
                        Réservée (asso)
                      </span>
                    ) : hasPartialBooking ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,180,0,0.15)", color: "rgba(255,160,0,1)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,160,0,1)" }} />
                        Places limitées
                      </span>
                    ) : isFree ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--secondary)" }} />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,100,100,0.15)", color: "rgba(255,100,100,1)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,100,100,1)" }} />
                        Occupée
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      <MapPin className="w-3 h-3" />{room.campus}
                    </span>
                    {room.floor > 0 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        <Layers className="w-3 h-3" />Étage {room.floor}
                      </span>
                    )}
                    {room.capacity > 0 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        <Users className="w-3 h-3" />{room.capacity} places
                      </span>
                    )}
                  </div>
                </div>

                {/* Action icons */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(room.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ background: isFav ? "#ffeaea" : "var(--surface-container-low)" }}
                  >
                    <Heart className="w-3.5 h-3.5" style={{ color: isFav ? "#e53935" : "var(--outline-variant)", fill: isFav ? "#e53935" : "none" }} />
                  </button>
                  {onViewOnMap && (
                    <button
                      onClick={() => onViewOnMap(room.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "var(--surface-container-low)" }}
                    >
                      <Map className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{ height: 1, background: "var(--surface-container-high)" }} />

              {/* ── Hour blocks ── */}
              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />

                {isFree ? (
                  <>
                    {hourBlocks.slice(0, MAX_INLINE).map((block, i) => {
                      const mine    = slotIsMyBooking(block);
                      const partial = !mine && slotHasPartial(block);
                      return (
                        <button
                          key={i}
                          onClick={() => setBookingModal({ room, slot: block })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                          style={{
                            background: mine    ? "var(--primary)"
                                      : partial ? "rgba(255,180,0,0.15)"
                                      : "var(--secondary-container)",
                            color:      mine    ? "var(--on-primary)"
                                      : partial ? "rgba(255,160,0,1)"
                                      : "var(--on-secondary-container)",
                          }}
                          title={mine ? `Votre réservation : ${block.start} – ${block.end}` : `Réserver ${block.start} – ${block.end} (1h)`}
                        >
                          {mine && <Check className="w-3 h-3 shrink-0" />}
                          {block.start}
                        </button>
                      );
                    })}
                    {hourBlocks.length > MAX_INLINE && (
                      <button
                        onClick={() => onSelectRoom?.(room.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                        style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                      >
                        +{hourBlocks.length - MAX_INLINE} <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-xs italic" style={{ color: "var(--on-surface-variant)" }}>
                    Aucun créneau de {slotDuration}h disponible ce jour
                  </span>
                )}

                {/* Hint détail */}
                <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  Voir détail <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
