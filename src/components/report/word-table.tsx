"use client"

import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatExact, formatPercent } from "@/lib/format"

type Row = {
  word: string
  count: number
  extra?: string
}

export function WordTable({
  rows,
  total,
  label = "Word",
  extraHeader,
}: {
  rows: Row[]
  total: number
  label?: string
  extraHeader?: string
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (row) =>
        row.word.toLowerCase().includes(q) ||
        (row.extra ?? "").toLowerCase().includes(q)
    )
  }, [query, rows])

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Filter ${label.toLowerCase()}s…`}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>{label}</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Share</TableHead>
            {extraHeader ? <TableHead className="text-right">{extraHeader}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={extraHeader ? 5 : 4} className="py-8 text-center text-muted-foreground">
                No {label.toLowerCase()}s match “{query}”.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row, i) => (
              <TableRow key={`${row.word}-${i}`}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-mono text-[13px]">{row.word}</TableCell>
                <TableCell className="text-right tabular-nums">{formatExact(row.count)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatPercent(total ? row.count / total : 0, 2)}
                </TableCell>
                {extraHeader ? (
                  <TableCell className="text-right tabular-nums">{row.extra}</TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
