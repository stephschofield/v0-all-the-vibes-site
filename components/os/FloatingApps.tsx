"use client"

import { FileText, Presentation, Table, Folder } from "lucide-react"

const apps = [
  { id: 1, icon: FileText, label: "Notes", color: "#4A9EFF", top: "15%", right: "8%" },
  { id: 2, icon: Presentation, label: "Slides", color: "#F472B6", top: "28%", right: "5%" },
  { id: 3, icon: Table, label: "Sheets", color: "#4ADE80", top: "42%", right: "10%" },
  { id: 4, icon: Folder, label: "Projects", color: "#FACC15", top: "58%", right: "6%" },
]

export default function FloatingApps() {
  return (
    <div className="hidden lg:block">
      {apps.map((app, index) => (
        <div
          key={app.id}
          className="absolute flex flex-col items-center gap-2"
          style={{
            top: app.top,
            right: app.right,
            animation: `floatBob 4s ease-in-out infinite`,
            animationDelay: `${index * 0.5}s`,
          }}
        >
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              backgroundColor: app.color,
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.12),
                0 2px 8px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              backdropFilter: 'blur(8px)',
            }}
          >
            <app.icon size={24} color="white" />
          </div>
          <span 
            className="text-[11px] font-medium"
            style={{
              fontFamily: 'var(--font-os)',
              color: 'rgba(40, 40, 50, 0.8)',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
            }}
          >
            {app.label}
          </span>
        </div>
      ))}
    </div>
  )
}
