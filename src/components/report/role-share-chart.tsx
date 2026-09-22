"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCount, formatPercent, titleRole } from "@/lib/format"
import type { RoleShare } from "@/data/types"

const chartConfig = {
  words: {
    label: "Words",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function RoleShareChart({ data }: { data: RoleShare[] }) {
  const rows = data.map((d) => ({
    ...d,
    role: titleRole(d.role),
  }))

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
      <BarChart data={rows} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="role" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCount(Number(v))}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const share = (item?.payload as RoleShare | undefined)?.share
                return `${formatCount(Number(value))}${share != null ? ` (${formatPercent(share)})` : ""}`
              }}
            />
          }
        />
        <Bar dataKey="words" fill="var(--color-words)" radius={6} />
      </BarChart>
    </ChartContainer>
  )
}
