"use client";

import { Link2, ShieldCheck, Heart } from "lucide-react";

interface Bridge {
  id: string;
  patient: string;
  bloodType: string;
  hospital: string;
  primaryDonor: string;
  backupDonor: string;
  reliability: string;
  status: "solid" | "vulnerable" | "broken";
}

const BRIDGES: Bridge[] = [
  { id: "BR-1", patient: "Arjun Sharma", bloodType: "B+", hospital: "KIMS Hospital", primaryDonor: "Ramesh R.", backupDonor: "Suresh K.", reliability: "97%", status: "solid" },
  { id: "BR-2", patient: "Ananya R.", bloodType: "B+", hospital: "KEM Hospital", primaryDonor: "Awaiting match", backupDonor: "Awaiting match", reliability: "0%", status: "broken" },
  { id: "BR-3", patient: "Karan M.", bloodType: "O-", hospital: "AIIMS Delhi", primaryDonor: "Vikram Shah", backupDonor: "Awaiting match", reliability: "64%", status: "vulnerable" },
  { id: "BR-4", patient: "Priya S.", bloodType: "A+", hospital: "Manipal Hospital", primaryDonor: "Rahul V.", backupDonor: "Priya Patel", reliability: "88%", status: "solid" },
];

interface BridgesPanelProps {
  bridges?: Bridge[];
}

export function BridgesPanel({ bridges }: BridgesPanelProps) {
  const displayBridges = bridges || BRIDGES;
  return (
    <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-raksha-white">Blood Bridges Management</h2>
        <p className="text-sm text-raksha-muted mt-1">Bridges pair chronic transfusion patients with recurring, antigen-compatible donors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayBridges.map((b) => (
          <div key={b.id} className="bg-raksha-deep/45 border border-raksha-wine/10 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-raksha-teal">{b.id}</span>
                <h3 className="font-semibold text-raksha-white mt-1">{b.patient} · <span className="text-raksha-blood font-mono font-bold text-xs">{b.bloodType}</span></h3>
                <p className="text-xs text-raksha-muted">{b.hospital}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                b.status === "solid" ? "bg-raksha-teal/10 text-raksha-teal" :
                b.status === "vulnerable" ? "bg-raksha-gold/10 text-raksha-gold" :
                "bg-raksha-blood/10 text-raksha-blood"
              }`}>
                {b.status}
              </span>
            </div>

            <div className="border-t border-raksha-wine/5 pt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-raksha-muted text-xs">Primary Donor:</span>
                <span className="text-raksha-white font-medium flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-raksha-teal" /> {b.primaryDonor}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-raksha-muted text-xs">Backup Standby:</span>
                <span className="text-raksha-white font-medium flex items-center gap-1">
                  <Heart className="w-4 h-4 text-raksha-blood" /> {b.backupDonor}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-raksha-wine/5 pt-2">
                <span className="text-raksha-muted text-xs">Bridge Reliability:</span>
                <span className={`font-bold ${
                  parseInt(b.reliability) >= 80 ? "text-raksha-teal" :
                  parseInt(b.reliability) >= 50 ? "text-raksha-gold" :
                  "text-raksha-blood"
                }`}>{b.reliability}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
