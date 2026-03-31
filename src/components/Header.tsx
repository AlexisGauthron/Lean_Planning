"use client";

import { CSVMetadata } from "@/lib/types";
import { Bell, HelpCircle, Search, X, Clock, ShieldCheck, Menu } from "lucide-react";
import { useState, useEffect } from "react";

// ─── Live clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    };
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      tick();
      const id = setInterval(tick, 60000);
      return () => clearInterval(id);
    }, msToNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{ background: "var(--surface-container-low)" }}
    >
      <Clock className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
      <span
        className="text-sm font-bold tabular-nums"
        style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)", letterSpacing: "0.02em" }}
      >
        {time}
      </span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type NavPage = "dashboard" | "now" | "bookings" | "map" | "admin";

export interface AppNotification {
  id: string;
  message: string;
  detail?: string;
  type: "email" | "approval" | "info";
  read: boolean;
}

interface HeaderProps {
  metadata: CSVMetadata | null;
  totalRooms: number;
  searchValue?: string;
  onSearch?: (value: string) => void;
  currentPage?: NavPage;
  onNavigate?: (page: NavPage) => void;
  notifications?: AppNotification[];
  onMarkAllRead?: () => void;
  user?: { name: string; email: string };
  onOpenAccount?: () => void;
  isAdmin?: boolean;
}

const NAV_ITEMS: { label: string; page: NavPage; dot?: boolean; adminOnly?: boolean }[] = [
  { label: "Administration", page: "admin", adminOnly: true },
  { label: "Tableau de bord", page: "dashboard" },
  { label: "Maintenant", page: "now", dot: true },
  { label: "Mes réservations", page: "bookings" },
  { label: "Plan du campus", page: "map" },
];

const NOTIF_ICON: Record<string, string> = {
  email: "📧",
  approval: "✅",
  info: "ℹ️",
};

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header({
  metadata,
  totalRooms,
  searchValue = "",
  onSearch,
  currentPage = "dashboard",
  onNavigate,
  notifications = [],
  onMarkAllRead,
  user,
  onOpenAccount,
  isAdmin = false,
}: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const handleOpenNotif = () => {
    const next = !showNotif;
    setShowNotif(next);
    setShowHelp(false);
    setShowMobileMenu(false);
    if (next) onMarkAllRead?.();
  };

  const handleNavigate = (page: NavPage) => {
    onNavigate?.(page);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300"
        style={{
          background: "var(--surface-container-lowest)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        {/* Logo */}
        <button
          className="flex items-center gap-2 shrink-0"
          onClick={() => handleNavigate(isAdmin ? "admin" : "dashboard")}
        >
          {isAdmin && (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)", opacity: 0.9 }}>
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--on-primary)" }} />
            </div>
          )}
          <span className="text-base sm:text-lg font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif", color: "var(--primary)" }}>
            Campus Rooms
          </span>
          {isAdmin && (
            <span
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)", border: "1px solid var(--outline-variant)" }}
            >
              Admin
            </span>
          )}
        </button>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ label, page, dot }) => {
            const active = currentPage === page;
            const isAdminPage = page === "admin";
            return (
              <button
                key={page}
                onClick={() => handleNavigate(page)}
                className="relative px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
                style={{
                  background: active ? "var(--secondary-container)" : "transparent",
                  color: active ? "var(--primary)" : "var(--on-surface-variant)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--secondary)" }} />}
                {isAdminPage && <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
                {label}
              </button>
            );
          })}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-[160px] sm:max-w-xs md:max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
          <input
            type="text"
            placeholder="Rechercher…"
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-full outline-none transition-all"
            style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "none" }}
            onFocus={(e) => { e.currentTarget.style.background = "var(--surface-container)"; e.currentTarget.style.boxShadow = "0 0 0 1.5px var(--primary)"; }}
            onBlur={(e) => { e.currentTarget.style.background = "var(--surface-container-low)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          {searchValue && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => onSearch?.("")}>
              <X className="w-3.5 h-3.5" style={{ color: "var(--on-surface-variant)" }} />
            </button>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <LiveClock />

          {/* Notifications */}
          <div className="relative">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors relative"
              style={{ background: showNotif ? "var(--surface-container)" : "transparent" }}
              onClick={handleOpenNotif}
            >
              <Bell className="w-5 h-5" style={{ color: "var(--on-surface-variant)" }} />
              {unread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {showNotif && (
              <div
                className="absolute right-0 top-11 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl p-4 z-50"
                style={{ background: "var(--surface-container-lowest)", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", border: "1px solid var(--outline-variant)" }}
              >
                <p className="text-sm font-semibold mb-3" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>Notifications</p>
                {notifications.length === 0 ? (
                  <p className="text-xs py-2 text-center" style={{ color: "var(--on-surface-variant)" }}>Aucune notification.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                    {[...notifications].reverse().map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                        style={{ background: n.read ? "transparent" : "var(--secondary-container)" }}
                      >
                        <span className="text-base shrink-0 mt-0.5">{NOTIF_ICON[n.type]}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-snug" style={{ color: "var(--on-surface)" }}>{n.message}</p>
                          {n.detail && <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>{n.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aide — desktop only */}
          <div className="relative hidden sm:block">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: showHelp ? "var(--surface-container)" : "transparent" }}
              onClick={() => { setShowHelp(!showHelp); setShowNotif(false); }}
            >
              <HelpCircle className="w-5 h-5" style={{ color: "var(--on-surface-variant)" }} />
            </button>
            {showHelp && (
              <div
                className="absolute right-0 top-11 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl p-4 z-50"
                style={{ background: "var(--surface-container-lowest)", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", border: "1px solid var(--outline-variant)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}>Aide</p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    "Rechercher une salle par nom ou campus",
                    "Filtrer par capacité et équipement",
                    "Voir la dispo semaine avec la vue Grille",
                    "Réserver un créneau libre",
                  ].map((tip) => (
                    <li key={tip} className="text-xs flex items-start gap-2" style={{ color: "var(--on-surface-variant)" }}>
                      <span style={{ color: "var(--secondary)" }}>✓</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Avatar */}
          <button
            onClick={onOpenAccount}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:opacity-80"
            style={{ background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif" }}
            title="Mon compte"
          >
            {user ? user.name.charAt(0).toUpperCase() : "U"}
          </button>

          {/* Burger — mobile only */}
          <button
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: showMobileMenu ? "var(--surface-container)" : "transparent" }}
            onClick={() => { setShowMobileMenu(!showMobileMenu); setShowNotif(false); setShowHelp(false); }}
          >
            {showMobileMenu
              ? <X className="w-5 h-5" style={{ color: "var(--on-surface)" }} />
              : <Menu className="w-5 h-5" style={{ color: "var(--on-surface)" }} />
            }
          </button>
        </div>
      </header>

      {/* Mobile nav menu */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-x-0 top-[53px] z-40 py-3 flex flex-col"
          style={{ background: "var(--surface-container-lowest)", borderBottom: "1px solid var(--outline-variant)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        >
          {NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ label, page, dot }) => {
            const active = currentPage === page;
            const isAdminPage = page === "admin";
            return (
              <button
                key={page}
                onClick={() => handleNavigate(page)}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--secondary-container)" : "transparent",
                  color: active ? "var(--primary)" : "var(--on-surface-variant)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--secondary)" }} />}
                {isAdminPage && <ShieldCheck className="w-4 h-4 shrink-0" />}
                {label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
