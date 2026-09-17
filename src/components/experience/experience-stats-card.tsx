export default function ExperienceStatsCard({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div className="grid min-h-128 place-content-center gap-5 rounded-2xl p-2 text-center shadow-sm transition-shadow duration-300">
      <strong className="text-4xl leading-none">
        {String(value).padStart(2, "0")}
      </strong>
      <h3 className="text-lg leading-tight">{label}</h3>
    </div>
  )
}
