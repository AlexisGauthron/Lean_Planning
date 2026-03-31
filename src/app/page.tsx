"use client";

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRooms } from "@/hooks/useRooms";
import { useFilters } from "@/hooks/useFilters";
import { Header, NavPage, AppNotification } from "@/components/Header";
import { AccountPanel, AppUser, MyBooking as MyBookingType } from "@/components/AccountPanel";
import { AuthModal } from "@/components/AuthModal";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FreeRoomCounter } from "@/components/FreeRoomCounter";
import { WeekGrid } from "@/components/WeekGrid";
import { RoomList } from "@/components/RoomList";
import { ViewToggle } from "@/components/ViewToggle";
import { FloorPlan } from "@/components/FloorPlan";
import { RoomDetail } from "@/components/RoomDetail";
import { Loader2, CalendarDays, Heart, ChevronLeft, ChevronRight, Layers, MapPin, Clock, Users, ArrowRight, Check, X } from "lucide-react";
import { Room, Booking, SharedBooking, AdminConfig } from "@/lib/types";
import { AdminPanel } from "@/components/AdminPanel";
import { isRoomFreeAt, computeFreeSlots } from "@/lib/availability";

function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roundUpTo30(min: number) { return Math.ceil(min / 30) * 30; }
function minutesToTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

