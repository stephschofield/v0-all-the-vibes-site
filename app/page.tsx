import OSBackground from "@/components/os/OSBackground"
import IDEContainer from "@/components/ide/IDEContainer"

export default function Home() {
  console.log("[v0] Home page rendering")
  return (
    <OSBackground>
      <IDEContainer />
    </OSBackground>
  )
}
