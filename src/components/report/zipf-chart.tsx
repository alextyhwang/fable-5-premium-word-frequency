"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCount } from "@/lib/format"
import type { ZipfPoint } from "@/data/types"

const chartConfig = {
  count: {
    label: "Frequency",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function ZipfChart({ data }: { data: ZipfPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-80 w-full aspect-auto">
      <LineChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="rank"
          tickLine={false}
          axisLine={false}
          label={{ value: "Rank", position: "insideBottom", offset: -4 }}
        />
        <YAxis
          scale="log"
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCount(Number(v))}
          width={56}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as ZipfPoint | undefined
                return point ? `#${point.rank}  ${point.word}` : ""
              }}
              formatter={(value) => formatCount(Number(value))}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
