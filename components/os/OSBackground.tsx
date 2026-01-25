"use client"

import { ReactNode } from "react"

interface OSBackgroundProps {
  children: ReactNode
}

export default function OSBackground({ children }: OSBackgroundProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
      {/* Animated gradient mesh */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, var(--gradient-start) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, var(--gradient-mid) 0%, transparent 45%),
            radial-gradient(ellipse at 40% 80%, var(--gradient-accent) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 90%, var(--gradient-end) 0%, transparent 40%),
            linear-gradient(135deg, #e2d1e6 0%, #c5dce8 50%, #ddd5eb 100%)
          `,
          animation: 'gradientShift 20s ease-in-out infinite',
        }}
      />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* IDE Container */}
      {children}
    </div>
  )
}
