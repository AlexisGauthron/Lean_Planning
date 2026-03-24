"use client";

import { CSVMetadata } from "@/lib/types";
import { formatUpdateDate } from "@/lib/date-utils";
import { Clock, Building2 } from "lucide-react";

interface HeaderProps {
  metadata: CSVMetadata | null;
  totalRooms: number;
}

export function Header({ metadata, totalRooms }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lean Planning</h1>
            <p className="text-sm text-gray-500">{totalRooms} salles repertoriees</p>
          </div>
        </div>

        {metadata && (
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Derniere MAJ :{" "}
              <span className="font-medium text-gray-900">
                {formatUpdateDate(new Date(metadata.updatedAt))}
              </span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
