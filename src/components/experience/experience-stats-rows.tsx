import type { DashboardTeamStat } from "@/services/big-screen"

export function NewsroomStatsRows({ teams }: { teams: DashboardTeamStat[] }) {
  return (
    <div className="grid gap-8">
      {teams.map((team, idx) => {
        const stats = [
          {
            label: "Drafts",
            value: team.Drafts,
          },
          {
            label: "Shortlisted",
            value: team.Shortlisted,
          },
          {
            label: "Sharpened",
            value: team.Sharpened,
          },
          {
            label: "Total Ideas",
            value: team.TotalIdeas,
          },
        ]

        return (
          <div
            className="grid grid-cols-[1.35fr_repeat(4,1fr)] gap-8"
            key={team.TeamID}
          >
            <div className="grid min-w-0 border-b-2 border-black px-2 py-3">
              <strong className="text-2xl text-red-500">{team.TeamName}</strong>
              <small className="font-medium tracking-wider uppercase">
                Team {idx + 1}
              </small>
            </div>
            {stats.map((stat, index) => (
              <div
                className="grid min-w-0 border-b-2 border-black px-2 py-3"
                key={index}
              >
                <strong className="text-2xl">
                  {String(stat.value).padStart(2, "0")}
                </strong>
                <small className="font-medium tracking-wider uppercase">
                  {stat.label}
                </small>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
