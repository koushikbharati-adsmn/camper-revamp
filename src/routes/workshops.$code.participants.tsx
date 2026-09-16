import { getVisitorId } from "@/lib/fingerprint"
import { toast } from "@/components/ui/toast"
import {
  type ParticipantIdea,
  type ParticipantWorkshop,
  getParticipantIdeasOptions,
  getParticipantWorkshopOptions,
  useSaveIdea,
} from "@/services/participants"
import {
  queryOptions,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { BellIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"

type IdeaFilter = "all" | "shortlisted" | "sharpened"

const tickerItems = [
  "Lorem Ipsum is simply dummy text",
  "Lorem Ipsum is simply dummy text",
  "Lorem Ipsum is simply dummy text",
  "Lorem Ipsum is simply dummy text",
]

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
    walkthroughItems.length > 0
  )
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [ideaFilter, setIdeaFilter] = useState<IdeaFilter>("all")

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

  const completeWalkthrough = () => {
    setShouldShowWalkthrough(false)
  }

  return (
    <div className="flex h-dvh flex-col">
      <header
        className="grid h-16"
        style={{
          backgroundColor: workshop.header_bg_color,
          color: workshop.header_txt_color,
        }}
      >
        <nav className="flex items-center justify-between px-4 sm:px-6">
          <img
            className="h-10 w-auto invert"
            src={workshop.logoFileName}
            alt="logo"
          />

          <ul className="flex gap-6 sm:gap-10">
            <li className="font-medium">The Newsroom</li>
            <li className="font-medium">The Stage</li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto">
        {shouldShowWalkthrough ? (
          <WalkthroughScreen
            key={workshop.ID}
            items={walkthroughItems}
            workshop={workshop}
            onBegin={completeWalkthrough}
          />
        ) : selectedTeam ? (
          <IdeasScreen
            code={code}
            visitorId={visitorId}
            teamName={selectedTeam.TeamName}
            teams={workshop.teams}
            categories={workshop.category}
            ideas={ideas}
            selectedTeamId={selectedTeam.ID}
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
        className="flex h-12 overflow-hidden border-y border-black/5"
        style={{
          backgroundColor: workshop.ticker_bg_color,
          color: workshop.ticker_txt_color,
        }}
      >
        <div className="relative z-10 flex shrink-0 items-center bg-inherit pl-4">
          <span
            className="px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: workshop.ticker_bg_color,
              color: workshop.ticker_txt_color,
            }}
          >
            LIVE
          </span>

          <span className="h-7 border-r border-black/40" />
        </div>

        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <div className="flex w-max animate-[ticker-scroll_20s_linear_infinite] whitespace-nowrap hover:paused">
            {[0, 1].map((group) => (
              <div
                key={group}
                className="pointer-events-none flex shrink-0 items-center select-none"
                aria-hidden={group === 1}
              >
                {tickerItems.map((item, index) => (
                  <div
                    key={`${group}-${index}`}
                    className="flex items-center gap-2 px-8"
                  >
                    <BellIcon className="size-4 shrink-0" strokeWidth={1.8} />

                    <span className="text-xs font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
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
    <section className="grid min-h-full place-items-center px-4 py-4 sm:px-6 sm:py-6">
      <div
        className="flex min-h-112 w-full max-w-5xl flex-col overflow-hidden rounded-lg border shadow-xs sm:min-h-128"
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          borderColor: workshop.card_primary_border_color,
          borderRadius: workshop.card_primary_border_radius,
          borderWidth: workshop.card_primary_border_width,
          color: workshop.txt_primary_color,
        }}
      >
        <div
          className="grid border-b"
          style={{ borderColor: workshop.card_primary_border_color }}
          role="progressbar"
          aria-label="Walkthrough progress"
          aria-valuemin={1}
          aria-valuemax={items.length}
          aria-valuenow={currentIndex + 1}
          aria-valuetext={`Step ${currentIndex + 1} of ${items.length}`}
        >
          <div className="flex gap-2 px-6 pt-4 sm:gap-3 sm:px-10 sm:pt-6">
            {items.map((item, index) => (
              <div key={item.ID} className="min-w-0 flex-1" aria-hidden="true">
                <p
                  className="mb-3 truncate text-center text-xs font-semibold tracking-wide uppercase"
                  style={{
                    color:
                      index === currentIndex
                        ? workshop.txt_primary_color
                        : workshop.txt_secondary_color,
                  }}
                >
                  <span className="sm:hidden">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hidden sm:inline">{item.Title}</span>
                </p>
                <span
                  className="block h-1 rounded-full"
                  style={{
                    backgroundColor:
                      index <= currentIndex
                        ? workshop.btn_primary_bg_color
                        : workshop.btn_secondary_bg_color,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          aria-live="polite"
          className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-14 sm:py-16 lg:px-20"
        >
          <h1 className="max-w-4xl text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
            {currentItem.Title}
          </h1>
          <p
            className="mt-6 max-w-3xl text-base leading-7 whitespace-pre-line sm:mt-8 sm:text-xl sm:leading-8"
            style={{ color: workshop.txt_secondary_color }}
          >
            {currentItem.Description}
          </p>
        </div>

        <div
          className="flex min-h-16 items-center justify-end gap-3 border-t px-6 sm:px-10"
          style={{ borderColor: workshop.card_primary_border_color }}
        >
          {!isFirstItem && (
            <button
              type="button"
              className="min-w-28 rounded-md border px-5 py-2 text-sm font-medium transition-transform focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: workshop.btn_secondary_bg_color,
                borderColor: workshop.btn_secondary_border_color,
                color: workshop.btn_secondary_txt_color,
                outlineColor: workshop.btn_secondary_border_color,
              }}
              onClick={() => setCurrentIndex((index) => index - 1)}
            >
              Previous
            </button>
          )}

          <button
            type="button"
            className="min-w-28 rounded-md border px-5 py-2 text-sm font-medium transition-transform focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: workshop.btn_primary_bg_color,
              borderColor: workshop.btn_primary_bg_color,
              color: workshop.btn_primary_txt_color,
              outlineColor: workshop.btn_primary_bg_color,
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return

    const updateCarouselState = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    updateCarouselState()
    emblaApi.on("select", updateCarouselState)
    emblaApi.on("reInit", updateCarouselState)

    return () => {
      emblaApi.off("select", updateCarouselState)
      emblaApi.off("reInit", updateCarouselState)
    }
  }, [emblaApi])

  if (teams.length === 0)
    return <p className="p-4 sm:p-6">No teams available.</p>

  return (
    <section
      className="flex min-h-full flex-col justify-center py-4 sm:py-6"
      aria-label="Select a team"
      aria-roledescription="carousel"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden py-4 sm:py-6">
            <ul className="-ml-4 flex touch-pan-y sm:-ml-6">
              {teams.map((team, index) => {
                const isSelected = index === selectedIndex

                return (
                  <li
                    key={team.ID}
                    className="min-w-0 flex-[0_0_84%] pl-4 sm:flex-[0_0_58%] sm:pl-6 lg:flex-[0_0_38%] xl:flex-[0_0_34%]"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} of ${teams.length}`}
                  >
                    <button
                      type="button"
                      className={`flex h-full w-full flex-col overflow-hidden border bg-white text-left transition-[transform,opacity] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                        isSelected
                          ? "scale-100 opacity-100 sm:scale-105"
                          : "scale-[0.90] opacity-55"
                      }`}
                      onClick={() => onSelectTeam(team.ID)}
                    >
                      <div className="aspect-4/3 w-full overflow-hidden bg-neutral-100">
                        {team.ThumbnailFileName && (
                          <img
                            src={team.ThumbnailFileName}
                            alt=""
                            className="size-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-6">
                        <h2 className="text-center text-xl leading-tight font-semibold tracking-[-0.02em] sm:text-2xl">
                          {team.TeamName}
                        </h2>
                        <p className="text-center text-sm leading-6 text-neutral-600 sm:text-base">
                          {team.Description}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {teams.length > 1 && (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 sm:-left-16"
                aria-label="Previous team"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="absolute top-1/2 right-2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 sm:-right-16"
                aria-label="Next team"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRightIcon className="size-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {teams.length > 1 && (
          <div
            className="mt-4 flex items-center justify-center"
            aria-label="Choose slide"
          >
            <div className="flex items-center gap-2.5">
              {teams.map((team, index) => (
                <button
                  key={team.ID}
                  type="button"
                  className={`size-2.5 rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 ${
                    index === selectedIndex
                      ? "scale-135 bg-neutral-900"
                      : "bg-neutral-300"
                  }`}
                  aria-label={`Go to ${team.TeamName}`}
                  aria-current={index === selectedIndex ? "true" : undefined}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function IdeasScreen({
  code,
  visitorId,
  teamName,
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
  code: string
  visitorId: string
  teamName: string
  teams: ParticipantWorkshop["teams"]
  categories: ParticipantWorkshop["category"]
  ideas: ParticipantIdea[]
  selectedTeamId: number
  selectedCategoryId: number | null
  ideaFilter: IdeaFilter
  isPending: boolean
  onTeamChange: (teamId: number) => void
  onCategoryChange: (categoryId: number | null) => void
  onIdeaFilterChange: (filter: IdeaFilter) => void
}) {
  const [isAddIdeaOpen, setIsAddIdeaOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<ParticipantIdea | null>(null)

  const closeIdeaDialog = () => {
    setIsAddIdeaOpen(false)
    setEditingIdea(null)
  }

  return (
    <section className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{teamName} Ideas</h1>
        <button
          type="button"
          className="border px-4 py-2"
          onClick={() => {
            setEditingIdea(null)
            setIsAddIdeaOpen(true)
          }}
        >
          Add Idea
        </button>
      </div>

      <IdeaDialog
        key={editingIdea?.ID ?? "new"}
        open={isAddIdeaOpen}
        code={code}
        visitorId={visitorId}
        teamId={selectedTeamId!}
        teamName={teamName}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        idea={editingIdea}
        onClose={closeIdeaDialog}
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
              {idea.Title && (
                <h2 className="mt-2 font-semibold">{idea.Title}</h2>
              )}
              <p className="mt-2 text-sm">{idea.Desc}</p>
              {idea.flgSelf && (
                <button
                  type="button"
                  className="mt-4 border px-3 py-1.5 text-sm"
                  onClick={() => {
                    setEditingIdea(idea)
                    setIsAddIdeaOpen(true)
                  }}
                >
                  Edit
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No ideas available.</p>
      )}
    </section>
  )
}

function IdeaDialog({
  open,
  code,
  visitorId,
  teamId,
  teamName,
  categories,
  selectedCategoryId,
  idea,
  onClose,
}: {
  open: boolean
  code: string
  visitorId: string
  teamId: number
  teamName: string
  categories: ParticipantWorkshop["category"]
  selectedCategoryId: number | null
  idea: ParticipantIdea | null
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const saveIdeaMutation = useSaveIdea()
  const ideaCategoryId = idea
    ? categories.find((category) => category.Name === idea.Category)?.ID
    : undefined
  const defaultCategoryId =
    ideaCategoryId ?? selectedCategoryId ?? categories[0]?.ID

  const closeDialog = () => {
    if (saveIdeaMutation.isPending) return
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
      aria-labelledby="idea-dialog-title"
      className="m-auto w-[min(32rem,calc(100%-2rem))] border bg-white p-0 text-black backdrop:bg-black/50"
      onClose={closeDialog}
    >
      <form
        ref={formRef}
        className="grid gap-5 p-6"
        aria-busy={saveIdeaMutation.isPending}
        onSubmit={async (event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)

          try {
            const response = await saveIdeaMutation.mutateAsync({
              ...(idea ? { idea_id: idea.ID } : {}),
              visitor_id: visitorId,
              workshop_code: code,
              team_id: teamId,
              category_id: Number(formData.get("categoryId")),
              desc: String(formData.get("description")).trim(),
              title: String(formData.get("title")).trim() || null,
              context: String(formData.get("context")).trim() || null,
            })

            await queryClient.invalidateQueries({
              queryKey: ["PARTICIPANT_IDEAS"],
            })
            toast.add({
              type: "success",
              title: idea ? "Idea updated" : "Idea added",
              description: response.message,
            })
            closeDialog()
          } catch {
            return
          }
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="idea-dialog-title" className="text-xl font-semibold">
              {idea ? "Edit idea" : "Add an idea"}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {idea ? "Update your idea" : "Share a new idea"} with {teamName}.
            </p>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center border text-xl leading-none"
            aria-label="Close dialog"
            disabled={saveIdeaMutation.isPending}
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
            defaultValue={idea?.Title ?? ""}
            disabled={saveIdeaMutation.isPending}
            placeholder="Give your idea a clear title"
            className="w-full border px-3 py-2 outline-none focus:border-black"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Pillar</span>
          <select
            name="categoryId"
            required
            defaultValue={defaultCategoryId}
            disabled={saveIdeaMutation.isPending}
            className="w-full border px-3 py-2 outline-none focus:border-black"
          >
            {categories.length === 0 && (
              <option value="">No pillars available</option>
            )}
            {categories.map((category) => (
              <option key={category.ID} value={category.ID}>
                {category.Name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            required
            autoFocus
            defaultValue={idea?.Desc ?? ""}
            disabled={saveIdeaMutation.isPending}
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
            defaultValue={idea?.Context ?? ""}
            disabled={saveIdeaMutation.isPending}
            placeholder="Describe the context in which this idea will be used"
            className="w-full resize-y border px-3 py-2 outline-none focus:border-black"
          />
        </label>

        <div className="flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            className="border px-4 py-2"
            disabled={saveIdeaMutation.isPending}
            onClick={closeDialog}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="border border-black bg-black px-4 py-2 text-white"
            disabled={saveIdeaMutation.isPending || categories.length === 0}
          >
            {saveIdeaMutation.isPending
              ? "Saving..."
              : idea
                ? "Save changes"
                : "Add idea"}
          </button>
        </div>
      </form>
    </dialog>
  )
}
