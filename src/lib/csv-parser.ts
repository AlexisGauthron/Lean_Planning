import Papa from "papaparse";
import fs from "fs";
import path from "path";
import { Booking, Room, CSVMetadata, APIResponse } from "./types";
import { parseCSVFilename, frDateToISO, addHours } from "./date-utils";
import { extractRoom } from "./room-extractor";

// Colonnes par index (evite les problemes d'encodage des accents)
// 0: Nom enseignant, 1: Nom salle, 2: Promo, 3: Matiere,
// 4: Date debut, 5: Heure debut, 6: Duree, 7: Ecole,
// 8: Site campus, 9: Numero cours
const COL_ROOM = 1;
const COL_DATE = 4;
const COL_TIME = 5;
const COL_DURATION = 6;
const COL_CAMPUS = 8;

/**
 * Trouve le fichier CSV le plus recent dans public/data/
 */
export function findLatestCSV(): { filepath: string; filename: string } | null {
  const dataDir = path.join(process.cwd(), "public", "data");

  if (!fs.existsSync(dataDir)) return null;

  const csvFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv"))
    .sort()
    .reverse();

  if (csvFiles.length === 0) return null;

  return {
    filepath: path.join(dataDir, csvFiles[0]),
    filename: csvFiles[0],
  };
}

/**
 * Parse le CSV et retourne les donnees structurees
 */
export function parseCSVData(): APIResponse | null {
  const csvFile = findLatestCSV();
  if (!csvFile) return null;

  const fileContent = fs.readFileSync(csvFile.filepath, "utf-8");

  const parsed = Papa.parse<string[]>(fileContent, {
    header: false,
    delimiter: ";",
    skipEmptyLines: true,
  });

  if (parsed.data.length < 2) return null;

  // Skip header row
  const dataRows = parsed.data.slice(1);

  const roomMap = new Map<string, Room>();
  const bookings: Booking[] = [];

  for (const row of dataRows) {
    const roomRaw = row[COL_ROOM];
    const campus = row[COL_CAMPUS];
    const dateStr = row[COL_DATE];
    const timeStr = row[COL_TIME];
    const durationStr = row[COL_DURATION];

    if (!roomRaw || !dateStr || !timeStr || !durationStr) continue;

    // Extraire / dedup la salle
    const room = extractRoom(roomRaw, campus);
    if (!roomMap.has(room.id)) {
      roomMap.set(room.id, room);
    }

    // Creer le booking
    const startTime = timeStr.slice(0, 5); // "08:30:00" -> "08:30"
    const duration = parseInt(durationStr) || 1;
    const endTime = addHours(startTime, duration);

    bookings.push({
      roomId: room.id,
      date: frDateToISO(dateStr),
      startTime,
      endTime,
    });
  }

  const metadata: CSVMetadata = parseCSVFilename(csvFile.filename);

  return {
    rooms: Array.from(roomMap.values()).sort((a, b) => {
      if (a.campus !== b.campus) return a.campus.localeCompare(b.campus);
      return a.id.localeCompare(b.id);
    }),
    bookings,
    metadata,
  };
}
