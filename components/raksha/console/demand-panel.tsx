"use client";

import { TrendingUp, AlertTriangle } from "lucide-react";

interface CityDemand {
  city: string;
  requests: number;
  donors: number;
  status: "Surplus" | "Balanced" | "Critical";
  ratio: number;
}

const CITIES_DEMAND: CityDemand[] = [
  { city: "Mumbai", requests: 12, donors: 84, status: "Balanced", ratio: 85 },
  { city: "Delhi", requests: 18, donors: 42, status: "Critical", ratio: 38 },
  { city: "Hyderabad", requests: 6, donors: 114, status: "Surplus", ratio: 95 },
  { city: "Bengaluru", requests: 9, donors: 56, status: "Balanced", ratio: 72 },
  { city: "Chennai", requests: 4, donors: 32, status: "Balanced", ratio: 80 },
];

interface DemandPanelProps {
  demandCities?: CityDemand[];
}

export function DemandPanel({ demandCities }: DemandPanelProps) {
  const displayDemand = demandCities || CITIES_DEMAND;

  return (
    <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-raksha-white">Demand Map & Supply Balance</h2>
        <p className="text-sm text-raksha-muted mt-1">Geographic distribution of blood requests versus registered active donor matching pools.</p>
      </div>

      <div className="space-y-4">
        {displayDemand.map((c) => (
          <div key={c.city} className="p-4 bg-raksha-deep/55 border border-raksha-wine/10 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-raksha-white">{c.city}</span>
                {c.status === "Critical" && <AlertTriangle className="w-4 h-4 text-raksha-blood" />}
              </div>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                c.status === "Critical" ? "bg-raksha-blood/10 text-raksha-blood" :
                c.status === "Surplus" ? "bg-raksha-teal/10 text-raksha-teal" :
                "bg-raksha-gold/10 text-raksha-gold"
              }`}>{c.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-raksha-muted">
              <div>Active requests: <span className="text-raksha-white font-semibold">{c.requests}</span></div>
              <div>Registered donors: <span className="text-raksha-white font-semibold">{c.donors}</span></div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-raksha-muted">
                <span>Supply Index:</span>
                <span className="font-semibold text-raksha-white">{c.ratio}%</span>
              </div>
              <div className="h-2 bg-raksha-deep rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${c.status === "Critical" ? "bg-raksha-blood" : "bg-raksha-teal"}`}
                  style={{ width: `${c.ratio}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
