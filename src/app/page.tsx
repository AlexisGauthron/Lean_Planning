"use client";

import { useState } from "react";
import { useRooms } from "@/hooks/useRooms";
import { useFilters } from "@/hooks/useFilters";
import { Header } from "@/components/Header";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FreeRoomCounter } from "@/components/FreeRoomCounter";
import { WeekGrid } from "@/components/WeekGrid";
import { RoomList } from "@/components/RoomList";
import { ViewToggle } from "@/components/ViewToggle";
import { Loader2, ArrowRight } from "lucide-react";

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const { filters, updateFilter, resetFilters, toggleEquipment, apiParams } = useFilters();
  const { rooms, bookings, metadata, totalRooms, allCampuses, allEquipment, isLoading, error } =
    useRooms(apiParams);
  const [view, setView] = useState<"grid" | "list">("list");

  const currentDate = filters.date || getTodayISO();
  const currentTime = getCurrentTime();

  const handleWeekChange = (mondayISO: string) => {
    updateFilter("date", mondayISO);
  };

  const handleSearch = (value: string) => {
    updateFilter("search", value);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface)" }}>
      <Header
        metadata={metadata}
        totalRooms={totalRooms}
        searchValue={filters.search}
        onSearch={handleSearch}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          allCampuses={allCampuses}
          allEquipment={allEquipment}
          onUpdateFilter={updateFilter}
          onToggleEquipment={toggleEquipment}
          onReset={resetFilters}
        />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "#ba1a1a" }}>Erreur lors du chargement des données</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Hero banner */}
              <div
                className="mx-6 mt-6 rounded-3xl p-8 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                  minHeight: "180px",
                }}
              >
                <div className="relative z-10 max-w-md">
                  <h1
                    className="text-3xl font-extrabold text-white mb-2 leading-tight"
                    style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-0.02em" }}
                  >
                    Find your space.
                  </h1>
                  <p className="text-sm text-white/75 mb-5">
                    Quickly book quiet study nooks or collaborative labs across campus.
                  </p>
                  <button
                    onClick={() => updateFilter("date", getTodayISO())}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:gap-3"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "white",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    Quick Find a Room Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Decorative circle */}
                <div
                  className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-10"
                  style={{ background: "white" }}
                />
                <div
                  className="absolute right-16 bottom-4 w-32 h-32 rounded-full opacity-10"
                  style={{ background: "white" }}
                />
              </div>

              {/* Bar: counter + view toggle */}
              <div className="flex items-start gap-4 px-6 mt-6">
                <FreeRoomCounter
                  rooms={rooms}
                  bookings={bookings}
                  date={currentDate}
                  time={currentTime}
                />
                <div className="flex-1" />
              </div>

              {/* Section header */}
              <div className="flex items-center justify-between px-6 mt-6 mb-3">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "Manrope, sans-serif", color: "var(--on-surface)" }}
                  >
                    Real-time Availability
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                    {rooms.length} space{rooms.length !== 1 ? "s" : ""} matching your criteria
                  </p>
                </div>
                <ViewToggle view={view} onViewChange={setView} />
              </div>

              {/* Content */}
              <div className="px-6 pb-8">
                {view === "grid" ? (
                  <WeekGrid
                    rooms={rooms}
                    bookings={bookings}
                    selectedDate={currentDate}
                    onWeekChange={handleWeekChange}
                  />
                ) : (
                  <RoomList rooms={rooms} bookings={bookings} date={currentDate} />
                )}

                {rooms.length === 0 && (
                  <div
                    className="text-center py-16 rounded-2xl"
                    style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
                  >
                    Aucune salle ne correspond aux filtres sélectionnés
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
