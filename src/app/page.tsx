import { WordReport } from "@/components/report/word-report"
import report from "@/data/word-frequency.json"
import type { WordFrequencyReport } from "@/data/types"

export default function Home() {
  return <WordReport data={report as WordFrequencyReport} />
}
