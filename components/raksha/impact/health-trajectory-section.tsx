"use client"

import { useEffect, useRef, useState } from 'react'

export function HealthTrajectorySection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const animationProgress = useRef(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 40, right: 30, bottom: 50, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Data points (12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Hemoglobin levels (g/dL) - different scenarios
    const noCoordination = [6.2, 5.8, 7.1, 5.5, 6.8, 5.2, 7.4, 5.9, 6.1, 5.4, 7.0, 5.7]
    const manual = [7.5, 8.0, 7.2, 8.3, 7.8, 8.5, 7.9, 8.2, 8.0, 8.4, 7.7, 8.1]
    const rakshaAI = [8.5, 9.0, 9.2, 9.1, 9.3, 9.4, 9.2, 9.5, 9.3, 9.4, 9.5, 9.6]

    const minVal = 5
    const maxVal = 10

    const getY = (val: number) => {
      return padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight
    }

    const getX = (index: number) => {
      return padding.left + (index / (months.length - 1)) * chartWidth
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
      }

      // Y-axis labels
      ctx.fillStyle = '#6B7280'
      ctx.font = '12px JetBrains Mono, monospace'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 5; i++) {
        const val = maxVal - i
        const y = padding.top + (chartHeight / 5) * i
        ctx.fillText(`${val}`, padding.left - 10, y + 4)
      }

      // X-axis labels
      ctx.textAlign = 'center'
      months.forEach((month, i) => {
        const x = getX(i)
        ctx.fillText(month, x, height - padding.bottom + 20)
      })

      // Y-axis title
      ctx.save()
      ctx.translate(15, height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('Hemoglobin (g/dL)', 0, 0)
      ctx.restore()

      // Draw progress based on animation
      const progress = Math.min(animationProgress.current, 1)
      const pointsToDraw = Math.floor(months.length * progress)

      // Draw lines
      const drawLine = (data: number[], color: string, dashed: boolean = false) => {
        if (pointsToDraw < 2) return
        
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        if (dashed) {
          ctx.setLineDash([6, 4])
        } else {
          ctx.setLineDash([])
        }
        
        ctx.beginPath()
        for (let i = 0; i < pointsToDraw; i++) {
          const x = getX(i)
          const y = getY(data[i])
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()

        // Draw points
        ctx.setLineDash([])
        for (let i = 0; i < pointsToDraw; i++) {
          const x = getX(i)
          const y = getY(data[i])
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
        }
      }

      drawLine(noCoordination, '#C0152A', true)
      drawLine(manual, '#D4A847', false)
      drawLine(rakshaAI, '#2CA8A0', false)

      if (animationProgress.current < 1) {
        animationProgress.current += 0.02
        requestAnimationFrame(animate)
      }
    }

    animationProgress.current = 0
    animate()
  }, [isVisible])

  return (
    <section ref={containerRef} className="py-20 md:py-28 bg-[#0A1628] relative">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9B2335] font-sans mb-4 text-center">
          Health Outcomes
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#FAF9F7] text-center mb-6">
          The Raksha Difference
        </h2>
        <p className="font-sans text-[#6B7280] text-center mb-12 max-w-2xl mx-auto">
          Average hemoglobin levels over 12 months comparing patients with no coordination, 
          manual coordination, and Raksha AI-powered care.
        </p>

        {/* Chart Container */}
        <div className="bg-[#111827] rounded-2xl p-4 md:p-8">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '400px' }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-[#C0152A]" style={{ borderStyle: 'dashed', borderWidth: '1px 0 0 0', borderColor: '#C0152A' }} />
            <span className="font-sans text-sm text-[#6B7280]">No Coordination</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-[#D4A847]" />
            <span className="font-sans text-sm text-[#6B7280]">Manual Coordination</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-[#2CA8A0]" />
            <span className="font-sans text-sm text-[#6B7280]">Raksha AI</span>
          </div>
        </div>
      </div>
    </section>
  )
}
