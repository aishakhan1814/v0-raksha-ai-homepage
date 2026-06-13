'use client'

import { FadeIn } from './fade-in'
import { Clock, ShieldAlert, Zap, ArrowRight, PhoneCall, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'

export function NorthStarMetricSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-br from-[#0B1528] via-[#0D1C33] to-[#070F1E] overflow-hidden grain-overlay">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-raksha-blood/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-raksha-teal/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-24">
          <FadeIn>
            <p className="text-raksha-crimson text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold mb-4">
              The North Star Metric
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-raksha-white mb-6 text-balance max-w-3xl mx-auto leading-tight">
              Compressing the <em className="italic text-raksha-warm">Critical Hour</em>
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg text-raksha-muted max-w-xl mx-auto leading-relaxed">
              When hemoglobin crashes, every second counts. Here is how Raksha AI replaces chaotic human logistics with automated precision.
            </p>
          </FadeIn>
        </div>

        {/* Compression Display */}
        <div className="grid lg:grid-cols-12 gap-8 items-center mb-20">
          
          {/* Left: The Manual Process (4.2 hours) */}
          <div className="lg:col-span-5">
            <FadeIn delay={100}>
              <div className="bg-[#111827]/60 border border-raksha-wine/30 rounded-2xl p-8 hover:border-raksha-wine/50 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-raksha-blood/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-raksha-muted">The Traditional Way</span>
                  <div className="p-2 bg-raksha-blood/10 rounded-lg text-raksha-blood">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-raksha-muted mb-2">Manual Coordination</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl lg:text-6xl text-raksha-muted line-through font-semibold">4.2</span>
                    <span className="text-xl text-raksha-muted font-medium">hours</span>
                  </div>
                </div>

                {/* Timeline flow */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-raksha-muted/40" />
                      <div className="w-px h-10 bg-raksha-muted/20" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-raksha-muted/80">WhatsApp Blasts (~90 mins)</p>
                      <p className="text-sm text-raksha-muted/60">Anxious families broadcast requests to spammy groups hoping for replies.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-raksha-muted/40" />
                      <div className="w-px h-10 bg-raksha-muted/20" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-raksha-muted/80">Calling Inactive Lists (~120 mins)</p>
                      <p className="text-sm text-raksha-muted/60">Dialing outdated contacts, experiencing dropouts, and facing mismatch risks.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-raksha-muted/40" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-raksha-muted/80">Hospital / Transport Delay (~42 mins)</p>
                      <p className="text-sm text-raksha-muted/60">Manual confirmation, check-in delays, and coordination gaps at the bedside.</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Middle: Compression Arrow */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-4">
            <FadeIn delay={200}>
              <div className="hidden lg:flex flex-col items-center gap-3">
                <span className="text-[10px] font-mono tracking-widest text-raksha-crimson uppercase font-bold">Raksha Engine</span>
                <div className="w-12 h-12 rounded-full border border-raksha-wine flex items-center justify-center bg-raksha-blood/10 shadow-[0_0_20px_rgba(139,26,42,0.3)]">
                  <Zap className="w-6 h-6 text-raksha-warm animate-bounce" />
                </div>
                <ArrowRight className="w-6 h-6 text-raksha-crimson animate-pulse" />
                <span className="text-xs font-mono text-raksha-teal font-semibold">85% Faster</span>
              </div>
              
              {/* Mobile version */}
              <div className="lg:hidden flex items-center gap-4 py-2">
                <div className="w-10 h-10 rounded-full border border-raksha-wine flex items-center justify-center bg-raksha-blood/10">
                  <Zap className="w-5 h-5 text-raksha-warm" />
                </div>
                <span className="text-xs font-mono text-raksha-teal font-bold uppercase tracking-wider">Raksha AI compression: 85% time saved</span>
              </div>
            </FadeIn>
          </div>

          {/* Right: Raksha AI Process (38 minutes) */}
          <div className="lg:col-span-5">
            <FadeIn delay={300}>
              <div className="bg-[#111827]/90 border border-raksha-teal/40 rounded-2xl p-8 hover:border-raksha-teal transition-all duration-300 relative group overflow-hidden shadow-[0_0_30px_rgba(44,168,160,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-raksha-teal/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-raksha-teal font-semibold">The Raksha standard</span>
                  <div className="p-2 bg-raksha-teal/10 rounded-lg text-raksha-teal shadow-[0_0_10px_rgba(44,168,160,0.2)]">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-raksha-white mb-2">AI-Orchestrated Match</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl lg:text-6xl text-raksha-teal font-bold tracking-tight drop-shadow-[0_0_15px_rgba(44,168,160,0.4)]">38</span>
                    <span className="text-xl text-raksha-white font-medium">minutes</span>
                  </div>
                </div>

                {/* Timeline flow */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-raksha-teal" />
                      <div className="w-px h-10 bg-raksha-teal/30" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-raksha-white">AI Compatibility Match (&lt;1 sec)</p>
                      <p className="text-sm text-raksha-muted">Instant screening based on ABO/Rh history, location, and alloimmunization risk.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-raksha-teal" />
                      <div className="w-px h-10 bg-raksha-teal/30" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-raksha-white">Automated Outreach & Confirm (~2 mins)</p>
                      <p className="text-sm text-raksha-muted">Smart agents trigger multi-channel alerts (WhatsApp/SMS), securing immediate confirmations.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-raksha-teal" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-raksha-white">Pre-Coordinated Delivery (~36 mins)</p>
                      <p className="text-sm text-raksha-muted">Donor routes are tracked in real-time, and hospital check-in is pre-authorized.</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>

        {/* Large Statement Card */}
        <FadeIn delay={400}>
          <div className="bg-gradient-to-r from-raksha-blood/20 to-raksha-wine/30 border border-raksha-wine/40 p-8 sm:p-12 text-center rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-raksha-deep/30 backdrop-blur-sm pointer-events-none -z-10" />
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 bg-raksha-blood/30 border border-raksha-blood text-raksha-warm text-xs font-mono uppercase tracking-widest rounded-full mb-6">
                Active Commitment
              </span>
              <p className="font-display text-2xl sm:text-3xl md:text-4xl text-raksha-warm leading-snug italic mb-6">
                &ldquo;Raksha AI reduces average donor-to-bedside time from 4.2 hours to under 45 minutes at scale.&rdquo;
              </p>
              <div className="w-24 h-px bg-raksha-crimson mx-auto my-6" />
              <p className="text-xs sm:text-sm text-raksha-muted font-mono tracking-wider uppercase">
                Ensuring a predictable supply cycle for all registered Thalassemia warriors.
              </p>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  )
}
