type TeamStats = {
  title: string
  submitted: number
  shortlisted: number
  sharpened: number
  total: number
}

type NewsroomStatsRowsProps = {
  teams: TeamStats[]
  metrics: string[]
}

export default function NewsroomStatsRows({
  teams,
  metrics,
}: NewsroomStatsRowsProps) {
  return (
    <div className="grid gap-2">
      {teams.map((team) => {
        const values = [
          team.submitted,
          team.shortlisted,
          team.sharpened,
          team.total,
        ]

        return (
          <div
            className="grid grid-cols-2 gap-8 lg:grid-cols-[1.35fr_repeat(4,1fr)]"
            key={team.title}
          >
            <div className="border-theme1 col-span-2 min-w-0 border-b-2 px-2 py-3 lg:col-span-1">
              <strong className="font-phudu-b text-theme8 block truncate text-2xl leading-none">
                {team.title}
              </strong>
              <small className="font-ogilvy-r text-theme1 mt-2 block text-base leading-tight uppercase">
                TEAM NAME
              </small>
            </div>
            {values.map((value, index) => (
              <div
                className="border-theme1 min-w-0 border-b-2 px-2 py-3"
                key={metrics[index]}
              >
                <strong className="font-phudu-m text-theme1 text-2xl leading-none">
                  {String(value).padStart(2, "0")}
                </strong>
                <small className="font-ogilvy-r text-theme1 mt-2 block text-base leading-tight uppercase">
                  {metrics[index]}
                </small>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
