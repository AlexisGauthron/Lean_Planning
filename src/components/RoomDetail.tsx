"use client";

import { useState } from "react";
import { Room, Booking, SharedBooking } from "@/lib/types";
import { computeFreeSlots } from "@/lib/availability";
import {
  ArrowLeft, MapPin, Layers, Users, Zap, Clock,
  ChevronLeft, ChevronRight, Check, X, Heart, Map, Plus, Minus,
} from "lucide-react";

// ─── Time helpers ─────────────────────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function slotDurationMinutes(slot: { start: string; end: string }) {
  return timeToMinutes(slot.end) - timeToMinutes(slot.start);
}
function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getCurrentTimeMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function roundUpTo30(min: number) {
  return Math.ceil(min / 30) * 30;
}

/** Split free slots into 1h blocks, starting from current rounded time when date is today */
function generateHourBlocks(freeSlots: { start: string; end: string }[], filterPastFor?: string): { start: string; end: string }[] {
  const blocks: { start: string; end: string }[] = [];
  // Date entièrement passée → aucun créneau
  if (filterPastFor && filterPastFor < getTodayISO()) return blocks;
  const isToday = !!filterPastFor && filterPastFor === getTodayISO();
  const startFloor = isToday ? roundUpTo30(getCurrentTimeMinutes()) : 0;

  for (const slot of freeSlots) {
    const slotEnd = timeToMinutes(slot.end);
    let cur = isToday
      ? Math.max(timeToMinutes(slot.start), startFloor)
      : timeToMinutes(slot.start);
    while (cur + 60 <= slotEnd) {
      blocks.push({ start: minutesToTime(cur), end: minutesToTime(cur + 60) });
      cur += 60;
    }
  }
  return blocks;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_START_MIN = 8 * 60 + 30;
const DAY_END_MIN   = 20 * 60 + 30;
const DAY_TOTAL     = DAY_END_MIN - DAY_START_MIN;

const EQUIPMENT_ICONS: Record<string, string> = {
  "Labo Elec": "⚡", "Labo Info": "💻", "Labo Elec / Info": "⚡",
  "Labo": "🔬", "Meet-up": "📡", "Jabra": "🎙️",
  "Clevertouch": "🖥️", "Chariot info": "🛒",
};
const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_SHORT   = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];

function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function parseDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return { day: d.getDate(), month: d.getMonth(), weekday: d.getDay() };
}

