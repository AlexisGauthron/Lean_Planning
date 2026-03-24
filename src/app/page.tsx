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
import { Loader2 } from "lucide-react";

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
  const [view, setView] = useState<"grid" | "list">("grid");

  const currentDate = filters.date || getTodayISO();
  const currentTime = getCurrentTime();

  const handleWeekChange = (mondayISO: string) => {
    updateFilter("date", mondayISO);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header metadata={metadata} totalRooms={totalRooms} />

      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar
          filters={filters}
          allCampuses={allCampuses}
          allEquipment={allEquipment}
          onUpdateFilter={updateFilter}
          onToggleEquipment={toggleEquipment}
          onReset={resetFilters}
        />

        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Erreur lors du chargement des donnees</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Barre du haut */}
              <div className="flex items-center justify-between">
                <FreeRoomCounter
                  rooms={rooms}
                  bookings={bookings}
                  date={currentDate}
                  time={currentTime}
                />
                <ViewToggle view={view} onViewChange={setView} />
              </div>

              {/* Contenu principal */}
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

              {/* Info */}
              {rooms.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  Aucune salle ne correspond aux filtres selectionnes
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
