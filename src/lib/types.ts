export interface RawBooking {
  roomRaw: string;
  date: string;       // "02/09/2024"
  startTime: string;  // "08:30:00"
  duration: number;   // en heures
  campus: string;     // "Eiffel 1"
}

export interface Room {
  id: string;           // "EM314"
  fullName: string;     // nom complet CSV
  campus: string;       // "Eiffel 1"
  floor: number;        // 3
  capacity: number;     // 40
  equipment: string[];  // ["Labo Elec", "Meet-up"]
}

export interface Booking {
  roomId: string;
  date: string;         // "2024-09-02" (ISO)
  startTime: string;    // "08:30"
  endTime: string;      // "10:30"
}

export interface FreeSlot {
  start: string; // "08:30"
  end: string;   // "10:45"
}

export interface RoomAvailability {
  room: Room;
  date: string;
  freeSlots: FreeSlot[];
  busySlots: { start: string; end: string }[];
}

export interface Filters {
  campus?: string;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  minCapacity?: number;
  equipment?: string[];
  search?: string;
}

export interface CSVMetadata {
  filename: string;
  updatedAt: Date;
}

/** Réservation partagée : tracke l'occupation des places par créneau */
export interface SharedBooking {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  type: "full" | "partial"; // full = salle entière (asso/prof), partial = N places (étudiant)
  seats: number;             // pour partial : places réservées ; pour full : capacité totale
  userName: string;
  userId?: string;
  status?: "pending" | "approved" | "rejected";
}

export interface AdminConfig {
  studentMaxDays: number;        // jours à l'avance max pour un élève
  assoMaxDays: number;           // jours à l'avance max pour une asso
  profMaxDays: number;           // jours à l'avance max pour un prof
  studentMaxSeats: number;       // places max par réservation pour un élève
  studentMaxRoomsPerDay: number; // salles max par jour pour un élève
}

export interface APIResponse {
  rooms: Room[];
  bookings: Booking[];
  metadata: CSVMetadata;
}
