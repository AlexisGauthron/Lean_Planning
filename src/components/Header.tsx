"use client";

import { CSVMetadata } from "@/lib/types";
import { Bell, HelpCircle, Search } from "lucide-react";

interface HeaderProps {
  metadata: CSVMetadata | null;
  totalRooms: number;
  searchValue?: string;
  onSearch?: (value: string) => void;
}

export function Header({ metadata, totalRooms, searchValue = "", onSearch }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between gap-4"
      style={{
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(194,198,212,0.25)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: "Manrope, sans-serif", color: "var(--primary)" }}
        >
          Campus Rooms
        </span>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1">
        {["Dashboard", "My Bookings", "Campus Map"].map((item, i) => (
          <button
            key={item}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={{
              color: i === 0 ? "var(--primary)" : "var(--on-surface-variant)",
              background: i === 0 ? "rgba(0,71,141,0.08)" : "transparent",
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Search bar */}
      <div
        className="flex-1 max-w-sm relative"
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--on-surface-variant)" }}
        />
        <input
          type="text"
          placeholder="Search for a sanctuary…"
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-full outline-none transition-all"
          style={{
            background: "var(--surface-container-low)",
            color: "var(--on-surface)",
            border: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "var(--surface-container-lowest)";
            e.currentTarget.style.boxShadow = "0 0 0 1.5px rgba(0,71,141,0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "var(--surface-container-low)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--surface-container)]"
        >
          <Bell className="w-5 h-5" style={{ color: "var(--on-surface-variant)" }} />
        </button>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--surface-container)]"
        >
          <HelpCircle className="w-5 h-5" style={{ color: "var(--on-surface-variant)" }} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          U
        </div>
      </div>
    </header>
  );
}
