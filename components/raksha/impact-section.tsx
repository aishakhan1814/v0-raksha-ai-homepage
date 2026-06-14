'use client'

import { useEffect, useState } from 'react'
import { FadeIn } from './fade-in'
import { Counter } from './counter'
import { rawCSV } from '@/lib/dataset'
import { useLanguage } from '@/context/LanguageContext'

interface Stats {
  livesProtected: number
  activeDonors: number
  matchSuccessRate: number
  avgResponseTime: number
}

/* ─────────────────────────────────────────
   LIGHTWEIGHT LIVE PARSER FOR HOMEPAGE
   ───────────────────────────────────────── */
function parseAndComputeStats(csvText: string) {
  if (!csvText || !csvText.trim()) return null;
  
  const lines = csvText.split('\n');
  if (lines.length <= 1) return null;
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const activeDonorsIdx = headers.indexOf('user_donation_active_status');
  const donationsIdx = headers.indexOf('donations_till_date');
  const roleIdx = headers.indexOf('role');
  const userIdIdx = headers.indexOf('user_id');

  let activeDonorsCount = 0;
  let totalDonationsCount = 0;
  const uniqueDonorsSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/^["']|["']$/g, ''));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/^["']|["']$/g, ''));

    // Compute active donors
    if (activeDonorsIdx !== -1 && fields[activeDonorsIdx] === 'Active') {
      activeDonorsCount++;
    }
    // Compute total donations
    if (donationsIdx !== -1) {
      totalDonationsCount += parseInt(fields[donationsIdx]) || 0;
    }
    // Compute unique donors
    if (roleIdx !== -1 && ['Emergency Donor', 'Bridge Donor', 'Volunteer'].includes(fields[roleIdx])) {
      if (userIdIdx !== -1 && fields[userIdIdx]) {
        uniqueDonorsSet.add(fields[userIdIdx]);
      }
    }
  }

  const livesProtected = totalDonationsCount || uniqueDonorsSet.size || 12500;
  const activeDonors = activeDonorsCount || 8200;

  return {
    livesProtected,
    activeDonors,
    matchSuccessRate: 98,
    avgResponseTime: 38
  };
}

export function ImpactSection() {
  const { t } = useLanguage()
  const [liveStats, setLiveStats] = useState({
    livesProtected: 12500,
    activeDonors: 8200
  })

  useEffect(() => {
    const localStats = parseAndComputeStats(rawCSV);

    Promise.all([
      fetch('/api/stats/donors').then(r => r.ok ? r.json() : { success: false }),
      fetch('/api/stats/requests').then(r => r.ok ? r.json() : { success: false })
    ])
      .then(([donorsData, requestsData]) => {
        const activeDonors = donorsData.success ? donorsData.count : (localStats?.activeDonors || 8200);
        const livesProtected = requestsData.success ? (requestsData.count + (localStats?.livesProtected || 12500)) : (localStats?.livesProtected || 12500);
        
        setLiveStats({
          livesProtected,
          activeDonors
        });
      })
      .catch((err) => {
        console.warn("Homepage API stats fetch failed:", err);
        if (localStats) {
          setLiveStats({
            livesProtected: localStats.livesProtected,
            activeDonors: localStats.activeDonors
          });
        }
      });
  }, [])

  const stats = [
    { value: liveStats.livesProtected,   suffix: '+',    label: t('Lives Protected') },
    { value: liveStats.activeDonors,     suffix: '+',    label: t('Active Donors') },
    { value: 98,                         suffix: '%',    label: t('Match Success Rate') },
    { value: 45,                         suffix: ` ${t('min')}`, label: t('Avg Response Time') },
  ];

  return (
    <section id="impact" className="relative py-24 lg:py-32 bg-[#8B0000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-raksha-white/60 text-xs uppercase tracking-[0.15em] font-medium mb-4 text-center">
            {t('impact.label')}
          </p>
        </FadeIn>
        <FadeIn delay={50}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-raksha-white text-center mb-16 text-balance">
            {t('Numbers that represent hope')}
          </h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 100}>
              <div className="text-center">
                <p className="font-display text-5xl sm:text-6xl lg:text-[80px] text-raksha-white mb-2">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
