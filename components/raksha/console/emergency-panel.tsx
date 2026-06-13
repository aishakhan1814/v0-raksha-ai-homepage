"use client";

import { CheckCircle, MapPin, Calendar } from "lucide-react";

interface EligibleDonor {
  name: string;
  bloodType: string;
  city: string;
  readiness: string;
  daysReady: number;
}

const ELIGIBLE_DONORS: EligibleDonor[] = [
  { name: "Ramesh R.", bloodType: "O+", city: "Hyderabad", readiness: "100%", daysReady: 180 },
  { name: "Suresh K.", bloodType: "B+", city: "Hyderabad", readiness: "95%", daysReady: 92 },
  { name: "Priya Patel", bloodType: "AB+", city: "Mumbai", readiness: "100%", daysReady: 180 },
  { name: "Vikram Shah", bloodType: "O-", city: "Ahmedabad", readiness: "100%", daysReady: 180 },
];

interface EmergencyPanelProps {
  eligibleDonors?: EligibleDonor[];
}

export function EmergencyPanel({ eligibleDonors }: EmergencyPanelProps) {
  const displayEligible = eligibleDonors || ELIGIBLE_DONORS;

  return (
    <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-raksha-white">Eligible Donors Directory</h2>
        <p className="text-sm text-raksha-muted mt-1">Donors who are currently eligible (exceeded the 90-day donation interval) and ready for matching.</p>
      </div>

      <div className="space-y-4">
        {displayEligible.map((d) => (
          <div key={d.name} className="flex flex-wrap items-center justify-between p-4 bg-raksha-deep/55 border border-raksha-wine/10 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-raksha-teal/10 flex items-center justify-center text-raksha-teal font-bold font-mono">
                {d.bloodType}
              </div>
              <div>
                <h3 className="font-semibold text-raksha-white text-base">{d.name}</h3>
                <div className="flex gap-4 text-xs text-raksha-muted mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {d.city}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Ready for {d.daysReady} days</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-raksha-teal font-mono font-bold text-lg">{d.readiness} Ready</span>
              <span className="flex items-center gap-1 justify-end text-[0.65rem] text-raksha-teal uppercase mt-1 font-semibold">
                <CheckCircle className="w-3 h-3" /> Auto-validated
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
