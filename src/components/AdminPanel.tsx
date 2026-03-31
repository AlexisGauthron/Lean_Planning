"use client";

import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Settings, History, AlertCircle, Users } from "lucide-react";
import { SharedBooking, AdminConfig } from "@/lib/types";

export interface Profile {
  id: string;
  name: string;
  type: "student" | "association" | "prof" | "admin";
}

interface AdminPanelProps {
  sharedBookings: SharedBooking[];
  adminConfig: AdminConfig;
  profiles: Profile[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateConfig: (config: AdminConfig) => void;
  onUpdateUserType: (userId: string, type: "student" | "association" | "prof") => void;
}

const STATUS_CFG = {
  pending:  { label: "En attente", color: "var(--primary)",          bg: "var(--secondary-container)",  dot: "var(--primary)" },
  approved: { label: "Confirmée",  color: "#4ade80",                  bg: "rgba(74,222,128,0.15)",        dot: "#4ade80" },
  rejected: { label: "Refusée",    color: "rgba(255,100,100,0.9)",    bg: "rgba(255,100,100,0.12)",       dot: "rgba(255,100,100,0.9)" },
} as const;

const USER_TYPES = [
  { key: "student"     as const, label: "Élève" },
  { key: "association" as const, label: "Association" },
  { key: "prof"        as const, label: "Prof" },
];

function ConfigRow({
  label, sublabel, value, min, max, onChange,
}: {
  label: string; sublabel: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--on-surface)" }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>{sublabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-opacity hover:opacity-70"
            style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
          >
            −
          </button>
          <span
            className="text-xl font-bold w-14 text-center"
            style={{ fontFamily: "Manrope, sans-serif", color: "var(--primary)" }}
          >
            {value}
          </span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-opacity hover:opacity-70"
            style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
          >
            +
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--primary)" }}
      />
      <div className="flex justify-between text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
        <span>{min} j</span>
        <span>{max} j</span>
      </div>
    </div>
  );
}

function BookingCard({
  booking, onApprove, onReject, showActions,
}: {
  booking: SharedBooking;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}) {
  const status = booking.status ?? "pending";
  const cfg = STATUS_CFG[status];

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif" }}
        >
          {booking.userName?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>{booking.userName}</p>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
            >
              {booking.type === "full" ? "Salle entière" : `${booking.seats} place${booking.seats > 1 ? "s" : ""}`}
            </span>
          </div>
          <p className="text-sm font-semibold mt-1" style={{ color: "var(--on-surface)" }}>{booking.roomId}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {new Date(booking.date + "T00:00:00").toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long",
            })}
            {" · "}{booking.start}–{booking.end}
          </p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </div>

      {showActions && status === "pending" && onApprove && onReject && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onReject(booking.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-75"
            style={{ background: "rgba(255,100,100,0.15)", color: "rgba(255,130,130,1)", border: "1px solid rgba(255,100,100,0.25)" }}
          >
            <XCircle className="w-4 h-4" /> Refuser
          </button>
          <button
            onClick={() => onApprove(booking.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-75"
            style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}
          >
            <CheckCircle className="w-4 h-4" /> Approuver
          </button>
        </div>
      )}
    </div>
  );
}

