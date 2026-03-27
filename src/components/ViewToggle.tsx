"use client";

import { LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center rounded-full p-1 gap-1"
      style={{ background: "var(--surface-container)" }}
    >
      {(["list", "grid"] as const).map((v) => {
        const active = view === v;
        return (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: active ? "var(--surface-container-lowest)" : "transparent",
              color: active ? "var(--primary)" : "var(--on-surface-variant)",
              boxShadow: active ? "0 1px 4px rgba(25,28,29,0.08)" : "none",
            }}
          >
            {v === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {v === "grid" ? "Grid" : "List View"}
          </button>
        );
      })}
    </div>
  );
}
