import { NextRequest, NextResponse } from "next/server";
import { parseCSVData } from "@/lib/csv-parser";
import { Filters, Room, Booking } from "@/lib/types";

let cachedData: ReturnType<typeof parseCSVData> = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

function getData() {
  const now = Date.now();
  if (!cachedData || now - cacheTime > CACHE_TTL) {
    cachedData = parseCSVData();
    cacheTime = now;
  }
  return cachedData;
}

function applyFilters(
  rooms: Room[],
  bookings: Booking[],
  filters: Filters
): { rooms: Room[]; bookings: Booking[] } {
  let filteredRooms = [...rooms];

  if (filters.campus) {
    filteredRooms = filteredRooms.filter((r) => r.campus === filters.campus);
  }

  if (filters.minCapacity) {
    filteredRooms = filteredRooms.filter((r) => r.capacity >= filters.minCapacity!);
  }

  if (filters.equipment && filters.equipment.length > 0) {
    filteredRooms = filteredRooms.filter((r) =>
      filters.equipment!.every((eq) => r.equipment.includes(eq))
    );
  }

  if (filters.search) {
    const s = filters.search.toLowerCase();
    filteredRooms = filteredRooms.filter(
      (r) =>
        r.id.toLowerCase().includes(s) ||
        r.fullName.toLowerCase().includes(s) ||
        r.campus.toLowerCase().includes(s)
    );
  }

  const roomIds = new Set(filteredRooms.map((r) => r.id));
  let filteredBookings = bookings.filter((b) => roomIds.has(b.roomId));

  if (filters.date) {
    filteredBookings = filteredBookings.filter((b) => b.date === filters.date);
  }

  return { rooms: filteredRooms, bookings: filteredBookings };
}

export async function GET(request: NextRequest) {
  const data = getData();
  if (!data) {
    return NextResponse.json({ error: "No CSV data found" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const filters: Filters = {
    campus: params.get("campus") || undefined,
    date: params.get("date") || undefined,
    minCapacity: params.get("minCapacity") ? parseInt(params.get("minCapacity")!) : undefined,
    equipment: params.get("equipment") ? params.get("equipment")!.split(",") : undefined,
    search: params.get("search") || undefined,
  };

  const { rooms, bookings } = applyFilters(data.rooms, data.bookings, filters);

  return NextResponse.json({
    rooms,
    bookings,
    metadata: data.metadata,
    totalRooms: data.rooms.length,
    allCampuses: [...new Set(data.rooms.map((r) => r.campus))].sort(),
    allEquipment: [...new Set(data.rooms.flatMap((r) => r.equipment))].sort(),
  });
}
