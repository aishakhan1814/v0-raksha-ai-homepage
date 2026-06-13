"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Phone, Mail } from "lucide-react";

interface Donor {
  id: string;
  name: string;
  bloodType: string;
  city: string;
  phone: string;
  email: string;
  lastDonation: string;
  status: "eligible" | "deferred";
}

interface DonorTableProps {
  donors?: Donor[];
}

export function DonorTable({ donors }: DonorTableProps) {
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dbDonors, setDbDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    
    const fetchDonors = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search.trim()) queryParams.set("search", search.trim());
        if (bloodFilter) queryParams.set("bloodType", bloodFilter);
        if (statusFilter) queryParams.set("status", statusFilter);

        const res = await fetch(`/api/console/donors?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && active) {
          setDbDonors(data.donors);
        }
      } catch (err) {
        console.error("Error loading donors in table:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    // Debounce the search typing
    const delayDebounceFn = setTimeout(() => {
      fetchDonors();
    }, search.trim() ? 350 : 0); // No delay for select option changes

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [search, bloodFilter, statusFilter]);

  return (
    <div className="bg-raksha-navy/20 border border-raksha-wine/20 rounded-xl p-6 space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-raksha-muted" />
          <input
            type="text"
            placeholder="Search donors by name, city, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-raksha-deep/60 border border-raksha-wine/30 rounded-none text-raksha-white text-sm focus:outline-none focus:border-raksha-teal"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="bg-raksha-deep/60 border border-raksha-wine/30 rounded-none text-raksha-white text-xs px-3 py-2 cursor-pointer focus:outline-none focus:border-raksha-teal"
          >
            <option value="">All Blood Types</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-raksha-deep/60 border border-raksha-wine/30 rounded-none text-raksha-white text-xs px-3 py-2 cursor-pointer focus:outline-none focus:border-raksha-teal"
          >
            <option value="">All Statuses</option>
            <option value="eligible">Eligible</option>
            <option value="deferred">Deferred</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-raksha-deep/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="w-6 h-6 border-2 border-raksha-wine/30 border-t-raksha-teal rounded-full animate-spin" style={{ borderTopColor: "#2CA8A0" }} />
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-raksha-wine/20 text-raksha-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 pr-4">Donor Name</th>
              <th className="text-left py-3 pr-4">Blood Group</th>
              <th className="text-left py-3 pr-4">Location</th>
              <th className="text-left py-3 pr-4">Contact Info</th>
              <th className="text-left py-3 pr-4">Last Donation</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {dbDonors.map((d) => (
              <tr key={d.id} className="border-b border-raksha-wine/10 hover:bg-raksha-white/5 transition-colors">
                <td className="py-3.5 pr-4 font-semibold text-raksha-white">{d.name}</td>
                <td className="py-3.5 pr-4 text-raksha-blood font-mono font-bold">{d.bloodType}</td>
                <td className="py-3.5 pr-4 text-raksha-muted">{d.city}</td>
                <td className="py-3.5 pr-4">
                  <div className="flex flex-col gap-1 text-xs text-raksha-muted">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {d.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {d.email}</span>
                  </div>
                </td>
                <td className="py-3.5 pr-4 text-raksha-muted">{d.lastDonation}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wider ${
                    d.status === "eligible" ? "bg-raksha-teal/10 text-raksha-teal" : "bg-raksha-blood/10 text-raksha-blood"
                  }`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
            {dbDonors.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-raksha-muted">No donors found matching the criteria in MongoDB.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