// ─── Now view ─────────────────────────────────────────────────────────────────
function NowView({
  rooms, bookings, onSelectRoom, onToggleFavorite, favorites, onBook, userType = "student", studentMaxSeats, sharedBookings = [],
}: {
  rooms: Room[]; bookings: Booking[];
  onSelectRoom: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  favorites: Set<string>;
  onBook?: (roomId: string, campus: string, date: string, slot: { start: string; end: string }, bookingType: "full" | "partial", seats: number) => void;
  userType?: "student" | "association" | "prof" | "admin";
  studentMaxSeats?: number;
  sharedBookings?: SharedBooking[];
}) {
  const [bookingModal, setBookingModal] = useState<{ room: Room; slot: { start: string; end: string } } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [seats, setSeats] = useState(1);

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowStr = minutesToTime(nowMin);
  const startFloor = roundUpTo30(nowMin);

  // Rooms free right now, with their free-until time
  const freeNow = rooms
    .map((room) => {
      const { freeSlots, busySlots } = computeFreeSlots(room.id, todayISO, bookings);
      const currentSlot = freeSlots.find(
        (s) => timeToMin(s.start) <= nowMin && nowMin < timeToMin(s.end)
      );
      if (!currentSlot) return null;
      // Generate bookable blocks starting from next 30-min mark
      const blocks: { start: string; end: string }[] = [];
      const slotEnd = timeToMin(currentSlot.end);
      let cur = Math.max(timeToMin(currentSlot.start), startFloor);
      while (cur + 60 <= slotEnd) {
        blocks.push({ start: minutesToTime(cur), end: minutesToTime(cur + 60) });
        cur += 60;
      }
      return { room, freeUntil: currentSlot.end, blocks };
    })
    .filter(Boolean) as { room: Room; freeUntil: string; blocks: { start: string; end: string }[] }[];

  const getSlotAvailNow = (room: Room, slot: { start: string; end: string }) => {
    const relevant = sharedBookings.filter(
      (b) => b.roomId === room.id && b.date === todayISO && !(b.end <= slot.start || b.start >= slot.end)
    );
    if (relevant.some((b) => b.type === "full")) return { seatsLeft: 0, hasAnyBooking: true };
    const usedSeats = relevant.reduce((sum, b) => sum + b.seats, 0);
    return { seatsLeft: Math.max(0, room.capacity - usedSeats), hasAnyBooking: relevant.length > 0 };
  };

  const modalAvail = bookingModal ? getSlotAvailNow(bookingModal.room, bookingModal.slot) : null;
  const isAssociation = userType === "association";
  const modalBlocked = bookingModal ? (
    isAssociation ? (modalAvail?.hasAnyBooking ?? false) : (modalAvail?.seatsLeft ?? 1) <= 0
  ) : false;

  const handleConfirm = () => {
    if (bookingModal && !modalBlocked) {
      const bookingType = isAssociation ? "full" : "partial";
      const bookedSeats = isAssociation ? bookingModal.room.capacity : Math.min(seats, modalAvail?.seatsLeft ?? 1);
      onBook?.(bookingModal.room.id, bookingModal.room.campus, todayISO, bookingModal.slot, bookingType, bookedSeats);
    }
    setConfirmed(true);
    setTimeout(() => { setConfirmed(false); setBookingModal(null); setSeats(1); }, 1800);
  };

  const EQUIPMENT_ICONS: Record<string, string> = {
    "Labo Elec": "⚡", "Labo Info": "💻", "Labo Elec / Info": "⚡",
    "Labo": "🔬", "Meet-up": "📡", "Jabra": "🎙️", "Clevertouch": "🖥️", "Chariot info": "🛒",
  };

  return (
    <>
      {/* Booking modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setBookingModal(null)}>
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)", boxShadow: "0 24px 60px rgba(25,28,29,0.18)" }} onClick={(e) => e.stopPropagation()}>
            {confirmed ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--secondary-container)" }}>
                  <Check className="w-7 h-7" style={{ color: "var(--secondary)" }} />
                </div>
                <p className="font-bold text-lg text-center" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>Réservation confirmée !</p>
                <p className="text-sm text-center" style={{ color: "var(--on-surface-variant)" }}>{bookingModal.room.id} · {bookingModal.slot.start} – {bookingModal.slot.end}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>Confirmer la réservation</p>
                    <h3 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>{bookingModal.room.id}</h3>
                    <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{bookingModal.room.campus}</p>
                  </div>
                  <button onClick={() => setBookingModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                    <X className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
                  </button>
                </div>
                <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "var(--surface-container-low)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: "var(--primary)" }} />
                      <span className="text-base font-bold" style={{ color: "var(--on-surface)" }}>{bookingModal.slot.start} – {bookingModal.slot.end}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>1h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--on-surface-variant)" }}>Date</span>
                    <span className="font-medium" style={{ color: "var(--on-surface)" }}>{todayISO}</span>
                  </div>
                  {isAssociation ? (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--on-surface-variant)" }}>Réservation</span>
                      <span className="font-medium" style={{ color: "var(--on-surface)" }}>Salle entière ({bookingModal.room.capacity > 0 ? `${bookingModal.room.capacity} places` : "—"})</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--on-surface-variant)" }}>Places disponibles</span>
                        <span className="font-medium" style={{ color: (modalAvail?.seatsLeft ?? 0) > 0 ? "var(--on-surface)" : "#ba1a1a" }}>{modalAvail?.seatsLeft ?? 0} / {bookingModal.room.capacity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Nombre de places</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSeats((s) => Math.max(1, s - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                            <Users className="w-3 h-3" style={{ color: "var(--on-surface)" }} />
                          </button>
                          <span className="text-base font-bold w-6 text-center" style={{ color: "var(--on-surface)" }}>{seats}</span>
                          <button onClick={() => setSeats((s) => Math.min(modalAvail?.seatsLeft ?? 1, s + 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
                            <Users className="w-3 h-3" style={{ color: "var(--on-surface)" }} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {modalBlocked && (
                  <div className="rounded-xl px-4 py-3 text-xs text-center" style={{ background: "#ffdad6", color: "#93000a" }}>
                    {isAssociation
                      ? "Des places sont déjà réservées. Une association doit avoir la salle entière."
                      : "Plus aucune place disponible sur ce créneau."}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setBookingModal(null)} className="flex-1 py-3 rounded-full text-sm font-semibold" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>Annuler</button>
                  <button
                    onClick={handleConfirm}
                    disabled={modalBlocked}
                    className="flex-1 py-3 rounded-full text-sm font-semibold"
                    style={{
                      background: modalBlocked ? "var(--surface-container-high)" : "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                      color: modalBlocked ? "var(--on-surface-variant)" : "var(--on-primary)",
                      cursor: modalBlocked ? "not-allowed" : "pointer",
                    }}
                  >
                    {isAssociation ? "Réserver la salle" : `Réserver ${seats} place${seats > 1 ? "s" : ""}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col pb-10">
        {/* Header */}
        <div
          className="mx-6 mt-6 rounded-3xl p-6 flex items-center gap-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--secondary-container) 100%)" }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "white" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.8)" }}>En ce moment · {nowStr}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              {freeNow.length} salle{freeNow.length !== 1 ? "s" : ""} libre{freeNow.length !== 1 ? "s" : ""}
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
              Disponibles maintenant · réservez en 2 clics
            </p>
          </div>
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Room list */}
        <div className="px-3 sm:px-6 mt-5 flex flex-col gap-3">
          {freeNow.length === 0 ? (
            <div className="text-center py-20 rounded-2xl text-sm" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}>
              Aucune salle libre en ce moment
            </div>
          ) : (
            freeNow.map(({ room, freeUntil, blocks }) => {
              const icon = room.equipment.length > 0 ? (EQUIPMENT_ICONS[room.equipment[0]] ?? "🏫") : "🏫";
              const isFav = favorites.has(room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:brightness-[0.98] transition-all"
                  style={{ background: "var(--surface-container-lowest)", border: "1.5px solid var(--secondary-container)" }}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: "var(--secondary-container)" }}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>{room.id}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--secondary)" }} />
                          Libre maintenant
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                          <Clock className="w-3 h-3 inline mr-1" />Libre jusqu'à <strong>{freeUntil}</strong>
                        </span>
                        {room.capacity > 0 && (
                          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                            <Users className="w-3 h-3 inline mr-1" />{room.capacity} places
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{room.campus}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(room.id); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: isFav ? "#ffeaea" : "var(--surface-container-low)" }}
                    >
                      <Heart className="w-3.5 h-3.5" style={{ color: isFav ? "#e53935" : "var(--outline-variant)", fill: isFav ? "#e53935" : "none" }} />
                    </button>
                  </div>

                  {/* Blocks */}
                  <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
                    {blocks.length > 0 ? blocks.slice(0, 5).map((b, i) => (
                      <button
                        key={i}
                        onClick={() => setBookingModal({ room, slot: b })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                        style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}
                      >
                        {b.start}
                      </button>
                    )) : (
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Libre mais moins d'1h disponible</span>
                    )}
                    <span className="ml-auto text-xs flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
                      Voir détail <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── My Bookings view ────────────────────────────────────────────────────────
type MyBooking = MyBookingType;

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending:  { label: "En attente",  bg: "#fff8e1", color: "#e65100", dot: "#ffa000" },
  approved: { label: "Confirmée",   bg: "#e8f5e9", color: "#2e7d32", dot: "#43a047" },
  rejected: { label: "Refusée",     bg: "#ffdad6", color: "#93000a", dot: "#ba1a1a" },
};

