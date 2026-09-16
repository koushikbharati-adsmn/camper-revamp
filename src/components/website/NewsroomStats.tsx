import NewsroomStatsRows from "./NewsroomStatsRows"

type TeamStats = {
  title: string
  submitted: number
  shortlisted: number
  sharpened: number
  total: number
}

type NewsroomStatsProps = {
  teams?: TeamStats[]
  metrics?: string[]
  showSummary?: boolean
}

const defaultMetrics = ["Drafts", "Shortlisted", "Sharpened", "Total Ideas"]

export default function NewsroomStats({
  teams,
  metrics = defaultMetrics,
  showSummary = true,
}: NewsroomStatsProps) {
  const safeTeams = teams ?? []

  const summaryValues = [
    safeTeams.reduce((sum, team) => sum + team.submitted, 0),
    safeTeams.reduce((sum, team) => sum + team.shortlisted, 0),
    safeTeams.reduce((sum, team) => sum + team.sharpened, 0),
    safeTeams.reduce((sum, team) => sum + team.total, 0),
  ]

  return (
    <div className="grid w-full gap-5" aria-label="Team performance">
      {showSummary && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              className="bg-theme1 text-theme2 grid min-h-[18vh] place-content-center gap-5 rounded-2xl p-2 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
              key={metric}
            >
              <strong className="text-4xl font-phudu-b leading-none">
                {String(summaryValues[index]).padStart(2, "0")}
              </strong>
              <h3 className="text-lg leading-tight">{metric}</h3>
            </div>
          ))}
        </div>
      )}

      <NewsroomStatsRows teams={safeTeams} metrics={metrics} />
    </div>
  )
}
