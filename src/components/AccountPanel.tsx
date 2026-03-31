"use client";

import { useState } from "react";
import { X, Mail, CheckCircle, Clock } from "lucide-react";

export interface MyBooking {
  id: string;
  roomId: string;
  campus: string;
  date: string;
  start: string;
  end: string;
  status: "pending" | "approved" | "rejected";
}

export interface AppUser {
  name: string;
  email: string;
  type: "student" | "association" | "prof" | "admin";
}

interface AccountPanelProps {
  user: AppUser;
  onUpdateUser: (u: AppUser) => void;
  bookings: MyBooking[];
  onCancelBooking: (id: string) => void;
  onClose: () => void;
  onSignOut: () => void;
}

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending:  { label: "En attente",  bg: "var(--secondary-container)", color: "var(--primary)",           dot: "var(--primary)" },
  approved: { label: "Confirmée",   bg: "rgba(74,222,128,0.15)",       color: "#4ade80",                  dot: "#4ade80" },
  rejected: { label: "Refusée",     bg: "rgba(255,100,100,0.12)",      color: "rgba(255,130,130,1)",      dot: "rgba(255,130,130,1)" },
};

export function AccountPanel({ user, onUpdateUser, bookings, onCancelBooking, onClose, onSignOut }: AccountPanelProps) {
  const [editName, setEditName] = useState(user.name);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    if (editName.trim()) onUpdateUser({ ...user, name: editName.trim() });
    setEditing(false);
  };

  const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  const pending  = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved").length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(25,28,29,0.35)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panneau */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col"
        style={{ background: "var(--surface)", boxShadow: "-8px 0 48px rgba(25,28,29,0.18)" }}
      >
        {/* En-tête */}
        <div
          className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5"
          style={{ borderBottom: "1px solid var(--surface-container-high)" }}
        >
          <p className="font-bold text-lg" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
            Mon compte
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-container)" }}
          >
            <X className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6">

          {/* Profil */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {editing ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-center outline-none"
                  style={{
                    background: "var(--surface-container-low)",
                    color: "var(--on-surface)",
                    border: "1.5px solid var(--primary)",
                  }}
                />
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button onClick={() => setEditing(true)}>
                  <p className="font-bold text-xl" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>
                    {user.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>Modifier le nom</p>
                </button>
              </div>
            )}

            {/* Type — lecture seule, défini à l'inscription */}
            {(() => {
              const TYPE_LABELS: Record<string, string> = {
                student: "🎓 Élève",
                association: "🏛 Association",
                prof: "👨‍🏫 Professeur",
                admin: "🔐 Administrateur",
              };
              return (
                <div
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "var(--secondary-container)", color: "var(--primary)" }}
                >
                  {TYPE_LABELS[user.type] ?? user.type}
                </div>
              );
            })()}

            <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center" style={{ background: "var(--secondary-container)" }}>
              <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--primary)" }} />
              <p className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "Manrope, sans-serif" }}>{pending}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>En attente</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(74,222,128,0.12)" }}>
              <CheckCircle className="w-5 h-5 mx-auto mb-1" style={{ color: "#4ade80" }} />
              <p className="text-2xl font-bold" style={{ color: "#4ade80", fontFamily: "Manrope, sans-serif" }}>{approved}</p>
              <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>Confirmées</p>
            </div>
          </div>

          {/* Historique */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--on-surface-variant)" }}>
              Historique
            </p>
            {sorted.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--on-surface-variant)" }}>
                Aucune réservation
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {sorted.map((b) => {
                  const cfg = STATUS[b.status];
                  return (
                    <div
                      key={b.id}
                      className="rounded-2xl p-3 flex items-center gap-3"
                      style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: "var(--on-surface)" }}>{b.roomId}</p>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shrink-0"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                          {new Date(b.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          {" · "}{b.start}–{b.end}
                        </p>
                        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{b.campus}</p>
                      </div>
                      {b.status === "pending" && (
                        <button
                          onClick={() => onCancelBooking(b.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "#ffdad6" }}
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5" style={{ color: "#ba1a1a" }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pied */}
        <div
          className="shrink-0 px-4 sm:px-6 py-4"
          style={{ borderTop: "1px solid var(--surface-container-high)" }}
        >
          <button
            onClick={onSignOut}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "rgba(255,100,100,0.15)", color: "rgba(255,130,130,1)" }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}