function BookingsView({ bookings, onCancel, onSelectRoom }: { bookings: MyBooking[]; onCancel: (id: string) => void; onSelectRoom: (roomId: string, date: string, start: string, end: string) => void }) {
  const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
          <CalendarDays className="w-8 h-8" style={{ color: "var(--primary)" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
          Mes réservations
        </h2>
        <p className="text-sm text-center max-w-xs" style={{ color: "var(--on-surface-variant)" }}>
          Vous n'avez pas encore de réservations.<br />Trouvez une salle disponible depuis le tableau de bord.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="px-3 sm:px-6 mt-6 mb-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>Mes réservations</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>{sorted.length} réservation{sorted.length > 1 ? "s" : ""}</p>
      </div>
      <div className="px-3 sm:px-6 flex flex-col gap-3">
        {sorted.map((b) => {
          const cfg = STATUS_CFG[b.status];
          return (
            <div
              key={b.id}
              className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:brightness-[0.98] transition-all"
              style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)" }}
              onClick={() => onSelectRoom(b.roomId, b.date, b.start, b.end)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-container)" }}>
                <CalendarDays className="w-5 h-5" style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-base" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>{b.roomId}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1" style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                  {new Date(b.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  {" · "}{b.start} – {b.end}
                </p>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{b.campus}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {b.status === "pending" && (
                  <button
                    onClick={() => onCancel(b.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#ffdad6" }}
                    title="Annuler la réservation"
                  >
                    <X className="w-4 h-4" style={{ color: "#ba1a1a" }} />
                  </button>
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--surface-container-low)" }}>
                  <ArrowRight className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Campus Map view ──────────────────────────────────────────────────────────
function CampusMapView({
  allRooms,
  allCampuses,
  selectedRoomId,
  onSelectRoom,
}: {
  allRooms: Room[];
  allCampuses: string[];
  selectedRoomId?: string;
  onSelectRoom?: (roomId: string) => void;
}) {
  // Auto-detect campus/floor from selectedRoomId
  const selectedRoom = selectedRoomId ? allRooms.find((r) => r.id === selectedRoomId) : null;

  const [activeCampus, setActiveCampus] = useState(selectedRoom?.campus ?? allCampuses[0] ?? "");
  const [activeFloor, setActiveFloor] = useState<number>(selectedRoom?.floor ?? -1);

  // Sync when the selected room changes (navigated from RoomList)
  useEffect(() => {
    if (selectedRoom) {
      setActiveCampus(selectedRoom.campus);
      setActiveFloor(selectedRoom.floor);
    }
  }, [selectedRoomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const campusRooms = allRooms.filter((r) => r.campus === activeCampus);
  const floors = [...new Set(campusRooms.map((r) => r.floor))].sort((a, b) => a - b);

  // If activeFloor not yet set or not valid for this campus, default to first floor
  const currentFloor = floors.includes(activeFloor) ? activeFloor : (floors[0] ?? 0);

  const clickedRoom = selectedRoomId ? allRooms.find((r) => r.id === selectedRoomId) : null;

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
          Plan du campus
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          {allRooms.length} salle{allRooms.length !== 1 ? "s" : ""} · plan schématique par étage
        </p>
      </div>

      {/* Campus selector */}
      <div className="flex flex-wrap gap-2">
        {allCampuses.map((campus) => (
          <button
            key={campus}
            onClick={() => { setActiveCampus(campus); setActiveFloor(-1); }}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeCampus === campus ? "var(--primary)" : "var(--surface-container)",
              color: activeCampus === campus ? "var(--on-primary)" : "var(--on-surface-variant)",
            }}
          >
            {campus}
          </button>
        ))}
      </div>

      {/* Floor selector */}
      {floors.length > 1 && (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          <div className="flex flex-wrap gap-2">
            {floors.map((floor) => (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: currentFloor === floor ? "var(--secondary-container)" : "var(--surface-container-low)",
                  color: currentFloor === floor ? "var(--on-secondary-container)" : "var(--on-surface-variant)",
                  border: currentFloor === floor ? "1.5px solid var(--secondary)" : "1.5px solid transparent",
                }}
              >
                {floor === 0 ? "RDC" : `Étage ${floor}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected room info banner */}
      {clickedRoom && clickedRoom.campus === activeCampus && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ fontFamily: "Manrope, sans-serif" }}>
              {clickedRoom.id}
            </p>
            <p className="text-xs opacity-80">
              {clickedRoom.campus} · {clickedRoom.floor === 0 ? "RDC" : `Étage ${clickedRoom.floor}`}
              {clickedRoom.capacity > 0 ? ` · ${clickedRoom.capacity} places` : ""}
            </p>
          </div>
          {clickedRoom.floor !== currentFloor && (
            <button
              onClick={() => setActiveFloor(clickedRoom.floor)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              Aller à l'étage {clickedRoom.floor === 0 ? "RDC" : clickedRoom.floor}
            </button>
          )}
        </div>
      )}

      {/* Floor plan SVG */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}
      >
        <FloorPlan
          rooms={campusRooms}
          campus={activeCampus}
          floor={currentFloor}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: "#ffffff", border: "1px solid #c2c6d4" }} />
          Salle
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: "#00478d" }} />
          Salle sélectionnée
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-3 rounded-sm" style={{ background: "#dde1f0" }} />
          Couloir
        </div>
      </div>
    </div>
  );
}

// ─── Favorites view ───────────────────────────────────────────────────────────
function FavoritesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-container)" }}>
        <Heart className="w-8 h-8" style={{ color: "#e53935" }} />
      </div>
      <h2 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
        Aucun favori
      </h2>
      <p className="text-sm text-center max-w-xs" style={{ color: "var(--on-surface-variant)" }}>
        Cliquez sur le ❤ à côté d'une salle pour l'ajouter à vos favoris.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { filters, updateFilter, resetFilters, toggleEquipment, apiParams } = useFilters();
  const { rooms, bookings, metadata, totalRooms, isLoading, error } = useRooms(apiParams);
  // Unfiltered hook: stable URL → always cached → used for map, sidebar options, and all bookings
  const { rooms: allRooms, allCampuses, allEquipment, bookings: allBookings } = useRooms({});
  const [view, setView] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState<NavPage>("dashboard");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedMapRoomId, setSelectedMapRoomId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBookingSlot, setSelectedBookingSlot] = useState<{ date: string; start: string; end: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [sharedBookings, setSharedBookings] = useState<SharedBooking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<AppUser>({ name: "", email: "", type: "student" });
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({ studentMaxDays: 7, assoMaxDays: 30, profMaxDays: 90, studentMaxSeats: 4, studentMaxRoomsPerDay: 2 });

  // ─── Auth ───────────────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUserData = async (sess: Session) => {
    // Load profile
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", sess.user.id).single();
    if (profile) {
      setUser({ name: profile.name, email: sess.user.email ?? "", type: profile.type });
      if (profile.type === "admin") setCurrentPage("admin");
    }
    // Load all bookings (shared planning + own reservations)
    const { data: dbBookings } = await supabase.from("bookings").select("*");
    if (dbBookings) {
      setMyBookings(
        dbBookings
          .filter((b) => b.user_id === sess.user.id)
          .map((b) => ({ id: b.id, roomId: b.room_id, campus: b.campus, date: b.date, start: b.start_time, end: b.end_time, status: b.status }))
      );
      setSharedBookings(
        dbBookings.map((b) => ({ id: b.id, roomId: b.room_id, date: b.date, start: b.start_time, end: b.end_time, type: b.booking_type, seats: b.seats, userName: b.user_name, userId: b.user_id, status: b.status }))
      );
    }
    // Load admin config
    const { data: configRow } = await supabase.from("admin_config").select("*").eq("id", 1).single();
    if (configRow) {
      setAdminConfig({ studentMaxDays: configRow.student_max_days, assoMaxDays: configRow.asso_max_days, profMaxDays: configRow.prof_max_days, studentMaxSeats: configRow.student_max_seats, studentMaxRoomsPerDay: configRow.student_max_rooms_per_day ?? 2 });
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_OUT") {
        setMyBookings([]); setSharedBookings([]);
        setUser({ name: "", email: "", type: "student" });
        setAuthLoading(false);
      } else if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        loadUserData(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Realtime : notif quand l'admin change le statut d'une réservation ───────
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel("booking-status-" + session.user.id)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `user_id=eq.${session.user.id}`,
      }, (payload) => {
        const b = payload.new as { id: string; status: string; room_id: string; date: string; start_time: string; end_time: string };
        if (b.status === "approved") {
          setNotifications((prev) => [...prev, {
            id: `${Date.now()}`,
            type: "approval",
            message: `Votre réservation a été confirmée — ${b.room_id}`,
            detail: `${b.date} · ${b.start_time}–${b.end_time}`,
            read: false,
          }]);
          setMyBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: "approved" } : x));
          setSharedBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: "approved" } : x));
        } else if (b.status === "rejected") {
          setNotifications((prev) => [...prev, {
            id: `${Date.now()}`,
            type: "info",
            message: `Votre réservation a été refusée — ${b.room_id}`,
            detail: `${b.date} · ${b.start_time}–${b.end_time}`,
            read: false,
          }]);
          setMyBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: "rejected" } : x));
          setSharedBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: "rejected" } : x));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Non-rejected bookings — used for display (dots colors, partial indicators)
  const activeSharedBookings = sharedBookings.filter((b) => b.status !== "rejected");
  // User's own bookings (for blue highlighting)
  const mySharedBookings = activeSharedBookings.filter((b) => session && b.userId === session.user.id);

  // Only APPROVED bookings block slots for availability/counter (pending = not yet confirmed)
  const approvedSharedBookings = sharedBookings.filter((b) => b.status === "approved");

  // Only add an approved SharedBooking to the blocking list when the slot is fully blocked:
  // - "full" booking always blocks
  // - partial bookings only block when total approved seats >= room capacity
  const blockingSharedAsBookings: Booking[] = approvedSharedBookings
    .filter((sb) => {
      if (sb.type === "full") return true;
      const room = allRooms.find((r) => r.id === sb.roomId);
      if (!room || room.capacity <= 0) return false;
      const totalSeats = approvedSharedBookings
        .filter((o) => o.roomId === sb.roomId && o.date === sb.date && !(o.end <= sb.start || o.start >= sb.end))
        .reduce((sum, b) => sum + b.seats, 0);
      return totalSeats >= room.capacity;
    })
    .map((sb) => ({ roomId: sb.roomId, date: sb.date, startTime: sb.start, endTime: sb.end }));
  const mergedBookings = [...bookings, ...blockingSharedAsBookings];
  const mergedAllBookings = [...allBookings, ...blockingSharedAsBookings];
  const [showAccount, setShowAccount] = useState(false);

  const addNotification = (n: Omit<AppNotification, "id" | "read">) => {
    setNotifications((prev) => [...prev, { ...n, id: `${Date.now()}-${Math.random()}`, read: false }]);
  };

  const handleBook = async (roomId: string, campus: string, date: string, slot: { start: string; end: string }, bookingType: "full" | "partial" = "partial", seats: number = 1) => {
    if (!session) return;

    // ── Règles métier ──────────────────────────────────────────────────────────
    const todayMs = new Date(getTodayISO() + "T00:00:00").getTime();
    const bookingMs = new Date(date + "T00:00:00").getTime();
    const diffDays = Math.floor((bookingMs - todayMs) / (1000 * 60 * 60 * 24));
    const maxDays = user.type === "prof" || user.type === "admin" ? adminConfig.profMaxDays
                  : user.type === "association" ? adminConfig.assoMaxDays
                  : adminConfig.studentMaxDays;
    if (diffDays > maxDays) {
      addNotification({ type: "info", message: `Réservation impossible : vous ne pouvez pas réserver plus de ${maxDays} jours à l'avance`, detail: `Votre rôle (${user.type}) est limité à ${maxDays} jours` });
      return;
    }
    if (bookingType === "full" && user.type === "student") {
      addNotification({ type: "info", message: "Les élèves ne peuvent pas réserver une salle entière" });
      return;
    }
    if (user.type === "student" && seats > adminConfig.studentMaxSeats) {
      addNotification({ type: "info", message: `Maximum ${adminConfig.studentMaxSeats} places par réservation pour les élèves` });
      return;
    }
    if (user.type === "student") {
      const userId = session.user.id;
      const bookingsOnDay = mySharedBookings.filter((b) => b.date === date && b.status !== "rejected");
      // Chevauchement horaire
      const overlap = bookingsOnDay.some((b) => b.start < slot.end && b.end > slot.start);
      if (overlap) {
        addNotification({ type: "info", message: "Vous avez déjà une réservation sur ce créneau", detail: "Les élèves ne peuvent pas réserver deux salles en même temps" });
        return;
      }
      // Max salles par jour
      const uniqueRooms = new Set(bookingsOnDay.map((b) => b.roomId));
      if (uniqueRooms.size >= adminConfig.studentMaxRoomsPerDay) {
        addNotification({ type: "info", message: `Maximum ${adminConfig.studentMaxRoomsPerDay} salle${adminConfig.studentMaxRoomsPerDay > 1 ? "s" : ""} par jour pour les élèves` });
        return;
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    const userId = session.user.id;
    const bookingId = `${Date.now()}`;
    const bookingStatus = user.type === "admin" ? "approved" : "pending";

    // Optimistic update
    setMyBookings((prev) => [...prev, { id: bookingId, roomId, campus, date, start: slot.start, end: slot.end, status: bookingStatus }]);
    setSharedBookings((prev) => [...prev, { id: bookingId, roomId, date, start: slot.start, end: slot.end, type: bookingType, seats, userName: user.name, userId, status: bookingStatus }]);

    // Persist to Supabase
    await supabase.from("bookings").insert({
      id: bookingId, user_id: userId, user_name: user.name,
      room_id: roomId, campus, date,
      start_time: slot.start, end_time: slot.end,
      status: bookingStatus, booking_type: bookingType, seats,
    });

    // Email simulé
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "gestion_salle@omnes.com", subject: `Demande de réservation – ${roomId} – ${date}`, body: `Salle : ${roomId}\nCampus : ${campus}\nDate : ${date}\nCréneau : ${slot.start}–${slot.end}` }),
    }).then(() => addNotification({
      type: user.type === "admin" ? "approval" : "email",
      message: user.type === "admin"
        ? "Réservation confirmée"
        : "Votre demande a été envoyée à l'administrateur, elle sera traitée dans les plus brefs délais",
      detail: `${roomId} · ${date} · ${slot.start}–${slot.end}`,
    })).catch(() => {});

    // Retour au dashboard
    setTimeout(() => { setSelectedRoomId(null); setCurrentPage("dashboard"); }, 1700);
  };

  const handleApproveBooking = async (id: string) => {
    setSharedBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "approved" } : b));
    setMyBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "approved" } : b));
    const { error } = await supabase.from("bookings").update({ status: "approved" }).eq("id", id);
    if (error) {
      console.error("Erreur approbation:", error);
      // Rollback optimistic update
      setSharedBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "pending" } : b));
      addNotification({ type: "info", message: "Erreur lors de l'approbation", detail: error.message });
    } else {
      addNotification({ type: "approval", message: "Réservation approuvée" });
    }
  };

  const handleRejectBooking = async (id: string) => {
    setSharedBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "rejected" } : b));
    setMyBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "rejected" } : b));
    const { error } = await supabase.from("bookings").update({ status: "rejected" }).eq("id", id);
    if (error) {
      console.error("Erreur rejet:", error);
      // Rollback optimistic update
      setSharedBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "pending" } : b));
      addNotification({ type: "info", message: "Erreur lors du rejet", detail: error.message });
    }
  };

  const handleUpdateAdminConfig = async (config: AdminConfig) => {
    setAdminConfig(config);
    await supabase.from("admin_config").update({
      student_max_days: config.studentMaxDays,
      asso_max_days: config.assoMaxDays,
      prof_max_days: config.profMaxDays,
      student_max_seats: config.studentMaxSeats,
      student_max_rooms_per_day: config.studentMaxRoomsPerDay,
    }).eq("id", 1);
  };

  const handleCancelBooking = async (id: string) => {
    setMyBookings((prev) => prev.filter((b) => b.id !== id));
    setSharedBookings((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bookings").delete().eq("id", id);
  };

  const handleUpdateUser = async (updatedUser: AppUser) => {
    setUser(updatedUser);
    if (session) {
      await supabase.from("profiles").update({ name: updatedUser.name, type: updatedUser.type }).eq("id", session.user.id);
    }
  };

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
    </div>
  );
  if (!session) return <AuthModal onSuccess={() => {}} />;

  const currentDate = filters.date || getTodayISO();
  const currentTime = getCurrentTime();

  const toggleFavorite = (roomId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(roomId) ? next.delete(roomId) : next.add(roomId);
      return next;
    });
  };

  const handleViewOnMap = (roomId: string) => {
    setSelectedRoomId(null);
    setSelectedMapRoomId(roomId);
    setCurrentPage("map");
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const favoriteRooms = rooms.filter((r) => favorites.has(r.id));
  // Dashboard: only show rooms with at least one free slot of minimum duration today
  const minDurMin = (Number(filters.slotDuration) || 1) * 60;
  const isToday = currentDate === getTodayISO();
  const [nowH, nowM] = currentTime.split(":").map(Number);
  const nowMin = nowH * 60 + nowM;
  const availableRooms = rooms.filter((r) => {
    const { freeSlots } = computeFreeSlots(r.id, currentDate, mergedBookings);
    return freeSlots.some((s) => {
      const [sh, sm] = s.start.split(":").map(Number);
      const [eh, em] = s.end.split(":").map(Number);
      const slotEndMin = eh * 60 + em;
      const effectiveStart = isToday ? Math.max(sh * 60 + sm, nowMin) : sh * 60 + sm;
      // For today, the slot must still have enough time left from now
      return slotEndMin - effectiveStart >= minDurMin;
    });
  });

  return (
    <div className={`h-screen flex flex-col${user.type === "admin" ? " admin-theme" : ""}`} style={{ background: "var(--surface)" }}>
      <Header
        metadata={metadata}
        totalRooms={totalRooms}
        searchValue={filters.search}
        onSearch={(v) => updateFilter("search", v)}
        currentPage={currentPage}
        onNavigate={(page) => { setSelectedRoomId(null); setSelectedBookingSlot(null); setCurrentPage(page); }}
        notifications={notifications}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        user={user}
        onOpenAccount={() => setShowAccount(true)}
        isAdmin={user.type === "admin"}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — masquée sur la page admin */}
        {!(user.type === "admin" && currentPage === "admin") && (
          <FilterSidebar
            filters={filters}
            allCampuses={allCampuses}
            allEquipment={allEquipment}
            onUpdateFilter={updateFilter}
            onToggleEquipment={toggleEquipment}
            onReset={resetFilters}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((p) => !p)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">

          {/* Room detail — fixed, no scroll */}
          {selectedRoomId && (() => {
            const room = allRooms.find((r) => r.id === selectedRoomId);
            if (!room) return null;
            return (
              <div className="h-full overflow-hidden">
                <RoomDetail
                  room={room}
                  bookings={mergedBookings}
                  initialDate={selectedBookingSlot?.date ?? currentDate}
                  isFavorite={favorites.has(room.id)}
                  userType={user.type}
                  studentMaxSeats={adminConfig.studentMaxSeats}
                  sharedBookings={activeSharedBookings}
                  mySharedBookings={mySharedBookings}
                  initialSelStart={selectedBookingSlot?.start ?? null}
                  initialSelEnd={selectedBookingSlot?.end ?? null}
                  onToggleFavorite={toggleFavorite}
                  onViewOnMap={handleViewOnMap}
                  onBack={() => { setSelectedRoomId(null); setSelectedBookingSlot(null); }}
                  onBook={handleBook}
                />
              </div>
            );
          })()}

          {!selectedRoomId && currentPage === "now" && (
            <NowView
              rooms={rooms}
              bookings={mergedAllBookings}
              onSelectRoom={handleSelectRoom}
              onToggleFavorite={toggleFavorite}
              favorites={favorites}
              onBook={handleBook}
              userType={user.type}
              studentMaxSeats={adminConfig.studentMaxSeats}
              sharedBookings={activeSharedBookings}
            />
          )}
          {!selectedRoomId && currentPage === "admin" && user.type === "admin" && (

            <AdminPanel
              sharedBookings={sharedBookings}
              adminConfig={adminConfig}
              onApprove={handleApproveBooking}
              onReject={handleRejectBooking}
              onUpdateConfig={handleUpdateAdminConfig}
            />
          )}
          {!selectedRoomId && currentPage === "bookings" && (
            <BookingsView
              bookings={myBookings}
              onCancel={handleCancelBooking}
              onSelectRoom={(roomId, date, start, end) => {
                setSelectedBookingSlot({ date, start, end });
                handleSelectRoom(roomId);
              }}
            />
          )}
          {!selectedRoomId && currentPage === "map" && (
            <CampusMapView
              allRooms={allRooms}
              allCampuses={allCampuses}
              selectedRoomId={selectedMapRoomId}
              onSelectRoom={setSelectedMapRoomId}
            />
          )}

          {!selectedRoomId && currentPage === "dashboard" && (
            isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "#ba1a1a" }}>
                Erreur lors du chargement des données
              </div>
            ) : (
              <div className="flex flex-col pb-10">

                {/* ── Hero ── */}
                <div
                  className="mx-3 sm:mx-6 mt-6 rounded-3xl p-5 sm:p-8 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    minHeight: "160px",
                  }}
                >
                  <div className="relative z-10 max-w-md">
                    <h1
                      className="text-3xl font-extrabold text-white mb-2 leading-tight"
                      style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Trouvez votre espace.
                    </h1>
                    <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.75)" }}>
                      Réservez rapidement une salle d'étude ou un labo sur le campus.
                    </p>
                    <button
                      onClick={() => setCurrentPage("now")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
                    >
                      Trouver une salle maintenant <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
                  <div className="absolute right-20 bottom-2 w-28 h-28 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
                </div>

                {/* ── Smart bar ── */}
                <div className="mx-3 sm:mx-6 mt-4 rounded-2xl px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3 flex-wrap" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)" }}>
                  {/* Date nav */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { const d = new Date((filters.date || getTodayISO()) + "T00:00:00"); d.setDate(d.getDate() - 1); updateFilter("date", `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:brightness-95" style={{ background: "var(--surface-container-low)" }}>
                      <ChevronLeft className="w-4 h-4" style={{ color: "var(--on-surface)" }} />
                    </button>
                    <button
                      onClick={() => updateFilter("date", getTodayISO())}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
                      style={{ background: currentDate === getTodayISO() ? "var(--primary)" : "var(--surface-container-low)", color: currentDate === getTodayISO() ? "var(--on-primary)" : "var(--on-surface)" }}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      {currentDate === getTodayISO() ? "Aujourd'hui" : new Date(currentDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    </button>
                    <button onClick={() => { const d = new Date((filters.date || getTodayISO()) + "T00:00:00"); d.setDate(d.getDate() + 1); updateFilter("date", `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:brightness-95" style={{ background: "var(--surface-container-low)" }}>
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--on-surface)" }} />
                    </button>
                  </div>

                  <div className="w-px h-6 shrink-0" style={{ background: "var(--surface-container-high)" }} />

                  {/* Live count */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--secondary)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                      {availableRooms.filter((r) => isRoomFreeAt(r.id, currentDate, currentTime, mergedBookings)).length}
                    </span>
                    <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>libres maintenant</span>
                  </div>

                  <div className="flex-1" />

                  {favorites.size > 0 && (
                    <button onClick={() => setCurrentPage("favorites" as NavPage)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: "#ffeaea", color: "#93000a" }}>
                      <Heart className="w-3.5 h-3.5" style={{ fill: "#e53935", color: "#e53935" }} />
                      {favorites.size} favori{favorites.size > 1 ? "s" : ""}
                    </button>
                  )}
                  <ViewToggle view={view} onViewChange={setView} />
                </div>

                {/* Section header */}
                <div className="flex items-center justify-between px-6 mt-5 mb-4">
                  <div>
                    <h2 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
                      Disponibilité en temps réel
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                      {rooms.length} espace{rooms.length !== 1 ? "s" : ""} · cliquez un créneau pour réserver directement
                    </p>
                  </div>
                </div>

                <div className="px-3 sm:px-6">
                  {availableRooms.length === 0 ? (
                    <div
                      className="text-center py-16 rounded-2xl text-sm"
                      style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
                    >
                      {rooms.length === 0 ? "Aucune salle ne correspond aux filtres sélectionnés" : "Aucune salle disponible pour ce créneau"}
                    </div>
                  ) : view === "grid" ? (
                    <WeekGrid
                      rooms={availableRooms}
                      bookings={mergedBookings}
                      selectedDate={currentDate}
                      sharedBookings={activeSharedBookings}
                      mySharedBookings={mySharedBookings}
                      onWeekChange={(d) => updateFilter("date", d)}
                      onSelectDate={(d) => updateFilter("date", d)}
                    />
                  ) : (
                    <RoomList
                      rooms={availableRooms}
                      bookings={mergedBookings}
                      date={currentDate}
                      favorites={favorites}
                      slotDuration={Number(filters.slotDuration) || 1}
                      userType={user.type}
                      studentMaxSeats={adminConfig.studentMaxSeats}
                      sharedBookings={activeSharedBookings}
                      mySharedBookings={mySharedBookings}
                      onToggleFavorite={toggleFavorite}
                      onViewOnMap={handleViewOnMap}
                      onSelectRoom={handleSelectRoom}
                      onBook={handleBook}
                    />
                  )}
                </div>
              </div>
            )
          )}

          {/* Favorites page */}
          {!selectedRoomId && (currentPage as string) === "favorites" && (
            <div className="flex flex-col pb-10">
              <div className="px-3 sm:px-6 mt-6 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className="text-sm"
                    style={{ color: "var(--primary)" }}
                  >
                    ← Tableau de bord
                  </button>
                </div>
                <h2 className="text-xl font-bold mt-2" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
                  Mes favoris
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                  {favoriteRooms.length} salle{favoriteRooms.length !== 1 ? "s" : ""} sauvegardée{favoriteRooms.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="px-3 sm:px-6">
                {favoriteRooms.length === 0 ? (
                  <FavoritesEmptyState />
                ) : (
                  <RoomList
                    rooms={favoriteRooms}
                    bookings={mergedBookings}
                    date={currentDate}
                    favorites={favorites}
                    userType={user.type}
                    studentMaxSeats={adminConfig.studentMaxSeats}
                    sharedBookings={activeSharedBookings}
                    mySharedBookings={mySharedBookings}
                    onToggleFavorite={toggleFavorite}
                    onViewOnMap={handleViewOnMap}
                    onSelectRoom={handleSelectRoom}
                    onBook={handleBook}
                  />
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {showAccount && (
        <AccountPanel
          user={user}
          onUpdateUser={handleUpdateUser}
          bookings={myBookings}
          onCancelBooking={handleCancelBooking}
          onClose={() => setShowAccount(false)}
          onSignOut={async () => { await supabase.auth.signOut(); setShowAccount(false); }}
        />
      )}
    </div>
  );
}
