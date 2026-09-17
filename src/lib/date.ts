import { formatDistanceToNow } from "date-fns"

export function formatRelativeDate(value: string) {
  const date = new Date(value.replace(/Z$/, "+05:30"))

  return formatDistanceToNow(date, {
    addSuffix: true,
  })
}