// ─── Timeline bar ─────────────────────────────────────────────────────────────
function DayTimeline({ freeSlots, busySlots, partialSlots, mySlots, selStart, selEnd }: {
  freeSlots: { start: string; end: string }[];
  busySlots: { start: string; end: string }[];
  partialSlots?: { start: string; end: string }[];
  mySlots?: { start: string; end: string }[];
  selStart?: string | null;
  selEnd?: string | null;
}) {
  const toPct = (t: string) => ((timeToMinutes(t) - DAY_START_MIN) / DAY_TOTAL) * 100;
  const MARKS = [9, 11, 13, 15, 17, 19];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-6 rounded-lg overflow-hidden" style={{ background: "var(--surface-container)" }}>
        {busySlots.map((s, i) => {
          const left = toPct(s.start), width = Math.max(toPct(s.end) - left, 0);
          return <div key={i} className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${width}%`, background: "#ffb4ab" }} />;
        })}
        {freeSlots.map((s, i) => {
          const left = toPct(s.start), width = Math.max(toPct(s.end) - left, 0);
          return <div key={i} className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${width}%`, background: "var(--secondary)", opacity: 0.6 }} />;
        })}
        {partialSlots?.map((s, i) => {
          const left = toPct(s.start), width = Math.max(toPct(s.end) - left, 0);
          return <div key={i} className="absolute top-0 h-full" style={{ left: `${left}%`, width: `${width}%`, background: "#ffa000", opacity: 0.7 }} />;
        })}
        {mySlots?.map((s, i) => {
          const left = toPct(s.start), width = Math.max(toPct(s.end) - left, 0);
          return <div key={i} className="absolute top-0 h-full rounded" style={{ left: `${left}%`, width: `${width}%`, background: "var(--primary)", opacity: 0.85 }} />;
        })}
        {selStart && selEnd && (() => {
          const left = toPct(selStart), width = Math.max(toPct(selEnd) - left, 0);
          return <div className="absolute top-0 h-full rounded" style={{ left: `${left}%`, width: `${width}%`, background: "var(--primary)", opacity: 0.9 }} />;
        })()}
      </div>
      <div className="relative h-3">
        {MARKS.map((h) => {
          const pct = ((h * 60 - DAY_START_MIN) / DAY_TOTAL) * 100;
          return <span key={h} className="absolute -translate-x-1/2 text-[9px]" style={{ left: `${pct}%`, color: "var(--on-surface-variant)" }}>{h}h</span>;
        })}
      </div>
    </div>
  );
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
  const durationH = slotDurationMinutes(slot) / 60;
  const maxSeats = seatsLeft ?? room.capacity;
  const canBookFull = userType !== "student";
  const effectiveSeatMax = (userType === "student" && studentMaxSeats) ? Math.min(maxSeats, studentMaxSeats) : maxSeats;
  const [seats, setSeats] = useState(Math.min(1, effectiveSeatMax));

  const assocBlocked = canBookFull && (hasAnyBooking ?? false);
  const studentBlocked = !canBookFull && maxSeats <= 0;
  const isBlocked = assocBlocked || studentBlocked;

  const handleConfirm = () => {
    if (isBlocked) return;
    const bookingType = canBookFull ? "full" : "partial";
    const bookedSeats = canBookFull ? room.capacity : seats;
    onBook?.(room.id, room.campus, date, slot, bookingType, bookedSeats);
    setConfirmed(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "0 24px 60px rgba(25,28,29,0.18)" }} onClick={(e) => e.stopPropagation()}>
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--secondary-container)" }}>
              <Check className="w-7 h-7" style={{ color: "var(--secondary)" }} />
            </div>
            <p className="font-bold text-lg text-center" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>Réservation confirmée !</p>
            <p className="text-sm text-center" style={{ color: "var(--on-surface-variant)" }}>{room.id} · {slot.start} – {slot.end}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>Confirmer la réservation</p>
                <h3 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>{room.id}</h3>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{room.campus}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                <X className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
              </button>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--surface-container-low)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  <span className="text-base font-bold" style={{ color: "var(--on-surface)" }}>{slot.start} – {slot.end}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
                  {durationH % 1 === 0 ? `${durationH}h` : `${durationH}h`}
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
                    <span className="font-medium" style={{ color: maxSeats > 0 ? "var(--on-surface)" : "#ba1a1a" }}>{maxSeats} / {room.capacity}</span>
                  </div>
                  {studentMaxSeats && effectiveSeatMax < maxSeats && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--on-surface-variant)" }}>Votre limite</span>
                      <span className="font-medium" style={{ color: "#e65100" }}>max {studentMaxSeats} places</span>
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
              <div className="rounded-xl px-4 py-3 text-xs text-center" style={{ background: "#ffdad6", color: "#93000a" }}>
                {assocBlocked
                  ? "Des places sont déjà réservées dans ce créneau. Une association doit avoir la salle entière."
                  : "Plus aucune place disponible sur ce créneau."}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-full text-sm font-semibold" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>Annuler</button>
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

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col overflow-hidden ${className}`} style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)" }}>
      {children}
    </div>
  );
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest mb-3 shrink-0" style={{ color: "var(--on-surface-variant)" }}>{children}</p>;
}

// ─── Hour block grid ─────────────────────────────────────────────────────────
function HourBlockGrid({ blocks, selStart, selEnd, onBlockClick, slotHasPartial, slotIsMyBooking }: {
  blocks: { start: string; end: string }[];
  selStart: string | null;
  selEnd: string | null;
  onBlockClick: (block: { start: string; end: string }) => void;
  slotHasPartial?: (block: { start: string; end: string }) => boolean;
  slotIsMyBooking?: (block: { start: string; end: string }) => boolean;
}) {
  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm rounded-xl" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
        Aucun créneau disponible ce jour
      </div>
    );
  }

  const selStartMin = selStart ? timeToMinutes(selStart) : null;
  const selEndMin   = selEnd   ? timeToMinutes(selEnd)   : null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-1.5">
      {/* Hint */}
      <p className="text-[10px] shrink-0" style={{ color: "var(--on-surface-variant)" }}>
        Cliquez pour sélectionner · cliquez à nouveau pour étendre la durée
      </p>
      <div className="flex flex-wrap gap-2 content-start overflow-hidden">
        {blocks.map((block, i) => {
          const blockStartMin = timeToMinutes(block.start);
          const blockEndMin   = timeToMinutes(block.end);

          const isSelected = selStartMin !== null && selEndMin !== null
            && blockStartMin >= selStartMin && blockEndMin <= selEndMin;
          const isNext = selEndMin !== null && blockStartMin === selEndMin;
          const mine    = !isSelected && !isNext && (slotIsMyBooking?.(block) ?? false);
          const partial = !isSelected && !isNext && !mine && (slotHasPartial?.(block) ?? false);

          return (
            <button
              key={block.start}
              onClick={() => onBlockClick(block)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 relative"
              style={{
                background: isSelected ? "var(--primary)"
                          : mine        ? "var(--primary)"
                          : isNext      ? "var(--secondary-container)"
                          : partial     ? "#fff8e1"
                          : "var(--surface-container-low)",
                color:      isSelected ? "var(--on-primary)"
                          : mine        ? "var(--on-primary)"
                          : isNext      ? "var(--on-secondary-container)"
                          : partial     ? "#e65100"
                          : "var(--on-surface-variant)",
                border: isNext ? "1.5px dashed var(--secondary)" : partial ? "1.5px solid #ffa000" : mine ? "1.5px solid rgba(255,255,255,0.4)" : "1.5px solid transparent",
                opacity: mine && !isSelected ? 0.85 : 1,
              }}
            >
              {isNext && <Plus className="w-3 h-3 shrink-0" />}
              {mine && !isSelected && <Check className="w-3 h-3 shrink-0" />}
              {!isNext && !mine && <Clock className="w-3 h-3 shrink-0" style={{ opacity: 0.7 }} />}
              {block.start}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main RoomDetail ─────────────────────────────────────────────────────────
interface RoomDetailProps {
  room: Room;
  bookings: Booking[];
  initialDate: string;
  isFavorite: boolean;
  userType?: "student" | "association" | "prof" | "admin";
  studentMaxSeats?: number;
  sharedBookings?: SharedBooking[];
  mySharedBookings?: SharedBooking[];
  initialSelStart?: string | null;
  initialSelEnd?: string | null;
  onToggleFavorite: (roomId: string) => void;
  onViewOnMap: (roomId: string) => void;
  onBack: () => void;
  onBook?: (roomId: string, campus: string, date: string, slot: { start: string; end: string }, bookingType: "full" | "partial", seats: number) => void;
}

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

export function RoomDetail({ room, bookings, initialDate, isFavorite, userType = "student", studentMaxSeats, sharedBookings = [], mySharedBookings = [], initialSelStart = null, initialSelEnd = null, onToggleFavorite, onViewOnMap, onBack, onBook }: RoomDetailProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookingSlot, setBookingSlot] = useState<{ start: string; end: string } | null>(null);

  // Block selection state — pre-filled when coming from a booking card
  const [selStart, setSelStart] = useState<string | null>(initialSelStart);
  const [selEnd, setSelEnd]     = useState<string | null>(initialSelEnd);

  const { freeSlots, busySlots } = computeFreeSlots(room.id, selectedDate, bookings);
  const hourBlocks = generateHourBlocks(freeSlots, selectedDate);
  const isAvailable = hourBlocks.length > 0;

  // Shared booking state for the selected date
  const dateShared = sharedBookings.filter((sb) => sb.roomId === room.id && sb.date === selectedDate);
  const hasAssoBooking = dateShared.some((sb) => sb.type === "full");
  const hasPartialBooking = !hasAssoBooking && dateShared.some((sb) => sb.type === "partial");
  const slotHasPartial = (block: { start: string; end: string }) =>
    dateShared.some((sb) => sb.type === "partial" && !(sb.end <= block.start || sb.start >= block.end));
  // partialSlots for the timeline: segments of freeSlots that overlap a partial shared booking
  const partialSlots = dateShared
    .filter((sb) => sb.type === "partial")
    .map((sb) => ({ start: sb.start, end: sb.end }));

  // User's own bookings for this room + date
  const dateMine = mySharedBookings.filter((sb) => sb.roomId === room.id && sb.date === selectedDate);
  const slotIsMyBooking = (block: { start: string; end: string }) =>
    dateMine.some((sb) => !(sb.end <= block.start || sb.start >= block.end));
  const mySlots = dateMine.map((sb) => ({ start: sb.start, end: sb.end }));

  const today    = initialDate;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, weekOffset * 7 + i));
  const equipmentIcon = room.equipment.length > 0 ? (EQUIPMENT_ICONS[room.equipment[0]] ?? "🏫") : "🏫";

  // Duration of current selection
  const selDurationH = selStart && selEnd ? (timeToMinutes(selEnd) - timeToMinutes(selStart)) / 60 : 0;

  // Reset selection when date changes
  const handleDateChange = (d: string) => {
    setSelectedDate(d);
    setSelStart(null);
    setSelEnd(null);
  };

  const handleBlockClick = (block: { start: string; end: string }) => {
    // Nothing selected yet → select this block
    if (!selStart || !selEnd) {
      setSelStart(block.start);
      setSelEnd(block.end);
      return;
    }
    // Clicking the first selected block → deselect all
    if (block.start === selStart) {
      setSelStart(null);
      setSelEnd(null);
      return;
    }
    // Clicking the block right after current selection → extend
    if (block.start === selEnd) {
      setSelEnd(block.end);
      return;
    }
    // Clicking within selection → shrink to that block
    const blockStartMin = timeToMinutes(block.start);
    const selStartMin   = timeToMinutes(selStart);
    const selEndMin     = timeToMinutes(selEnd);
    if (blockStartMin > selStartMin && blockStartMin < selEndMin) {
      setSelEnd(block.end);
      return;
    }
    // Otherwise start fresh
    setSelStart(block.start);
    setSelEnd(block.end);
  };

  return (
    <>
      {bookingSlot && (() => {
        const { seatsLeft, hasAnyBooking } = getSlotAvailability(
          room.id, room.capacity, selectedDate, bookingSlot.start, bookingSlot.end, sharedBookings
        );
        return (
          <BookingModal
            room={room} slot={bookingSlot} date={selectedDate}
            onClose={() => setBookingSlot(null)} onBook={onBook}
            userType={userType} seatsLeft={seatsLeft} hasAnyBooking={hasAnyBooking} studentMaxSeats={studentMaxSeats}
          />
        );
      })()}

      <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--surface)" }}>

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3" style={{ background: "var(--surface-container-lowest)", borderBottom: "1px solid var(--surface-container-high)" }}>
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:brightness-95 shrink-0" style={{ background: "var(--surface-container-low)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--on-surface)" }} />
          </button>
          <span className="text-xl shrink-0">{equipmentIcon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>{room.id}</h1>
            <p className="text-xs truncate" style={{ color: "var(--on-surface-variant)" }}>
              {room.campus} · {room.floor === 0 ? "RDC" : `Étage ${room.floor}`}{room.capacity > 0 ? ` · ${room.capacity} places` : ""}
            </p>
          </div>
          {hasAssoBooking ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#ffdad6", color: "#93000a" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ba1a1a" }} />Réservée (asso)
            </span>
          ) : hasPartialBooking ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#fff8e1", color: "#e65100" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ffa000" }} />Places limitées
            </span>
          ) : isAvailable ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--secondary)" }} />Disponible
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#ffdad6", color: "#93000a" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ba1a1a" }} />Occupée
            </span>
          )}
          <button onClick={() => onToggleFavorite(room.id)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: isFavorite ? "#ffeaea" : "var(--surface-container-low)" }}>
            <Heart className="w-3.5 h-3.5" style={{ color: isFavorite ? "#e53935" : "var(--outline-variant)", fill: isFavorite ? "#e53935" : "none" }} />
          </button>
          <button onClick={() => onViewOnMap(room.id)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--surface-container-low)" }}>
            <Map className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          </button>
        </div>

        {/* ── 2×2 grid ── */}
        <div className="flex-1 overflow-auto md:overflow-hidden p-3 sm:p-4 grid gap-3 room-detail-grid">

          {/* ── Top-left : Room identity ── */}
          <Card>
            <div className="shrink-0 rounded-xl px-4 py-3 mb-3 relative overflow-hidden" style={{ background: hasAssoBooking ? "linear-gradient(135deg, #ffdad6, #fff4f3)" : hasPartialBooking ? "linear-gradient(135deg, #fff8e1, #fffde7)" : isAvailable ? "linear-gradient(135deg, var(--secondary-container), #e8f5e9)" : "linear-gradient(135deg, #ffdad6, #fff4f3)" }}>
              <p className="text-xs mb-0.5 truncate" style={{ color: "var(--on-surface-variant)" }}>{room.fullName}</p>
              <h2 className="text-2xl font-extrabold leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>{room.id}</h2>
            </div>
            <div className="shrink-0 grid grid-cols-3 gap-2 mb-3">
              {[
                { icon: <Users className="w-3.5 h-3.5" />, label: "Places", value: room.capacity > 0 ? String(room.capacity) : "—" },
                { icon: <Layers className="w-3.5 h-3.5" />, label: "Étage", value: room.floor === 0 ? "RDC" : `L${room.floor}` },
                { icon: <MapPin className="w-3.5 h-3.5" />, label: "Campus", value: room.campus.split(" ")[0] },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 py-2 rounded-xl" style={{ background: "var(--surface-container-low)" }}>
                  <span style={{ color: "var(--primary)" }}>{icon}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>{value}</span>
                  <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>{label}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {room.equipment.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {room.equipment.map((eq) => (
                    <span key={eq} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                      <Zap className="w-2.5 h-2.5" style={{ color: "var(--primary)" }} />
                      {EQUIPMENT_ICONS[eq] ?? "🔧"} {eq}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Salle standard</span>
              )}
            </div>
          </Card>

          {/* ── Top-right : Week + Timeline ── */}
          <Card>
            <div className="shrink-0 flex items-center justify-between mb-3">
              <CardTitle>Disponibilité</CardTitle>
              <div className="flex items-center gap-1 -mt-3">
                <button onClick={() => setWeekOffset((p) => p - 1)} disabled={weekOffset <= 0} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container-low)", opacity: weekOffset <= 0 ? 0.35 : 1 }}>
                  <ChevronLeft className="w-3 h-3" style={{ color: "var(--on-surface)" }} />
                </button>
                <button onClick={() => setWeekOffset((p) => p + 1)} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
                  <ChevronRight className="w-3 h-3" style={{ color: "var(--on-surface)" }} />
                </button>
              </div>
            </div>
            <div className="shrink-0 grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((d) => {
                const { freeSlots: fs } = computeFreeSlots(room.id, d, bookings);
                const avail = generateHourBlocks(fs, d).length > 0;
                const { day, month, weekday } = parseDate(d);
                const isSelected = d === selectedDate;
                const isToday    = d === today;
                return (
                  <button key={d} onClick={() => handleDateChange(d)} className="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all"
                    style={{ background: isSelected ? "var(--primary)" : isToday ? "var(--surface-container)" : "var(--surface-container-low)", border: isToday && !isSelected ? "1.5px solid var(--primary)" : "1.5px solid transparent" }}>
                    <span className="text-[9px] font-semibold uppercase" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--on-surface-variant)" }}>{WEEKDAY_SHORT[weekday]}</span>
                    <span className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif", color: isSelected ? "white" : "var(--on-surface)" }}>{day}</span>
                    <span className="text-[9px]" style={{ color: isSelected ? "rgba(255,255,255,0.55)" : "var(--on-surface-variant)" }}>{MONTH_SHORT[month]}</span>
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: isSelected ? "rgba(255,255,255,0.6)" : avail ? "var(--secondary)" : "#ba1a1a" }} />
                  </button>
                );
              })}
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
                <Clock className="w-3 h-3" /> Occupation · {selectedDate}
              </p>
              <DayTimeline freeSlots={freeSlots} busySlots={busySlots} partialSlots={partialSlots} mySlots={mySlots} selStart={selStart} selEnd={selEnd} />
            </div>
            <div className="flex items-center gap-3 mt-2 shrink-0">
              {[["var(--secondary)", 0.8, "Libre"], ["#ffa000", 1, "Partiel"], ["#ffb4ab", 1, "Occupé"], ["var(--primary)", 0.9, "Sélectionné"]].map(([bg, op, label]) => (
                <div key={label as string} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: bg as string, opacity: op as number }} />{label}
                </div>
              ))}
            </div>
          </Card>

          {/* ── Bottom-left : Busy slots ── */}
          <Card>
            <CardTitle>Créneaux occupés</CardTitle>
            {busySlots.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--on-surface-variant)" }}>Aucune réservation ce jour</div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col gap-2">
                {busySlots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#ffdad6" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#ba1a1a" }} />
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#93000a" }} />
                    <span className="text-sm font-semibold" style={{ color: "#93000a" }}>{slot.start} – {slot.end}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Bottom-right : Hour block grid ── */}
          <Card>
            <CardTitle>Choisir un créneau</CardTitle>
            <HourBlockGrid blocks={hourBlocks} selStart={selStart} selEnd={selEnd} onBlockClick={handleBlockClick} slotHasPartial={slotHasPartial} slotIsMyBooking={slotIsMyBooking} />
          </Card>

        </div>

        {/* ── Footer CTA ── */}
        <div className="shrink-0 px-4 pb-4">
          {selStart && selEnd ? (
            <button
              onClick={() => setBookingSlot({ start: selStart, end: selEnd })}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif" }}
            >
              <Clock className="w-4 h-4" />
              Réserver · {selStart} – {selEnd}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.25)" }}>
                {selDurationH % 1 === 0 ? `${selDurationH}h` : `${selDurationH}h`}
              </span>
            </button>
          ) : isAvailable ? (
            <div className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
              ← Sélectionnez un créneau dans la grille
            </div>
          ) : (
            <div className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
              Aucun créneau disponible · changer de jour
            </div>
          )}
        </div>

      </div>
    </>
  );
}
