"use client"

import { IDEProvider } from "./IDEContext"
import IDEWindow from "./IDEWindow"
import DesktopIcon from "@/components/os/DesktopIcon"

export default function IDEContainer() {
  console.log("[v0] IDEContainer rendering")
  return (
    <IDEProvider>
      <IDEWindow />
      <DesktopIcon />
    </IDEProvider>
  )
}
