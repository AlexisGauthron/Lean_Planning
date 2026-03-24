"use client";

import useSWR from "swr";
import { Room, Booking, CSVMetadata } from "@/lib/types";

interface RoomsResponse {
  rooms: Room[];
  bookings: Booking[];
  metadata: CSVMetadata;
  totalRooms: number;
  allCampuses: string[];
  allEquipment: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRooms(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  const url = `/api/rooms${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading } = useSWR<RoomsResponse>(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
  });

  return {
    rooms: data?.rooms ?? [],
    bookings: data?.bookings ?? [],
    metadata: data?.metadata ?? null,
    totalRooms: data?.totalRooms ?? 0,
    allCampuses: data?.allCampuses ?? [],
    allEquipment: data?.allEquipment ?? [],
    isLoading,
    error,
  };
}
