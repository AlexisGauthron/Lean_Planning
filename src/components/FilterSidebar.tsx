"use client";

import { FilterState } from "@/hooks/useFilters";
import { LayoutGrid, Heart, CalendarDays, Map } from "lucide-react";

interface FilterSidebarProps {
  filters: FilterState;
  allCampuses: string[];
  allEquipment: string[];
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleEquipment: (eq: string) => void;
  onReset: () => void;
}

const capacityOptions = [
  { label: "1-4 Seats", min: 1, max: 4 },
  { label: "5-12 Seats", min: 5, max: 12 },
  { label: "13-30 Seats", min: 13, max: 30 },
  { label: "Auditorium", min: 60, max: 999 },
];

export function FilterSidebar({
  filters,
  allCampuses,
  allEquipment,
  onUpdateFilter,
  onToggleEquipment,
  onReset,
}: FilterSidebarProps) {
  const selectedCapacity = capacityOptions.find(
    (o) => String(o.min) === filters.minCapacity
  );

  return (
    <aside
      className="w-64 shrink-0 flex flex-col overflow-y-auto"
      style={{ background: "var(--surface-container-low)" }}
    >
      {/* Nav links */}
      <nav className="px-4 pt-5 pb-3 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: "var(--on-surface-variant)" }}>
          Filters
        </p>
        <p className="text-xs px-3 mb-3" style={{ color: "var(--on-surface-variant)" }}>
          Refine your sanctuary
        </p>

        {[
          { icon: <LayoutGrid className="w-4 h-4" />, label: "All Rooms" },
          { icon: <Heart className="w-4 h-4" />, label: "Favorites" },
          { icon: <CalendarDays className="w-4 h-4" />, label: "My Bookings" },
          { icon: <Map className="w-4 h-4" />, label: "Map View" },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors hover:bg-[var(--surface-container)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <div className="mx-4 my-1" style={{ height: "1px", background: "var(--surface-container)" }} />

      {/* Filters */}
      <div className="px-4 pt-3 pb-6 flex flex-col gap-5">

        {/* Campus location */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>
            Campus Location
          </label>
          <div
            className="w-full px-3 py-2.5 rounded-xl text-sm flex items-center justify-between cursor-pointer"
            style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)" }}
          >
            <select
              value={filters.campus}
              onChange={(e) => onUpdateFilter("campus", e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: "var(--on-surface)" }}
            >
              <option value="">Main University Grounds</option>
              {allCampuses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Room capacity */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>
            Room Capacity
          </label>
          <div className="grid grid-cols-2 gap-2">
            {capacityOptions.map((opt) => {
              const active = filters.minCapacity === String(opt.min);
              return (
                <button
                  key={opt.label}
                  onClick={() => onUpdateFilter("minCapacity", active ? "" : String(opt.min))}
                  className="px-2 py-2 rounded-xl text-xs font-medium text-center transition-all"
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

        {/* Availability */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>
            Availability
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onUpdateFilter("date", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-container-lowest)",
                color: "var(--on-surface)",
                border: "none",
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={filters.timeStart || "09:00"}
                onChange={(e) => onUpdateFilter("timeStart", e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)", border: "none" }}
              />
              <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>to</span>
              <input
                type="time"
                value={filters.timeEnd || "11:00"}
                onChange={(e) => onUpdateFilter("timeEnd", e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)", border: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Equipment */}
        {allEquipment.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>
              Equipment & Features
            </label>
            <div className="flex flex-col gap-2">
              {allEquipment.map((eq) => (
                <label key={eq} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-colors"
                    style={{
                      background: filters.equipment.includes(eq) ? "var(--primary)" : "var(--surface-container-highest)",
                    }}
                    onClick={() => onToggleEquipment(eq)}
                  >
                    {filters.equipment.includes(eq) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm" style={{ color: "var(--on-surface)" }}>{eq}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Apply button */}
        <button
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
            color: "var(--on-primary)",
          }}
        >
          Apply Filters
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="w-full py-2 text-sm transition-colors"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Reset all filters
        </button>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto px-4 pb-6 flex flex-col gap-1">
        <div className="my-3" style={{ height: "1px", background: "var(--surface-container)" }} />
        {["Support", "Sign Out"].map((item) => (
          <button
            key={item}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--surface-container)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
}
