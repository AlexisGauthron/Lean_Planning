"use client";

import { FilterState } from "@/hooks/useFilters";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";

interface FilterSidebarProps {
  filters: FilterState;
  allCampuses: string[];
  allEquipment: string[];
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleEquipment: (eq: string) => void;
  onReset: () => void;
}

export function FilterSidebar({
  filters,
  allCampuses,
  allEquipment,
  onUpdateFilter,
  onToggleEquipment,
  onReset,
}: FilterSidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 p-5 flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filtres</h2>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Recherche */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Recherche</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nom de salle..."
            value={filters.search}
            onChange={(e) => onUpdateFilter("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Campus */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Campus</label>
        <select
          value={filters.campus}
          onChange={(e) => onUpdateFilter("campus", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les campus</option>
          {allCampuses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => onUpdateFilter("date", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Capacite min */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Capacite minimum
        </label>
        <input
          type="number"
          min={0}
          step={5}
          placeholder="Ex: 30"
          value={filters.minCapacity}
          onChange={(e) => onUpdateFilter("minCapacity", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Equipement */}
      {allEquipment.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipement</label>
          <div className="flex flex-col gap-2">
            {allEquipment.map((eq) => (
              <label key={eq} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.equipment.includes(eq)}
                  onChange={() => onToggleEquipment(eq)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{eq}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
