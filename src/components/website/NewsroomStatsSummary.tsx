type NewsroomStatsSummaryProps = {
  metrics: string[]
  values: number[]
}

export default function NewsroomStatsSummary({
  metrics,
  values,
}: NewsroomStatsSummaryProps) {
  return (
    <div
      className="grid grid-cols-2 gap-5 lg:grid-cols-4"
      aria-label="Workshop summary"
    >
      {metrics.map((metric, index) => (
        <div
          className="bg-theme1 text-theme2 grid min-h-[18vh] place-content-center gap-5 rounded-2xl p-2 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
          key={metric}
        >
          <strong className="text-4xl font-phudu-b leading-none">
            {String(values[index] ?? 0).padStart(2, "0")}
          </strong>
          <h3 className="text-lg leading-tight">{metric}</h3>
        </div>
      ))}
    </div>
  )
}
