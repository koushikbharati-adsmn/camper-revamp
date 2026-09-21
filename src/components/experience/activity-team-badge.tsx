import { cn } from "@/lib/utils"

// Text sits on the team color, so pick dark or white from the color's
// brightness: dark on light colors (e.g. #D9FF00), white on dark ones.
// export function getReadableTextColor(hex: string) {
//   const value = hex.replace("#", "")
//   const full =
//     value.length === 3
//       ? value
//           .split("")
//           .map((char) => char + char)
//           .join("")
//       : value

//   if (!/^[0-9a-f]{6}$/i.test(full)) return "#111111"

//   const [red, green, blue] = [0, 2, 4].map((start) =>
//     parseInt(full.slice(start, start + 2), 16)
//   )

//   // Perceived brightness (0-255)
//   return (red * 299 + green * 587 + blue * 114) / 1000 > 150
//     ? "#111111"
//     : "#ffffff"
// }

export function ActivityTeamBadge({
  teamName,
  teamColorCode,
  textColor,
  className,
}: {
  teamName: string
  teamColorCode?: string | null
  // Pass the ticker text color where the badge isn't inside the ticker.
  textColor?: string
  className?: string
}) {
  return (
    <span
      className={cn("rounded px-2 py-0.5 text-xs font-bold", className)}
      style={
        teamColorCode
          ? {
              backgroundColor: teamColorCode,
              color: textColor,
            }
          : undefined
      }
    >
      {teamName}
    </span>
  )
}
