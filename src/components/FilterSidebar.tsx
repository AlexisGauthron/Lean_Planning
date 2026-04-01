"use client";

import { FilterState } from "@/hooks/useFilters";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

interface FilterSidebarProps {
  filters: FilterState;
  allCampuses: string[];
  allEquipment: string[];
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleEquipment: (eq: string) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const capacityOptions = [
  { label: "1–4", min: 1 },
  { label: "5–12", min: 5 },
  { label: "13–30", min: 13 },
  { label: "30+", min: 30 },
];

const durationOptions = [
  { label: "1h", value: "1" },
  { label: "2h", value: "2" },
];

export function FilterSidebar({
  filters,
  allCampuses,
  allEquipment,
  onUpdateFilter,
  onToggleEquipment,
  onReset,
  isOpen,
  onToggle,
}: FilterSidebarProps) {
  const hasActiveFilters =
    !!filters.campus || !!filters.date || !!filters.minCapacity ||
    filters.equipment.length > 0 || !!filters.timeStart || !!filters.timeEnd ||
    filters.slotDuration !== "1";

  if (!isOpen) {
    return (
      <>
        {/* Collapsed sidebar — sm+ only */}
        <aside
          className="shrink-0 hidden sm:flex flex-col items-center py-4 gap-4"
          style={{
            width: "48px",
            background: "var(--surface-container-low)",
            borderRight: "1px solid var(--surface-container)",
          }}
        >
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:brightness-95"
            style={{ background: "var(--surface-container)" }}
            title="Ouvrir les filtres"
          >
            <ChevronRight className="w-4 h-4" style={{ color: "var(--primary)" }} />
          </button>
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
            {hasActiveFilters && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ background: "var(--primary)" }}
              />
            )}
          </div>
        </aside>

        {/* Floating filter button — mobile only */}
        <button
          className="sm:hidden fixed bottom-5 left-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
          style={{ background: "var(--primary)", color: "var(--on-primary)", fontFamily: "Manrope, sans-serif", fontSize: "0.875rem", fontWeight: 600 }}
          onClick={onToggle}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white opacity-90 shrink-0" />}
        </button>
      </>
    );
  }

  return (
    <>
      {/* Backdrop mobile */}
      <div
        className="sm:hidden fixed inset-0 top-[53px] z-30"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        onClick={onToggle}
      />
    <aside
      className="fixed sm:relative top-[53px] sm:top-auto bottom-0 sm:bottom-auto left-0 z-40 sm:z-auto w-72 sm:w-60 shrink-0 flex flex-col overflow-y-auto"
      style={{ background: "var(--surface-container-low)", borderRight: "1px solid var(--surface-container)" }}
    >
      <div className="px-4 pt-5 pb-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
            Filtres
          </p>
          <div className="flex items-center gap-1.5">
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ color: "var(--primary)", background: "rgba(0,71,141,0.08)" }}
              >
                Réinitialiser
              </button>
            )}
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-xl flex items-center justify-center hover:brightness-95"
              style={{ background: "var(--surface-container)" }}
              title="Replier les filtres"
            >
              <ChevronLeft className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
            </button>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
            Durée minimum
          </label>
          <div className="flex gap-2">
            {durationOptions.map((opt) => {
              const active = filters.slotDuration === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onUpdateFilter("slotDuration", opt.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: active ? "var(--primary)" : "var(--surface-container-lowest)",
                    color: active ? "var(--on-primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campus */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
            Campus
          </label>
          <select
            value={filters.campus}
            onChange={(e) => onUpdateFilter("campus", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
            style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)", border: "none" }}
          >
            <option value="">Tous les campus</option>
            {allCampuses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
            Capacité
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {capacityOptions.map((opt) => {
              const active = filters.minCapacity === String(opt.min);
              return (
                <button
                  key={opt.label}
                  onClick={() => onUpdateFilter("minCapacity", active ? "" : String(opt.min))}
                  className="py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: active ? "var(--primary)" : "var(--surface-container-lowest)",
                    color: active ? "var(--on-primary)" : "var(--on-surface-variant)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
            Date
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onUpdateFilter("date", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)", border: "none" }}
          />
        </div>

        {/* Time range */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
            Créneau horaire
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={filters.timeStart}
              onChange={(e) => onUpdateFilter("timeStart", e.target.value)}
              className="flex-1 px-2 py-2.5 rounded-xl text-xs outline-none"
              style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)", border: "none" }}
            />
            <span className="text-xs shrink-0" style={{ color: "var(--on-surface-variant)" }}>→</span>
            <input
              type="time"
              value={filters.timeEnd}
              onChange={(e) => onUpdateFilter("timeEnd", e.target.value)}
              className="flex-1 px-2 py-2.5 rounded-xl text-xs outline-none"
              style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)", border: "none" }}
            />
          </div>
        </div>

        {/* Equipment */}
        {allEquipment.length > 0 && (
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
              Équipements
            </label>
            <div className="flex flex-col gap-2">
              {allEquipment.map((eq) => {
                const checked = filters.equipment.includes(eq);
                return (
                  <label key={eq} className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                      style={{ background: checked ? "var(--primary)" : "var(--surface-container-highest)" }}
                      onClick={() => onToggleEquipment(eq)}
                    >
                      {checked && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: "var(--on-surface)" }}>{eq}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pb-5 flex flex-col gap-1">
        <div className="mb-3" style={{ height: "1px", background: "var(--surface-container)" }} />
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left" style={{ color: "var(--on-surface-variant)" }} onClick={() => window.open("mailto:support@campusrooms.fr")}>
          Assistance
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left" style={{ color: "var(--on-surface-variant)" }} onClick={() => alert("Déconnexion...")}>
          Se déconnecter
        </button>
      </div>
    </aside>
    </>
  );
}
