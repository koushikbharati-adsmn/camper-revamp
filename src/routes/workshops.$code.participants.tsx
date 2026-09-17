import { getVisitorId } from "@/lib/fingerprint"
import { toast } from "@/components/ui/toast"
import {
  type ParticipantIdea,
  type ParticipantWorkshop,
  getParticipantIdeasOptions,
  getParticipantWorkshopOptions,
  useGenerateIdeaImage,
  useSaveIdea,
  useScoutIdea,
  useShortlistIdea,
} from "@/services/participants"
import {
  queryOptions,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ImagePlusIcon,
  PlusIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquarePenIcon,
  StarIcon,
  XIcon,
} from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { formatRelativeDate } from "@/lib/date"
import { ExperienceButton } from "@/components/experience/experience-button"
import {
  ExperienceSelect,
  ExperienceSelectOption,
} from "@/components/experience/experience-select"
import { ExperienceSegmentedControl } from "@/components/experience/experience-segmented-control"
import { cn } from "@/lib/utils"

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
    // refetchOnWindowFocus: true,
    // refetchOnMount: true,
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
          <img className="h-10 w-auto" src={workshop.logoFileName} alt="logo" />

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
            workshop={workshop}
            code={code}
            visitorId={visitorId}
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
              backgroundColor: workshop.ticker_live_bg_color,
              color: workshop.ticker_live_txt_color,
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
            <ExperienceButton
              variant="secondary"
              workshop={workshop}
              onClick={() => setCurrentIndex((index) => index - 1)}
            >
              Previous
            </ExperienceButton>
          )}

          <ExperienceButton
            variant="primary"
            workshop={workshop}
            onClick={() => {
              if (isLastItem) {
                onBegin()
                return
              }

              setCurrentIndex((index) => index + 1)
            }}
          >
            {isLastItem ? "Begin" : "Next"}
          </ExperienceButton>
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
                      className={`flex h-full w-full flex-col overflow-hidden rounded-md border bg-white text-left shadow-xs transition-[transform,opacity] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                        isSelected
                          ? "scale-100 opacity-100 sm:scale-105"
                          : "scale-[0.90] opacity-55"
                      }`}
                      onClick={() => onSelectTeam(team.ID)}
                    >
                      <div className="aspect-4/3 w-full overflow-hidden bg-neutral-100">
                        <img
                          src={team.ThumbnailFileName}
                          alt=""
                          className="size-full object-cover"
                        />
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
  workshop,
  code,
  visitorId,
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
  workshop: ParticipantWorkshop
  code: string
  visitorId: string
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
  const [isScoutOpen, setIsScoutOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<ParticipantIdea | null>(null)
  const [scoutSuggestions, setScoutSuggestions] = useState<string[] | null>(
    null
  )
  const queryClient = useQueryClient()
  const generateIdeaImageMutation = useGenerateIdeaImage()
  const scoutIdeaMutation = useScoutIdea()
  const shortlistIdeaMutation = useShortlistIdea()
  const selectedCategory = categories.find(
    (category) => category.ID === selectedCategoryId
  )

  const closeIdeaDialog = () => {
    setIsAddIdeaOpen(false)
    setEditingIdea(null)
  }

  const generateIdeaImage = async (idea: ParticipantIdea) => {
    try {
      await generateIdeaImageMutation.mutateAsync({
        idea_id: idea.ID,
        workshop_code: code,
        pillar_context:
          categories.find((category) => category.Name === idea.Category)
            ?.Context ?? "",
        workshop_context: workshop.WorkshopContext,
        user_idea: idea.Desc,
        brand_guidelines: workshop.GuidelineFileName,
      })

      await queryClient.invalidateQueries({
        queryKey: ["PARTICIPANT_IDEAS"],
      })
    } catch {
      return
    }
  }

  const scoutIdeas = async () => {
    if (!selectedCategory || ideas.length === 0) return

    setScoutSuggestions(null)
    setIsScoutOpen(true)

    try {
      const response = await scoutIdeaMutation.mutateAsync({
        workshop_code: code,
        pillar_title: selectedCategory.Name,
        user_ideas: ideas.map((idea) => idea.Desc),
      })

      setScoutSuggestions(response.data.text)
    } catch {
      return
    }
  }

  return (
    <section className="container mx-auto w-full p-4 sm:p-6 lg:p-8">
      <IdeaDialog
        key={editingIdea?.ID ?? "new"}
        open={isAddIdeaOpen}
        workshop={workshop}
        code={code}
        visitorId={visitorId}
        teamId={selectedTeamId}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        idea={editingIdea}
        onClose={closeIdeaDialog}
      />

      <ScoutDialog
        open={isScoutOpen}
        workshop={workshop}
        pillarTitle={selectedCategory?.Name ?? ""}
        suggestions={scoutSuggestions ?? []}
        isPending={scoutIdeaMutation.isPending}
        isError={scoutIdeaMutation.isError}
        onClose={() => setIsScoutOpen(false)}
      />

      <div className="mb-6 flex flex-col items-stretch justify-end gap-3 lg:flex-row lg:items-center">
        {selectedTeamId && (
          <label>
            <span className="sr-only">Team</span>
            <ExperienceSelect
              workshop={workshop}
              value={selectedTeamId}
              onChange={(event) => onTeamChange(Number(event.target.value))}
              className="w-full lg:w-auto"
            >
              {teams.map((team) => (
                <ExperienceSelectOption key={team.ID} value={team.ID}>
                  {team.TeamName}
                </ExperienceSelectOption>
              ))}
            </ExperienceSelect>
          </label>
        )}

        <label>
          <span className="sr-only">Pillar</span>
          <ExperienceSelect
            workshop={workshop}
            value={selectedCategoryId ?? "all"}
            onChange={(event) =>
              onCategoryChange(
                event.target.value === "all" ? null : Number(event.target.value)
              )
            }
            className="w-full lg:w-auto"
          >
            <ExperienceSelectOption value="all">
              All pillars
            </ExperienceSelectOption>

            {categories.map((category) => (
              <ExperienceSelectOption key={category.ID} value={category.ID}>
                {category.Name}
              </ExperienceSelectOption>
            ))}
          </ExperienceSelect>
        </label>

        <div className="max-w-full overflow-x-auto">
          <ExperienceSegmentedControl
            value={ideaFilter}
            options={[
              {
                value: "all",
                label: "All Ideas",
              },
              {
                value: "shortlisted",
                label: "Shortlisted",
              },
              {
                value: "sharpened",
                label: "Sharpened",
              },
            ]}
            workshop={workshop}
            ariaLabel="Filter ideas"
            onValueChange={onIdeaFilterChange}
          />
        </div>
      </div>

      <ul
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy={isPending}
      >
        <li>
          <button
            type="button"
            className="flex h-full w-full flex-col overflow-hidden rounded-lg border bg-white text-left shadow-xs transition-transform focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={() => {
              setEditingIdea(null)
              setIsAddIdeaOpen(true)
            }}
          >
            <span className="grid aspect-4/3 w-full place-items-center bg-neutral-100 text-neutral-400">
              <PlusIcon className="size-9" aria-hidden="true" />
            </span>
            <span className="grid flex-1 place-items-center px-4 py-6 text-center text-xl font-semibold tracking-[-0.02em] uppercase">
              Add new idea
            </span>
          </button>
        </li>

        {isPending
          ? Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="min-h-96 animate-pulse overflow-hidden rounded-lg border bg-white shadow-xs sm:min-h-112"
                aria-hidden="true"
              >
                <div className="aspect-4/3 bg-neutral-100" />
                <div className="space-y-4 p-5">
                  <div className="h-3 w-20 rounded bg-neutral-100" />
                  <div className="h-6 w-3/4 rounded bg-neutral-100" />
                  <div className="h-16 rounded bg-neutral-100" />
                </div>
              </li>
            ))
          : ideas.map((idea) => (
              <li
                key={idea.ID}
                className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
                  {idea.imageFileName ? (
                    <>
                      <img
                        src={idea.imageFileName}
                        alt={idea.title || "idea"}
                        className="size-full object-contain"
                      />
                      <button
                        type="button"
                        className="absolute right-2 bottom-2 grid size-8 place-content-center rounded-md bg-neutral-950 text-white disabled:cursor-wait disabled:opacity-50"
                        aria-label={`Regenerate the image for ${idea.title || "idea"}`}
                        aria-busy={
                          generateIdeaImageMutation.isPending &&
                          generateIdeaImageMutation.variables.idea_id ===
                            idea.ID
                        }
                        disabled={generateIdeaImageMutation.isPending}
                        onClick={() => void generateIdeaImage(idea)}
                      >
                        <RefreshCwIcon
                          className={`size-4 ${
                            generateIdeaImageMutation.isPending &&
                            generateIdeaImageMutation.variables.idea_id ===
                              idea.ID
                              ? "animate-spin"
                              : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400 disabled:cursor-wait disabled:opacity-50"
                      aria-label={`Generate an image for ${idea.title || "idea"}`}
                      aria-busy={
                        generateIdeaImageMutation.isPending &&
                        generateIdeaImageMutation.variables.idea_id === idea.ID
                      }
                      disabled={generateIdeaImageMutation.isPending}
                      onClick={() => void generateIdeaImage(idea)}
                    >
                      <ImagePlusIcon className="size-9" aria-hidden="true" />
                      <span>
                        {generateIdeaImageMutation.isPending &&
                        generateIdeaImageMutation.variables.idea_id === idea.ID
                          ? "Generating Idea Card..."
                          : "Click to Generate Idea Card"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={
                          idea.flgTeam
                            ? `Remove ${idea.title || "idea"} from shortlist`
                            : `Shortlist ${idea.title || "idea"}`
                        }
                        aria-pressed={idea.flgTeam}
                        disabled={
                          shortlistIdeaMutation.isPending &&
                          shortlistIdeaMutation.variables.idea_id === idea.ID
                        }
                        className="disabled:cursor-wait disabled:opacity-50"
                        onClick={async () => {
                          try {
                            await shortlistIdeaMutation.mutateAsync({
                              workshop_code: code,
                              idea_id: idea.ID,
                              flag: !idea.flgTeam,
                            })

                            await queryClient.invalidateQueries({
                              queryKey: ["PARTICIPANT_IDEAS"],
                            })
                          } catch {
                            return
                          }
                        }}
                      >
                        <StarIcon
                          className="size-5"
                          fill={idea.flgTeam ? "currentColor" : "none"}
                          aria-hidden="true"
                        />
                      </button>
                      {idea.flgSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIdea(idea)
                            setIsAddIdeaOpen(true)
                          }}
                        >
                          <SquarePenIcon
                            className="size-5"
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>
                    {idea.flgCoach && (
                      <SparklesIcon className="size-5" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl leading-tight font-semibold">
                      {idea.title || "Untitled"}
                    </h2>
                    <p className="flex items-center gap-2 text-sm text-neutral-600">
                      <ClockIcon className="size-3.5" />
                      {formatRelativeDate(idea.CreatedDttm)}
                    </p>
                  </div>
                  <p className="line-clamp-3 text-sm text-neutral-600">
                    {idea.Desc}
                  </p>

                  <ExperienceButton
                    variant="primary"
                    workshop={workshop}
                    className="w-28"
                  >
                    Sharpen
                  </ExperienceButton>
                </div>
              </li>
            ))}
      </ul>

      {!isPending && ideas.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-500">
          No ideas available for these filters.
        </p>
      )}
      <button
        className="fixed right-4 bottom-16 z-20 flex items-center justify-center gap-2 drop-shadow-sm disabled:opacity-70 sm:right-6"
        type="button"
        disabled={
          !selectedCategory || ideas.length === 0 || scoutIdeaMutation.isPending
        }
        aria-label="Scout Ideas"
        aria-busy={scoutIdeaMutation.isPending}
        onClick={() => void scoutIdeas()}
        title={
          selectedCategory
            ? ideas.length === 0
              ? "No visible ideas to scout"
              : undefined
            : "Select a pillar to use Scout"
        }
      >
        <img className="size-12 sm:size-20" src="/scout.svg" alt="scout" />
      </button>
    </section>
  )
}

function ScoutDialog({
  open,
  workshop,
  pillarTitle,
  suggestions,
  isPending,
  isError,
  onClose,
}: {
  open: boolean
  workshop: ParticipantWorkshop
  pillarTitle: string
  suggestions: string[]
  isPending: boolean
  isError: boolean
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const closeDialog = () => {
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="scout-dialog-title"
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none",
        "overflow-hidden border-0 bg-transparent p-0",
        "backdrop:bg-black/50",
        "sm:m-auto sm:h-fit sm:max-h-[calc(100dvh-2rem)]",
        "sm:w-[min(40rem,calc(100%-2rem))]"
      )}
      onClose={onClose}
    >
      <div
        className={cn(
          "flex h-full max-h-dvh min-h-0 flex-col overflow-hidden",
          "sm:h-auto sm:max-h-[calc(100dvh-2rem)]",
          "sm:rounded-lg sm:border sm:shadow-lg"
        )}
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          borderColor: workshop.card_primary_border_color,
          color: workshop.txt_primary_color,
        }}
      >
        {/* Header */}
        <header
          className={cn(
            "flex shrink-0 items-center justify-between gap-3",
            "border-b px-4 py-3 sm:px-6 sm:py-4"
          )}
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            borderColor: workshop.card_primary_border_color,
          }}
        >
          <div className={cn("min-w-0")}>
            <h2
              id="scout-dialog-title"
              className={cn(
                "text-lg font-semibold tracking-[-0.02em]",
                "sm:text-xl"
              )}
            >
              Scout Suggests
            </h2>

            <p
              className={cn("mt-0.5 text-xs", "sm:mt-1 sm:text-sm")}
              style={{
                color: workshop.txt_secondary_color,
              }}
            >
              Three fresh directions inspired by your team&apos;s ideas.
            </p>
          </div>

          <button
            type="button"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-md border",
              "transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2"
            )}
            style={{
              borderColor: workshop.card_primary_border_color,
              outlineColor: workshop.btn_primary_bg_color,
            }}
            aria-label="Close Scout suggestions"
            onClick={closeDialog}
          >
            <XIcon className={cn("size-4")} aria-hidden="true" />
          </button>
        </header>

        {/* Scrollable content */}
        <div
          className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain")}
        >
          <div
            className={cn("px-4 py-4", "sm:px-6 sm:py-6")}
            aria-busy={isPending}
          >
            <div
              className={cn("rounded-lg border p-4", "sm:p-5")}
              style={{
                backgroundColor: workshop.card_secondary_bg_color,
                borderColor: workshop.card_primary_border_color,
                color: workshop.card_secondary_txt_color,
              }}
            >
              <p
                className={cn(
                  "mb-4 text-xs font-semibold tracking-[0.14em] uppercase"
                )}
              >
                {pillarTitle}
              </p>

              {isPending ? (
                <div
                  className={cn("grid gap-5")}
                  aria-label="Loading suggestions"
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      className={cn("flex gap-3")}
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "h-4 w-4 shrink-0 animate-pulse rounded",
                          "bg-current opacity-10"
                        )}
                      />

                      <div className={cn("grid flex-1 gap-2")}>
                        <span
                          className={cn(
                            "h-3 w-full animate-pulse rounded",
                            "bg-current opacity-10"
                          )}
                        />

                        <span
                          className={cn(
                            "h-3 w-5/6 animate-pulse rounded",
                            "bg-current opacity-10"
                          )}
                        />

                        <span
                          className={cn(
                            "h-3 w-2/3 animate-pulse rounded",
                            "bg-current opacity-10"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <p className={cn("text-sm leading-6")}>
                  Scout couldn&apos;t generate suggestions. Close this dialog
                  and try again.
                </p>
              ) : (
                <ol
                  className={cn(
                    "grid list-decimal gap-4 pl-6 text-sm leading-6",
                    "sm:text-base sm:leading-7"
                  )}
                >
                  {suggestions.map((suggestion, index) => (
                    <li key={`${index}-${suggestion}`}>{suggestion}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className={cn("shrink-0 border-t px-4 py-3", "sm:px-6 sm:py-4")}
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            borderColor: workshop.card_primary_border_color,
          }}
        >
          <ExperienceButton
            variant="primary"
            workshop={workshop}
            className={cn("w-full")}
            onClick={closeDialog}
          >
            Back
          </ExperienceButton>
        </footer>
      </div>
    </dialog>
  )
}

function IdeaDialog({
  open,
  workshop,
  code,
  visitorId,
  teamId,
  categories,
  selectedCategoryId,
  idea,
  onClose,
}: {
  open: boolean
  workshop: ParticipantWorkshop
  code: string
  visitorId: string
  teamId: number
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

    if (open && !dialog.open) {
      dialog.showModal()
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idea-dialog-title"
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none",
        "overflow-hidden border-0 bg-transparent p-0",
        "backdrop:bg-black/50",
        "sm:m-auto sm:h-fit sm:max-h-[calc(100dvh-2rem)]",
        "sm:w-[min(40rem,calc(100%-2rem))]"
      )}
      onCancel={(event) => {
        if (saveIdeaMutation.isPending) {
          event.preventDefault()
        }
      }}
      onClose={closeDialog}
    >
      <form
        ref={formRef}
        className={cn(
          "flex h-full max-h-dvh min-h-0 flex-col overflow-hidden",
          "sm:h-auto sm:max-h-[calc(100dvh-2rem)]",
          "sm:rounded-lg sm:border sm:shadow-lg"
        )}
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          borderColor: workshop.card_primary_border_color,
          color: workshop.txt_primary_color,
        }}
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
        {/* Header */}
        <header
          className={cn(
            "flex shrink-0 items-center justify-between gap-3",
            "border-b px-4 py-3 sm:px-6 sm:py-4"
          )}
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            borderColor: workshop.card_primary_border_color,
          }}
        >
          <div className={cn("min-w-0")}>
            <h2
              id="idea-dialog-title"
              className={cn(
                "text-lg font-semibold tracking-[-0.02em]",
                "sm:text-xl"
              )}
            >
              {idea ? "Edit idea" : "Add an idea"}
            </h2>

            <p
              className={cn("mt-0.5 text-xs", "sm:mt-1 sm:text-sm")}
              style={{
                color: workshop.txt_secondary_color,
              }}
            >
              Pick a pillar. Write the boldest idea you can.
            </p>
          </div>

          <button
            type="button"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-md border",
              "transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
            style={{
              borderColor: workshop.card_primary_border_color,
              outlineColor: workshop.btn_primary_bg_color,
            }}
            aria-label="Close dialog"
            disabled={saveIdeaMutation.isPending}
            onClick={closeDialog}
          >
            <XIcon className={cn("size-4")} aria-hidden="true" />
          </button>
        </header>

        {/* Scrollable content */}
        <div
          className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain")}
        >
          <div
            className={cn("grid gap-4 px-4 py-4", "sm:gap-5 sm:px-6 sm:py-6")}
          >
            {/* Pillar */}
            <label className={cn("grid gap-1.5", "sm:gap-2")}>
              <span className={cn("text-sm font-medium")}>Pillar</span>

              <ExperienceSelect
                workshop={workshop}
                name="categoryId"
                required
                defaultValue={defaultCategoryId}
                disabled={saveIdeaMutation.isPending}
                className={cn("w-full")}
              >
                {categories.length === 0 && (
                  <ExperienceSelectOption value="">
                    No pillars available
                  </ExperienceSelectOption>
                )}

                {categories.map((category) => (
                  <ExperienceSelectOption key={category.ID} value={category.ID}>
                    {category.Name}
                  </ExperienceSelectOption>
                ))}
              </ExperienceSelect>
            </label>

            {/* Description */}
            <label className={cn("grid gap-1.5", "sm:gap-2")}>
              <span className={cn("text-sm font-medium")}>Description</span>

              <textarea
                name="description"
                required
                autoFocus
                rows={4}
                defaultValue={idea?.Desc ?? ""}
                disabled={saveIdeaMutation.isPending}
                placeholder="Describe the idea, the problem it solves, and its impact"
                className={cn(
                  "min-h-24 w-full resize-none rounded-md border",
                  "bg-transparent px-3 py-2 text-sm leading-6",
                  "transition-colors outline-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{
                  borderColor: workshop.card_primary_border_color,
                  outlineColor: workshop.btn_primary_bg_color,
                }}
              />
            </label>

            {/* Title */}
            <label className={cn("grid gap-1.5", "sm:gap-2")}>
              <div className={cn("flex items-center gap-2")}>
                <span className={cn("text-sm font-medium")}>Title</span>

                <span
                  className={cn("text-sm")}
                  style={{
                    color: workshop.txt_secondary_color,
                  }}
                >
                  (Optional)
                </span>
              </div>

              <input
                name="title"
                type="text"
                defaultValue={idea?.title ?? ""}
                disabled={saveIdeaMutation.isPending}
                placeholder="Give your idea a clear title"
                className={cn(
                  "h-10 w-full rounded-md border bg-transparent px-3",
                  "text-sm transition-colors outline-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{
                  borderColor: workshop.card_primary_border_color,
                  outlineColor: workshop.btn_primary_bg_color,
                }}
              />
            </label>

            {/* Context */}
            <label className={cn("grid gap-1.5", "sm:gap-2")}>
              <div className={cn("flex items-center gap-2")}>
                <span className={cn("text-sm font-medium")}>Context</span>

                <span
                  className={cn("text-sm")}
                  style={{
                    color: workshop.txt_secondary_color,
                  }}
                >
                  (Optional)
                </span>
              </div>

              <textarea
                name="context"
                rows={4}
                defaultValue={idea?.Context ?? ""}
                disabled={saveIdeaMutation.isPending}
                placeholder="Describe the context in which this idea will be used"
                className={cn(
                  "min-h-24 w-full resize-none rounded-md border",
                  "bg-transparent px-3 py-2 text-sm leading-6",
                  "transition-colors outline-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{
                  borderColor: workshop.card_primary_border_color,
                  outlineColor: workshop.btn_primary_bg_color,
                }}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <footer
          className={cn(
            "flex shrink-0 items-center justify-end gap-2",
            "border-t px-4 py-3",
            "sm:gap-3 sm:px-6 sm:py-4"
          )}
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            borderColor: workshop.card_primary_border_color,
          }}
        >
          <ExperienceButton
            type="button"
            variant="secondary"
            workshop={workshop}
            disabled={saveIdeaMutation.isPending}
            onClick={closeDialog}
          >
            Cancel
          </ExperienceButton>

          <ExperienceButton
            type="submit"
            variant="primary"
            workshop={workshop}
            disabled={saveIdeaMutation.isPending || categories.length === 0}
          >
            {saveIdeaMutation.isPending
              ? "Saving..."
              : idea
                ? "Save changes"
                : "Add idea"}
          </ExperienceButton>
        </footer>
      </form>
    </dialog>
  )
}
