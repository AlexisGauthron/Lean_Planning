"use client";

import { LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewChange("grid")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          view === "grid"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Grille
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          view === "list"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <List className="w-4 h-4" />
        Liste
      </button>
    </div>
  );
}
