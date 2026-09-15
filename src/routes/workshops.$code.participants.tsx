import { getVisitorId } from "@/lib/fingerprint"
import {
  type ParticipantIdea,
  type ParticipantWorkshop,
  getParticipantIdeasOptions,
  getParticipantWorkshopOptions,
} from "@/services/participants"
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

type IdeaFilter = "all" | "shortlisted" | "sharpened"

const visitorIdOptions = queryOptions({
  queryKey: ["PARTICIPANT_VISITOR_ID"],
  queryFn: getVisitorId,
  staleTime: Infinity,
})

export const Route = createFileRoute("/workshops/$code/participants")({
  loader: async ({ context, params }) => {
    const visitorId = await context.queryClient.query(visitorIdOptions)

    return context.queryClient.query(
      getParticipantWorkshopOptions({
        code: params.code,
        visitor_id: visitorId,
      })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = Route.useParams()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [ideaFilter, setIdeaFilter] = useState<IdeaFilter>("all")
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: workshop } = useSuspenseQuery({
    ...getParticipantWorkshopOptions({
      code,
      visitor_id: visitorId,
    }),
    select: (response) => response.data,
  })
  const { data: ideasResponse, isPending: areIdeasPending } = useQuery({
    ...getParticipantIdeasOptions({
      visitor_id: visitorId,
      workshop_code: code,
      category_id: selectedCategoryId,
      team_id: selectedTeamId,
      is_shortlisted: ideaFilter === "shortlisted",
      is_coached: ideaFilter === "sharpened",
    }),
    enabled: selectedTeamId !== null,
  })
  const selectedTeam = workshop.teams.find((team) => team.ID === selectedTeamId)
  const ideas = ideasResponse?.data ?? []

  return (
    <div className="flex h-dvh flex-col">
      <header
        style={{
          backgroundColor: workshop.header_bg_color,
          color: workshop.header_txt_color,
        }}
      >
        <nav className="flex items-center justify-between">
          <img src={workshop.logoFileName} alt="logo" />

          <ul className="flex gap-4">
            <li>Home</li>
            <li>The Newsroom</li>
            <li>The Stage</li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {selectedTeam ? (
          <IdeasScreen
            teamName={selectedTeam.TeamName}
            categories={workshop.category}
            ideas={ideas}
            selectedCategoryId={selectedCategoryId}
            ideaFilter={ideaFilter}
            isPending={areIdeasPending}
            onBack={() => {
              setSelectedTeamId(null)
              setSelectedCategoryId(null)
              setIdeaFilter("all")
            }}
            onCategoryChange={setSelectedCategoryId}
            onIdeaFilterChange={setIdeaFilter}
          />
        ) : (
          <TeamsScreen
            teams={workshop.teams}
            onSelectTeam={setSelectedTeamId}
          />
        )}
      </main>
      <footer
        style={{
          backgroundColor: workshop.ticker_bg_color,
          color: workshop.ticker_txt_color,
        }}
      >
        Footer
      </footer>
    </div>
  )
}

function TeamsScreen({
  teams,
  onSelectTeam,
}: {
  teams: ParticipantWorkshop["teams"]
  onSelectTeam: (teamId: number) => void
}) {
  if (teams.length === 0) return <p>No teams available.</p>

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <li key={team.ID}>
          <button
            type="button"
            className="flex w-full items-center gap-3 border p-4 text-left"
            style={{ borderColor: team.TeamColorCode }}
            onClick={() => onSelectTeam(team.ID)}
          >
            {team.ThumbnailFileName && (
              <img
                src={team.ThumbnailFileName}
                alt=""
                className="size-12 object-cover"
              />
            )}
            <span>
              <span className="block font-medium">{team.TeamName}</span>
              <span className="block text-sm">{team.Description}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function IdeasScreen({
  teamName,
  categories,
  ideas,
  selectedCategoryId,
  ideaFilter,
  isPending,
  onBack,
  onCategoryChange,
  onIdeaFilterChange,
}: {
  teamName: string
  categories: ParticipantWorkshop["category"]
  ideas: ParticipantIdea[]
  selectedCategoryId: number | null
  ideaFilter: IdeaFilter
  isPending: boolean
  onBack: () => void
  onCategoryChange: (categoryId: number | null) => void
  onIdeaFilterChange: (filter: IdeaFilter) => void
}) {
  return (
    <section>
      <button type="button" className="mb-4 underline" onClick={onBack}>
        Back to teams
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{teamName} Ideas</h1>
        <button type="button" className="border px-4 py-2">
          Add Idea
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <label className="grid gap-1">
          <span>Pillar</span>
          <select
            className="border px-3 py-2"
            value={selectedCategoryId ?? "all"}
            onChange={(event) =>
              onCategoryChange(
                event.target.value === "all" ? null : Number(event.target.value)
              )
            }
          >
            <option value="all">All pillars</option>
            {categories.map((category) => (
              <option key={category.ID} value={category.ID}>
                {category.Name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span>Ideas</span>
          <select
            className="border px-3 py-2"
            value={ideaFilter}
            onChange={(event) =>
              onIdeaFilterChange(event.target.value as IdeaFilter)
            }
          >
            <option value="all">All ideas</option>
            <option value="shortlisted">Shortlisted ideas</option>
            <option value="sharpened">Sharpened ideas</option>
          </select>
        </label>
      </div>

      {isPending ? (
        <p>Loading ideas...</p>
      ) : ideas.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <li key={idea.ID} className="border p-4">
              {idea.imageFileName && (
                <img
                  src={idea.imageFileName}
                  alt=""
                  className="mb-3 aspect-video w-full object-cover"
                />
              )}
              <p className="font-medium">{idea.Category}</p>
              <p className="mt-2 text-sm">{idea.Desc}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No ideas available.</p>
      )}
    </section>
  )
}
