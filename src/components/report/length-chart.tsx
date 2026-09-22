"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCount } from "@/lib/format"
import type { LengthBucket } from "@/data/types"

const chartConfig = {
  count: {
    label: "Words",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function LengthChart({ data }: { data: LengthBucket[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
      <BarChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="length" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCount(Number(v))}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => formatCount(Number(value))} />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
