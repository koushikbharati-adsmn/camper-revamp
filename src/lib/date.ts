import { formatDistanceToNow } from "date-fns"

export function formatRelativeDate(value: string | number) {
  const timestamp =
    typeof value === "number" && value < 1_000_000_000_000
      ? value * 1000
      : value
  const date = new Date(timestamp)

  return Number.isNaN(date.getTime())
    ? "date unavailable"
    : formatDistanceToNow(date, { addSuffix: true })
}
