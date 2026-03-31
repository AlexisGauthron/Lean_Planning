"use client";

import { useState, useCallback } from "react";

export interface FilterState {
  campus: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  minCapacity: string;
  equipment: string[];
  search: string;
  slotDuration: string; // "1" | "2"
}

const initialFilters: FilterState = {
  campus: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  minCapacity: "",
  equipment: [],
  search: "",
  slotDuration: "1",
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const toggleEquipment = useCallback((eq: string) => {
    setFilters((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter((e) => e !== eq)
        : [...prev.equipment, eq],
    }));
  }, []);

  const apiParams: Record<string, string | undefined> = {
    campus: filters.campus || undefined,
    date: filters.date || undefined,
    minCapacity: filters.minCapacity || undefined,
    equipment: filters.equipment.length > 0 ? filters.equipment.join(",") : undefined,
    search: filters.search || undefined,
  };

  return { filters, updateFilter, resetFilters, toggleEquipment, apiParams };
}
