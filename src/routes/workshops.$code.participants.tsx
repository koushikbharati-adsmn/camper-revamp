import { getVisitorId } from "@/lib/fingerprint"
import {
  type ParticipantIdea,
  type ParticipantWorkshop,
  getParticipantIdeasOptions,
  getParticipantWorkshopOptions,
} from "@/services/participants"
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

type IdeaFilter = "all" | "shortlisted" | "sharpened"

const walkthroughSessionKey = (workshopId: string) =>
  `participant-walkthrough:${workshopId}`

function hasCompletedWalkthrough(workshopId: string) {
  try {
    return sessionStorage.getItem(walkthroughSessionKey(workshopId)) === "true"
  } catch {
    return false
  }
}

function saveWalkthroughCompletion(workshopId: string) {
  try {
    sessionStorage.setItem(walkthroughSessionKey(workshopId), "true")
  } catch {
    // In-memory state still prevents the walkthrough from repeating this visit.
  }
}

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
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: workshop } = useSuspenseQuery({
    ...getParticipantWorkshopOptions({
      code,
      visitor_id: visitorId,
    }),
    select: (response) => response.data,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  return (
    <ParticipantExperience
      key={workshop.ID}
      code={code}
      visitorId={visitorId}
      workshop={workshop}
    />
  )
}

function ParticipantExperience({
  code,
  visitorId,
  workshop,
}: {
  code: string
  visitorId: string
  workshop: ParticipantWorkshop
}) {
  const walkthroughItems = [...workshop.walkThrough].sort(
    (first, second) => first.DisplayOrder - second.DisplayOrder
  )
  const [shouldShowWalkthrough, setShouldShowWalkthrough] = useState(
    () => walkthroughItems.length > 0 && !hasCompletedWalkthrough(code)
  )
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [ideaFilter, setIdeaFilter] = useState<IdeaFilter>("all")

  useEffect(() => {
    if (shouldShowWalkthrough) saveWalkthroughCompletion(code)
  }, [shouldShowWalkthrough, code])

  const { data: ideas = [], isPending: areIdeasPending } = useQuery({
    ...getParticipantIdeasOptions({
      visitor_id: visitorId,
      workshop_code: code,
      category_id: selectedCategoryId,
      team_id: selectedTeamId,
      is_shortlisted: ideaFilter === "shortlisted" ? true : null,
      is_coached: ideaFilter === "sharpened" ? true : null,
    }),
    enabled: selectedTeamId !== null,
    select: (response) => response.data,
  })
  const selectedTeam = workshop.teams.find((team) => team.ID === selectedTeamId)
  const selectedCategory = workshop.category.find(
    (category) => category.ID === selectedCategoryId
  )

  const completeWalkthrough = () => {
    saveWalkthroughCompletion(workshop.ID)
    setShouldShowWalkthrough(false)
  }

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
            <li
              onClick={() => {
                setSelectedTeamId(null)
                setSelectedCategoryId(null)
                setIdeaFilter("all")
              }}
            >
              Home
            </li>
            <li>The Newsroom</li>
            <li>The Stage</li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {shouldShowWalkthrough ? (
          <WalkthroughScreen
            key={workshop.ID}
            items={walkthroughItems}
            workshop={workshop}
            onBegin={completeWalkthrough}
          />
        ) : selectedTeam ? (
          <IdeasScreen
            teamName={selectedTeam.TeamName}
            pillarName={selectedCategory?.Name ?? ""}
            teams={workshop.teams}
            categories={workshop.category}
            ideas={ideas}
            selectedTeamId={selectedTeamId}
            selectedCategoryId={selectedCategoryId}
            ideaFilter={ideaFilter}
            isPending={areIdeasPending}
            onTeamChange={setSelectedTeamId}
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

function WalkthroughScreen({
  items,
  workshop,
  onBegin,
}: {
  items: ParticipantWorkshop["walkThrough"]
  workshop: ParticipantWorkshop
  onBegin: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentItem = items[currentIndex]
  const isFirstItem = currentIndex === 0
  const isLastItem = currentIndex === items.length - 1

  if (!currentItem) return null

  return (
    <section className="grid min-h-full place-items-center py-8">
      <div
        className="w-full max-w-2xl border p-6 sm:p-10"
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          borderColor: workshop.card_primary_border_color,
          borderRadius: workshop.card_primary_border_radius,
          borderWidth: workshop.card_primary_border_width,
          color: workshop.txt_primary_color,
        }}
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <p
            className="text-sm font-medium tracking-wide uppercase"
            style={{ color: workshop.txt_secondary_color }}
          >
            Welcome to {workshop.Name}
          </p>
          <p className="shrink-0 text-sm">
            {currentIndex + 1} / {items.length}
          </p>
        </div>

        <div aria-live="polite" className="min-h-48">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {currentItem.Title}
          </h1>
          <p
            className="mt-5 text-base leading-7 whitespace-pre-line sm:text-lg"
            style={{ color: workshop.txt_secondary_color }}
          >
            {currentItem.Description}
          </p>
        </div>

        <div className="mt-8 flex gap-2" aria-label="Walkthrough progress">
          {items.map((item, index) => (
            <span
              key={item.ID}
              className="h-1.5 flex-1"
              style={{
                backgroundColor:
                  index <= currentIndex
                    ? workshop.btn_primary_bg_color
                    : workshop.btn_secondary_bg_color,
              }}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isFirstItem}
            className="border px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: workshop.btn_secondary_bg_color,
              borderColor: workshop.btn_secondary_border_color,
              color: workshop.btn_secondary_txt_color,
            }}
            onClick={() => setCurrentIndex((index) => index - 1)}
          >
            Previous
          </button>

          <button
            type="button"
            className="border px-5 py-2.5 font-medium"
            style={{
              backgroundColor: workshop.btn_primary_bg_color,
              borderColor: workshop.btn_primary_bg_color,
              color: workshop.btn_primary_txt_color,
            }}
            onClick={() => {
              if (isLastItem) {
                onBegin()
                return
              }

              setCurrentIndex((index) => index + 1)
            }}
          >
            {isLastItem ? "Begin" : "Next"}
          </button>
        </div>
      </div>
    </section>
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
  pillarName,
  teams,
  categories,
  ideas,
  selectedTeamId,
  selectedCategoryId,
  ideaFilter,
  isPending,
  onTeamChange,
  onCategoryChange,
  onIdeaFilterChange,
}: {
  teamName: string
  pillarName: string | null
  teams: ParticipantWorkshop["teams"]
  categories: ParticipantWorkshop["category"]
  ideas: ParticipantIdea[]
  selectedTeamId: number | null
  selectedCategoryId: number | null
  ideaFilter: IdeaFilter
  isPending: boolean
  onTeamChange: (teamId: number) => void
  onCategoryChange: (categoryId: number | null) => void
  onIdeaFilterChange: (filter: IdeaFilter) => void
}) {
  const [isAddIdeaOpen, setIsAddIdeaOpen] = useState(false)

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{teamName} Ideas</h1>
        <button
          type="button"
          className="border px-4 py-2"
          onClick={() => setIsAddIdeaOpen(true)}
        >
          Add Idea
        </button>
      </div>

      <AddIdeaDialog
        open={isAddIdeaOpen}
        teamName={teamName}
        pillarName={pillarName}
        onClose={() => setIsAddIdeaOpen(false)}
      />

      <div className="mb-6 flex flex-wrap gap-4">
        {selectedTeamId && (
          <label className="grid gap-1">
            <span>Team</span>
            <select
              className="border px-3 py-2"
              value={selectedTeamId}
              onChange={(event) => onTeamChange(Number(event.target.value))}
            >
              {teams.map((team) => (
                <option key={team.ID} value={team.ID}>
                  {team.TeamName}
                </option>
              ))}
            </select>
          </label>
        )}

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

function AddIdeaDialog({
  open,
  teamName,
  pillarName,
  onClose,
}: {
  open: boolean
  teamName: string
  pillarName: string | null
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const closeDialog = () => {
    formRef.current?.reset()
    onClose()
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="add-idea-title"
      className="m-auto w-[min(32rem,calc(100%-2rem))] border bg-white p-0 text-black backdrop:bg-black/50"
      onClose={closeDialog}
    >
      <form
        ref={formRef}
        className="grid gap-5 p-6"
        onSubmit={(event) => {
          event.preventDefault()
          closeDialog()
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-idea-title" className="text-xl font-semibold">
              Add an idea
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Share a new idea with {teamName}.{" "}
              {pillarName && `Pillar: ${pillarName}`}
            </p>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center border text-xl leading-none"
            aria-label="Close dialog"
            onClick={closeDialog}
          >
            &times;
          </button>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Title (Optional)</span>
          <input
            name="title"
            type="text"

            placeholder="Give your idea a clear title"
            className="w-full border px-3 py-2 outline-none focus:border-black"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            required
            autoFocus
            rows={5}
            placeholder="Describe the idea, the problem it solves, and its impact"
            className="w-full resize-y border px-3 py-2 outline-none focus:border-black"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Context (Optional)</span>
          <textarea
            name="context"
            rows={5}
            placeholder="Describe the context in which this idea will be used"
            className="w-full resize-y border px-3 py-2 outline-none focus:border-black"
          />
        </label>

        <div className="flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            className="border px-4 py-2"
            onClick={closeDialog}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="border border-black bg-black px-4 py-2 text-white"
          >
            Add idea
          </button>
        </div>
      </form>
    </dialog>
  )
}
