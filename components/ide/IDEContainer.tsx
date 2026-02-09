"use client"

import { IDEProvider } from "./IDEContext"
import IDEWindow from "./IDEWindow"
import DesktopIcon from "@/components/os/DesktopIcon"

export default function IDEContainer() {
  return (
    <IDEProvider>
      <IDEWindow />
      <DesktopIcon />
    </IDEProvider>
  )
}
