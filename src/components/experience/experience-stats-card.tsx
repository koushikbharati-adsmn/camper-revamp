export function ExperienceStatsCard({
  value,
  label,
  backgroundColor,
  color,
}: {
  value: number
  label: string
  backgroundColor: string
  color: string
}) {
  return (
    <div
      className="grid min-h-40 place-content-center gap-5 rounded-2xl p-2 text-center shadow-sm transition-shadow duration-300"
      style={{ backgroundColor, color }}
    >
      <strong className="text-4xl leading-none">
        {String(value).padStart(2, "0")}
      </strong>
      <h3 className="text-lg leading-tight">{label}</h3>
    </div>
  )
}
