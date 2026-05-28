'use client'

import { useEffect, useRef, useState } from 'react'

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export function Counter({ end, suffix = '', prefix = '', duration = 2000, className = '' }: CounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(end * easeOut))
      
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [isVisible, end, duration])

  const formatNumber = (num: number) => {
    if (num >= 100000) {
      return `${Math.floor(num / 100000)},${String(Math.floor((num % 100000) / 1000)).padStart(2, '0')},${String(num % 1000).padStart(3, '0')}`
    }
    return num.toLocaleString('en-IN')
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  )
}
