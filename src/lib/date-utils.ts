import { CSVMetadata } from "./types";

/**
 * Parse le nom de fichier CSV au format DDMMYYYY_HHMM
 * Ex: "04022026_1000" → Date(2026, 1, 4, 10, 0)
 */
export function parseCSVFilename(filename: string): CSVMetadata {
  const match = filename.match(/(\d{2})(\d{2})(\d{4})_(\d{2})(\d{2})/);
  if (!match) {
    return { filename, updatedAt: new Date() };
  }

  const [, day, month, year, hours, minutes] = match;
  const updatedAt = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );

  return { filename, updatedAt };
}

/**
 * Convertit une date FR "02/09/2024" en ISO "2024-09-02"
 */
export function frDateToISO(frDate: string): string {
  const [day, month, year] = frDate.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * Ajoute des heures a un horaire "HH:MM" et retourne "HH:MM"
 */
export function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Formate une Date en texte lisible FR
 */
export function formatUpdateDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} a ${hours}h${minutes}`;
}

/**
 * Retourne le lundi de la semaine pour une date donnee
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retourne les 5 jours de la semaine (lun-ven) en ISO
 */
export function getWeekDays(monday: Date): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
}

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function getDayName(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return DAY_NAMES[date.getDay()];
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/**
 * Formate une Date locale en "YYYY-MM-DD" sans conversion UTC
 */
export function toLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
