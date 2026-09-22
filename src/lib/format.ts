export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("en-US")
}

export function formatExact(n: number): string {
  return n.toLocaleString("en-US")
}

export function formatPercent(share: number, digits = 1): string {
  return `${(share * 100).toFixed(digits)}%`
}

export function titleRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}