function UserGroup({ userName, bookings }: { userName: string; bookings: SharedBooking[] }) {
  const [open, setOpen] = useState(false);
  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--surface-container-high)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 transition-colors hover:opacity-90"
        style={{ background: "var(--surface-container-low)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif" }}
        >
          {userName?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--on-surface)" }}>{userName}</p>
          <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
            {bookings.length} réservation{bookings.length > 1 ? "s" : ""}
            {pending > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "var(--secondary-container)", color: "var(--primary)" }}
              >
                {pending} en attente
              </span>
            )}
          </p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
        }
      </button>
      {open && (
        <div
          className="flex flex-col gap-2 px-4 pb-4 pt-2"
          style={{ background: "var(--surface-container)", borderTop: "1px solid var(--surface-container-high)" }}
        >
          {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  );
}

function UserTypeCard({ profile, onUpdateType }: {
  profile: Profile;
  onUpdateType: (id: string, type: "student" | "association" | "prof") => void;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--surface-container-high)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif" }}
        >
          {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <p className="font-semibold text-sm flex-1 min-w-0 truncate" style={{ color: "var(--on-surface)" }}>
          {profile.name || "—"}
        </p>
      </div>
      <div className="flex gap-2">
        {USER_TYPES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => profile.type !== key && onUpdateType(profile.id, key)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: profile.type === key ? "var(--primary)" : "var(--surface-container-high)",
              color: profile.type === key ? "var(--on-primary)" : "var(--on-surface-variant)",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminPanel({ sharedBookings, adminConfig, profiles, onApprove, onReject, onUpdateConfig, onUpdateUserType }: AdminPanelProps) {
  const [tab, setTab] = useState<"pending" | "all" | "users" | "settings">("pending");
  const [config, setConfig] = useState<AdminConfig>({ ...adminConfig });
  const [configDirty, setConfigDirty] = useState(false);

  const pending = sharedBookings.filter((b) => b.status === "pending");
  const sorted = [...sharedBookings].sort((a, b) =>
    b.date.localeCompare(a.date) || b.start.localeCompare(a.start)
  );

  const byUser: Record<string, SharedBooking[]> = {};
  sorted.forEach((b) => {
    const key = b.userName || "Inconnu";
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(b);
  });

  const updateConfig = (key: keyof AdminConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setConfigDirty(true);
  };

  // Non-admin profiles only (admins can't have their type changed here)
  const editableProfiles = profiles.filter((p) => p.type !== "admin");

  const TABS = [
    { key: "pending"  as const, label: pending.length > 0 ? `Demandes (${pending.length})` : "Demandes", icon: Clock },
    { key: "all"      as const, label: "Historique",   icon: History },
    { key: "users"    as const, label: `Utilisateurs${editableProfiles.length > 0 ? ` (${editableProfiles.length})` : ""}`, icon: Users },
    { key: "settings" as const, label: "Paramètres",   icon: Settings },
  ];

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-3 sm:px-6 mt-6 mb-5">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}
        >
          Administration
        </h2>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Gérez les réservations et les paramètres du système
        </p>
      </div>

      {/* Stats bar */}
      <div className="mx-3 sm:mx-6 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "En attente", value: sharedBookings.filter(b => b.status === "pending").length,  color: "var(--primary)",   bg: "var(--secondary-container)", icon: Clock },
          { label: "Confirmées", value: sharedBookings.filter(b => b.status === "approved").length, color: "#4ade80",           bg: "rgba(74,222,128,0.12)",       icon: CheckCircle },
          { label: "Total",      value: sharedBookings.length,                                       color: "var(--on-surface)", bg: "var(--surface-container)",   icon: AlertCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 flex flex-col items-center gap-1" style={{ background: bg }}>
            <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
            <p className="text-2xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color }}>{value}</p>
            <p className="text-xs" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-3 sm:px-6 mb-5">
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: "var(--surface-container-low)" }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
              style={{
                background: tab === key ? "var(--primary)" : "transparent",
                color: tab === key ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-6 flex flex-col gap-3">
        {/* ── Demandes ── */}
        {tab === "pending" && (
          pending.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl text-sm flex flex-col items-center gap-2"
              style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              <CheckCircle className="w-8 h-8 opacity-40" />
              Aucune demande en attente
            </div>
          ) : (
            pending.map((b) => (
              <BookingCard key={b.id} booking={b} onApprove={onApprove} onReject={onReject} showActions />
            ))
          )
        )}

        {/* ── Historique ── */}
        {tab === "all" && (
          Object.keys(byUser).length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl text-sm flex flex-col items-center gap-2"
              style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              <History className="w-8 h-8 opacity-40" />
              Aucune réservation
            </div>
          ) : (
            Object.entries(byUser).map(([name, bookings]) => (
              <UserGroup key={name} userName={name} bookings={bookings} />
            ))
          )
        )}

        {/* ── Utilisateurs ── */}
        {tab === "users" && (
          editableProfiles.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl text-sm flex flex-col items-center gap-2"
              style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
            >
              <Users className="w-8 h-8 opacity-40" />
              Aucun utilisateur inscrit
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                Type de compte
              </p>
              {editableProfiles.map((p) => (
                <UserTypeCard key={p.id} profile={p} onUpdateType={onUpdateUserType} />
              ))}
            </>
          )
        )}

        {/* ── Paramètres ── */}
        {tab === "settings" && (
          <div className="flex flex-col gap-4">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Délai maximum de réservation à l&apos;avance
            </p>
            <ConfigRow
              label="Élève"
              sublabel="jours à l'avance maximum"
              value={config.studentMaxDays}
              min={1} max={30}
              onChange={(v) => updateConfig("studentMaxDays", v)}
            />
            <ConfigRow
              label="Association"
              sublabel="jours à l'avance maximum"
              value={config.assoMaxDays}
              min={7} max={90}
              onChange={(v) => updateConfig("assoMaxDays", v)}
            />
            <ConfigRow
              label="Professeur"
              sublabel="jours à l'avance maximum"
              value={config.profMaxDays}
              min={14} max={365}
              onChange={(v) => updateConfig("profMaxDays", v)}
            />
            <p
              className="text-xs font-bold uppercase tracking-widest mt-2"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Limites pour les élèves
            </p>
            <ConfigRow
              label="Places maximum"
              sublabel="places par réservation"
              value={config.studentMaxSeats}
              min={1} max={20}
              onChange={(v) => updateConfig("studentMaxSeats", v)}
            />
            <ConfigRow
              label="Salles maximum par jour"
              sublabel="salles différentes réservables par jour"
              value={config.studentMaxRoomsPerDay}
              min={1} max={10}
              onChange={(v) => updateConfig("studentMaxRoomsPerDay", v)}
            />

            {configDirty && (
              <button
                onClick={() => { onUpdateConfig(config); setConfigDirty(false); }}
                className="w-full py-3 rounded-2xl text-sm font-bold mt-2 transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)", color: "var(--on-primary)" }}
              >
                Enregistrer les paramètres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
