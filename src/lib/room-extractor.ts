import { Room } from "./types";

/**
 * Extrait les infos structurees depuis le nom brut d'une salle CSV.
 *
 * Exemples de formats:
 *   "Salle EM314 (Labo Elec / Info) - E1 (F) (40) (Meet-up)"
 *   "CD-4.01 N - Cœur défense (M) (36) (Clevertouch)"
 *   "Salle - A-303 (F) (42) (Meet-up)"
 *   "E5-S-2.05 (F) (49)"
 *   "G4-H18 (M) (40)"
 */
export function extractRoom(roomRaw: string, campus: string): Room {
  const id = extractRoomId(roomRaw);
  const capacity = extractCapacity(roomRaw);
  const floor = extractFloor(id);
  const equipment = extractEquipment(roomRaw);

  return {
    id,
    fullName: roomRaw,
    campus,
    floor,
    capacity,
    equipment,
  };
}

function extractRoomId(raw: string): string {
  // Pattern: "Salle EM314 ..." → EM314
  const salleMatch = raw.match(/Salle\s+([A-Z]{2}\d{3}[A-Za-z]?)/);
  if (salleMatch) return salleMatch[1];

  // Pattern: "Salle - A-303 ..." → A-303
  const salleLetterMatch = raw.match(/Salle\s*-\s*([A-Z]-\d{3})/);
  if (salleLetterMatch) return salleLetterMatch[1];

  // Pattern: "CD-4.01 N ..." → CD-4.01
  const cdMatch = raw.match(/(CD-[\d.]+)\s/);
  if (cdMatch) return cdMatch[1];

  // Pattern: "E5-S-2.05 ..." → E5-S-2.05
  const eMatch = raw.match(/(E\d-S-[\d.]+)/);
  if (eMatch) return eMatch[1];

  // Pattern: "G4-H18 ..." → G4-H18
  const gMatch = raw.match(/([A-Z]\d-[A-Z]\d+)/);
  if (gMatch) return gMatch[1];

  // Fallback: premiers mots significatifs
  return raw.split(/\s*[-(]/)[0].replace("Salle", "").trim() || raw.slice(0, 20);
}

function extractCapacity(raw: string): number {
  // Cherche un nombre entre parentheses qui ressemble a une capacite (20-200)
  const matches = raw.match(/\((\d+)\)/g);
  if (!matches) return 0;

  for (const m of matches) {
    const num = parseInt(m.replace(/[()]/g, ""));
    if (num >= 10 && num <= 500) return num;
  }
  return 0;
}

function extractFloor(roomId: string): number {
  // EM314 → etage 3, EM224 → etage 2, EM111 → etage 1
  const emMatch = roomId.match(/[A-Z]{2}(\d)/);
  if (emMatch) return parseInt(emMatch[1]);

  // A-303 → etage 3
  const letterMatch = roomId.match(/[A-Z]-(\d)/);
  if (letterMatch) return parseInt(letterMatch[1]);

  // CD-4.01 → etage 4
  const cdMatch = roomId.match(/CD-(\d)/);
  if (cdMatch) return parseInt(cdMatch[1]);

  // E5-S-2.05 → etage 2
  const eMatch = roomId.match(/E\d-S-(\d)/);
  if (eMatch) return parseInt(eMatch[1]);

  return 0;
}

function extractEquipment(raw: string): string[] {
  const equipment: string[] = [];

  // Types de labo
  if (/Labo\s+Elec\s*\/\s*Info/i.test(raw)) {
    equipment.push("Labo Elec/Info");
  } else if (/Labo\s+Elec/i.test(raw)) {
    equipment.push("Labo Elec");
  } else if (/Labo\s+Info/i.test(raw)) {
    equipment.push("Labo Info");
  } else if (/\(Labo\)/i.test(raw)) {
    equipment.push("Labo");
  }

  if (/Chariot\s+info/i.test(raw)) equipment.push("Chariot Info");

  // Equipement audiovisuel
  if (/Meet-up/i.test(raw)) equipment.push("Meet-up");
  if (/Jabra/i.test(raw)) equipment.push("Jabra");
  if (/Clevertouch/i.test(raw)) equipment.push("Clevertouch");

  return equipment;
}

/**
 * Deduplique les salles depuis une liste de (roomRaw, campus)
 */
export function deduplicateRooms(entries: { roomRaw: string; campus: string }[]): Room[] {
  const roomMap = new Map<string, Room>();

  for (const entry of entries) {
    const room = extractRoom(entry.roomRaw, entry.campus);
    if (!roomMap.has(room.id)) {
      roomMap.set(room.id, room);
    }
  }

  return Array.from(roomMap.values()).sort((a, b) => {
    if (a.campus !== b.campus) return a.campus.localeCompare(b.campus);
    return a.id.localeCompare(b.id);
  });
}
