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
  EyeIcon,
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
import { ExperienceStatsCard } from "@/components/experience/experience-stats-card"
import {
  getActivitiesOptions,
  getDashboardOptions,
  type WorkshopActivity,
} from "@/services/big-screen"
import { cn } from "@/lib/utils"
import { NewsroomStatsRows } from "@/components/experience/experience-stats-rows"
import { ExperienceFooter } from "@/components/experience/experience-footer"

type IdeaFilter = "all" | "shortlisted" | "sharpened"
type ParticipantScreen = "home" | "stage" | "newsroom"

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
  const [activeScreen, setActiveScreen] = useState<ParticipantScreen>("home")
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [ideaFilter, setIdeaFilter] = useState<IdeaFilter>("all")
  const [stageTeamId, setStageTeamId] = useState<number | null>(null)
  const [stageCategoryId, setStageCategoryId] = useState<number | null>(null)
  const isHome = activeScreen === "home"
  const isStage = activeScreen === "stage"

  const {
    data: activities = [],
    isPending: areActivitiesPending,
    isError: areActivitiesError,
    refetch: refetchActivities,
  } = useQuery({
    ...getActivitiesOptions({ code, type: null }),
    select: (response) => response.data,
  })

  const { data: ideas = [], isPending: areIdeasPending } = useQuery({
    ...getParticipantIdeasOptions({
      visitor_id: visitorId,
      workshop_code: code,
      category_id: isStage ? stageCategoryId : selectedCategoryId,
      team_id: isStage ? stageTeamId : selectedTeamId,
      is_shortlisted: isStage
        ? true
        : ideaFilter === "shortlisted"
          ? true
          : null,
      is_coached: !isStage && ideaFilter === "sharpened" ? true : null,
    }),
    enabled: isStage || (isHome && selectedTeamId !== null),
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

          <ul className="flex items-center gap-4 text-sm sm:gap-10 sm:text-base">
            <li>
              <button
                type="button"
                className="border-b-2 py-1 font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor:
                    activeScreen === "home" ? "currentColor" : "transparent",
                }}
                aria-current={activeScreen === "home" ? "page" : undefined}
                disabled={shouldShowWalkthrough}
                onClick={() => {
                  setActiveScreen("home")
                  setSelectedTeamId(null)
                }}
              >
                Home
              </button>
            </li>
            <li>
              <button
                type="button"
                className="border-b-2 py-1 font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor:
                    activeScreen === "stage" ? "currentColor" : "transparent",
                }}
                aria-current={activeScreen === "stage" ? "page" : undefined}
                disabled={shouldShowWalkthrough}
                onClick={() => setActiveScreen("stage")}
              >
                The Stage
              </button>
            </li>
            <li>
              <button
                type="button"
                className="border-b-2 py-1 font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor:
                    activeScreen === "newsroom"
                      ? "currentColor"
                      : "transparent",
                }}
                aria-current={activeScreen === "newsroom" ? "page" : undefined}
                disabled={shouldShowWalkthrough}
                onClick={() => setActiveScreen("newsroom")}
              >
                The Newsroom
              </button>
            </li>
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
        ) : activeScreen === "newsroom" ? (
          <NewsroomScreen
            workshop={workshop}
            code={code}
            activities={activities}
            areActivitiesPending={areActivitiesPending}
            areActivitiesError={areActivitiesError}
            onRetryActivities={() => void refetchActivities()}
          />
        ) : isStage ? (
          <StageScreen
            workshop={workshop}
            code={code}
            teams={workshop.teams}
            categories={workshop.category}
            ideas={ideas}
            selectedTeamId={stageTeamId}
            selectedCategoryId={stageCategoryId}
            isPending={areIdeasPending}
            onTeamChange={setStageTeamId}
            onCategoryChange={setStageCategoryId}
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
      <ExperienceFooter
        activities={activities}
        workshop={workshop}
        isError={areActivitiesError}
        isPending={areActivitiesPending}
      />
    </div>
  )
}

function NewsroomScreen({
  workshop,
  code,
  activities,
  areActivitiesPending,
  areActivitiesError,
  onRetryActivities,
}: {
  workshop: ParticipantWorkshop
  code: string
  activities: WorkshopActivity[]
  areActivitiesPending: boolean
  areActivitiesError: boolean
  onRetryActivities: () => void
}) {
  const {
    data: dashboard,
    isPending,
    isError,
    refetch,
  } = useQuery({
    ...getDashboardOptions(code),
    select: (response) => response.data,
  })

  const summary = [
    {
      label: "Drafts",
      value: dashboard?.overall.Draft ?? 0,
    },
    {
      label: "Shortlisted",
      value: dashboard?.overall.Shortlisted ?? 0,
    },
    {
      label: "Sharpened",
      value: dashboard?.overall.Sharpened ?? 0,
    },
    {
      label: "Total Ideas",
      value: dashboard?.overall.TotalIdeas ?? 0,
    },
  ]

  return (
    <section
      className="min-h-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{
        backgroundColor: workshop.page_bg_color,
        color: workshop.txt_primary_color,
      }}
    >
      <div className="container mx-auto w-full">
        {isPending ? (
          <div aria-label="Loading newsroom statistics" aria-busy="true">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="min-h-28 animate-pulse rounded-md bg-black/10"
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="mt-8 grid gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse border-b bg-black/5"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="grid min-h-64 place-content-center gap-4 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                Unable to load newsroom statistics
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: workshop.txt_secondary_color }}
              >
                Check the connection and try again.
              </p>
            </div>
            <ExperienceButton
              workshop={workshop}
              variant="secondary"
              onClick={() => void refetch()}
            >
              Try again
            </ExperienceButton>
          </div>
        ) : (
          <div className="grid gap-12">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {summary.map((stat) => (
                <ExperienceStatsCard
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  backgroundColor={workshop.header_bg_color}
                  color={workshop.header_txt_color}
                />
              ))}
            </div>
            <NewsroomStatsRows teams={dashboard?.teams ?? []} />

            <div className="grid gap-4">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                Latest Activity
              </h2>

              {areActivitiesPending ? (
                <div
                  className="grid gap-3"
                  aria-label="Loading latest activity"
                  aria-busy="true"
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-md bg-black/5"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              ) : areActivitiesError ? (
                <div
                  className="flex flex-col items-start gap-3 border px-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: workshop.card_primary_border_color }}
                >
                  <div>
                    <p className="font-semibold">Unable to load activity</p>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: workshop.txt_secondary_color }}
                    >
                      Check the connection and try again.
                    </p>
                  </div>
                  <ExperienceButton
                    workshop={workshop}
                    variant="secondary"
                    onClick={onRetryActivities}
                  >
                    Try again
                  </ExperienceButton>
                </div>
              ) : activities.length === 0 ? (
                <p
                  className="border px-4 py-6 text-sm"
                  style={{
                    borderColor: workshop.card_primary_border_color,
                    color: workshop.txt_secondary_color,
                  }}
                >
                  No activity yet.
                </p>
              ) : (
                <ul
                  className="divide-y border-y"
                  style={{
                    borderColor: workshop.card_primary_border_color,
                  }}
                >
                  {activities.map((activity) => (
                    <li
                      key={activity.ID}
                      className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      style={{
                        borderColor: workshop.card_primary_border_color,
                      }}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <BellIcon className="mt-1 size-5" aria-hidden="true" />
                        <div>
                          <strong className="capitalize">
                            {activity.Type ?? "Notification"}
                          </strong>
                          <p
                            className="text-sm"
                            style={{ color: workshop.txt_secondary_color }}
                          >
                            {activity.TeamName}: {activity.Message}
                          </p>
                        </div>
                      </div>
                      <time
                        className="flex items-center gap-1.5 text-xs whitespace-nowrap"
                        dateTime={activity.CreatedDttm}
                        style={{ color: workshop.txt_secondary_color }}
                      >
                        {formatRelativeDate(activity.CreatedDttm)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
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

  const toggleShortlist = async (idea: ParticipantIdea) => {
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
          : ideas.map((idea) => {
              const isGeneratingImage =
                generateIdeaImageMutation.isPending &&
                generateIdeaImageMutation.variables.idea_id === idea.ID
              const isShortlistPending =
                shortlistIdeaMutation.isPending &&
                shortlistIdeaMutation.variables.idea_id === idea.ID

              return (
                <IdeateIdeaCard
                  key={idea.ID}
                  idea={idea}
                  workshop={workshop}
                  isGeneratingImage={isGeneratingImage}
                  isImageActionPending={generateIdeaImageMutation.isPending}
                  isShortlistPending={isShortlistPending}
                  onGenerateImage={() => void generateIdeaImage(idea)}
                  onToggleShortlist={() => void toggleShortlist(idea)}
                  onEdit={() => {
                    setEditingIdea(idea)
                    setIsAddIdeaOpen(true)
                  }}
                />
              )
            })}
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

function IdeateIdeaCard({
  idea,
  workshop,
  isGeneratingImage,
  isImageActionPending,
  isShortlistPending,
  onGenerateImage,
  onToggleShortlist,
  onEdit,
}: {
  idea: ParticipantIdea
  workshop: ParticipantWorkshop
  isGeneratingImage: boolean
  isImageActionPending: boolean
  isShortlistPending: boolean
  onGenerateImage: () => void
  onToggleShortlist: () => void
  onEdit: () => void
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs">
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
              aria-busy={isGeneratingImage}
              disabled={isImageActionPending}
              onClick={onGenerateImage}
            >
              <RefreshCwIcon
                className={cn("size-4", isGeneratingImage && "animate-spin")}
                aria-hidden="true"
              />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400 disabled:cursor-wait disabled:opacity-50"
            aria-label={`Generate an image for ${idea.title || "idea"}`}
            aria-busy={isGeneratingImage}
            disabled={isImageActionPending}
            onClick={onGenerateImage}
          >
            <ImagePlusIcon className="size-9" aria-hidden="true" />
            <span>
              {isGeneratingImage
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
              disabled={isShortlistPending}
              className="disabled:cursor-wait disabled:opacity-50"
              onClick={onToggleShortlist}
            >
              <StarIcon
                className="size-5"
                fill={idea.flgTeam ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
            {idea.flgSelf && (
              <button type="button" onClick={onEdit}>
                <SquarePenIcon className="size-5" aria-hidden="true" />
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
        <p className="line-clamp-3 text-sm text-neutral-600">{idea.Desc}</p>

        <ExperienceButton
          variant="primary"
          workshop={workshop}
          className="w-28"
        >
          Sharpen
        </ExperienceButton>
      </div>
    </li>
  )
}

function StageScreen({
  workshop,
  code,
  teams,
  categories,
  ideas,
  selectedTeamId,
  selectedCategoryId,
  isPending,
  onTeamChange,
  onCategoryChange,
}: {
  workshop: ParticipantWorkshop
  code: string
  teams: ParticipantWorkshop["teams"]
  categories: ParticipantWorkshop["category"]
  ideas: ParticipantIdea[]
  selectedTeamId: number | null
  selectedCategoryId: number | null
  isPending: boolean
  onTeamChange: (teamId: number | null) => void
  onCategoryChange: (categoryId: number | null) => void
}) {
  const [previewIdea, setPreviewIdea] = useState<ParticipantIdea | null>(null)
  const queryClient = useQueryClient()
  const shortlistIdeaMutation = useShortlistIdea()

  const removeFromShortlist = async (idea: ParticipantIdea) => {
    try {
      await shortlistIdeaMutation.mutateAsync({
        workshop_code: code,
        idea_id: idea.ID,
        flag: false,
      })

      await queryClient.invalidateQueries({
        queryKey: ["PARTICIPANT_IDEAS"],
      })
    } catch {
      return
    }
  }

  return (
    <section className="container mx-auto w-full p-4 sm:p-6 lg:p-8">
      {previewIdea && (
        <IdeaPreviewDialog
          idea={previewIdea}
          workshop={workshop}
          open
          onClose={() => setPreviewIdea(null)}
        />
      )}

      <div className="mb-6 flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        <label>
          <span className="sr-only">Team</span>
          <ExperienceSelect
            workshop={workshop}
            value={selectedTeamId ?? "all"}
            onChange={(event) =>
              onTeamChange(
                event.target.value === "all" ? null : Number(event.target.value)
              )
            }
            className="w-full sm:w-auto"
          >
            <ExperienceSelectOption value="all">
              All teams
            </ExperienceSelectOption>
            {teams.map((team) => (
              <ExperienceSelectOption key={team.ID} value={team.ID}>
                {team.TeamName}
              </ExperienceSelectOption>
            ))}
          </ExperienceSelect>
        </label>

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
            className="w-full sm:w-auto"
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
      </div>

      <ul
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy={isPending}
      >
        {isPending
          ? Array.from({ length: 4 }, (_, index) => (
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
              <StageIdeaCard
                key={idea.ID}
                idea={idea}
                workshop={workshop}
                isShortlistPending={shortlistIdeaMutation.isPending}
                onRemoveFromShortlist={() => void removeFromShortlist(idea)}
                onPreview={() => setPreviewIdea(idea)}
              />
            ))}
      </ul>

      {!isPending && ideas.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-500">
          No shortlisted ideas match the selected filters.
        </p>
      )}
    </section>
  )
}

function StageIdeaCard({
  idea,
  workshop,
  isShortlistPending,
  onRemoveFromShortlist,
  onPreview,
}: {
  idea: ParticipantIdea
  workshop: ParticipantWorkshop
  isShortlistPending: boolean
  onRemoveFromShortlist: () => void
  onPreview: () => void
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs">
      <div className="aspect-4/3 w-full overflow-hidden bg-neutral-100">
        {idea.imageFileName?.trim() ? (
          <img
            src={idea.imageFileName}
            alt={idea.title || "Idea"}
            className="size-full object-contain"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-neutral-400">
            <ImagePlusIcon className="size-9" aria-hidden="true" />
            <span>No image available</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={`Remove ${idea.title || "idea"} from shortlist`}
            aria-pressed="true"
            disabled={isShortlistPending}
            className="disabled:cursor-wait disabled:opacity-50"
            onClick={onRemoveFromShortlist}
          >
            <StarIcon
              className="size-5"
              fill="currentColor"
              aria-hidden="true"
            />
          </button>
          {idea.flgCoach && (
            <SparklesIcon className="size-5" aria-hidden="true" />
          )}
        </div>

        <div>
          <h2 className="text-xl leading-tight font-semibold">
            {idea.title || "Untitled"}
          </h2>
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <ClockIcon className="size-3.5" aria-hidden="true" />
            {formatRelativeDate(idea.CreatedDttm)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1">
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="rounded-full border px-2.5 py-1">
            {idea.Category || "Unknown pillar"}
          </span>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-600">{idea.Desc}</p>

        <ExperienceButton
          variant="primary"
          workshop={workshop}
          className="mt-auto flex w-28 items-center justify-center gap-2"
          onClick={onPreview}
        >
          <EyeIcon className="size-4" aria-hidden="true" />
          View
        </ExperienceButton>
      </div>
    </li>
  )
}

function IdeaPreviewDialog({
  idea,
  workshop,
  open,
  onClose,
}: {
  idea: ParticipantIdea
  workshop: ParticipantWorkshop
  open: boolean
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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idea-preview-title"
      aria-describedby="idea-preview-description"
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none",
        "overflow-hidden border-0 bg-transparent p-0 backdrop:bg-black/50",
        "sm:m-auto sm:h-fit sm:max-h-[calc(100dvh-2rem)]",
        "sm:w-[min(48rem,calc(100%-2rem))]"
      )}
      onClose={onClose}
    >
      <div
        className={cn(
          "flex h-full max-h-dvh min-h-0 flex-col overflow-hidden",
          "sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg sm:border sm:shadow-lg"
        )}
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          borderColor: workshop.card_primary_border_color,
          color: workshop.txt_primary_color,
        }}
      >
        <header
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:px-6 sm:py-4"
          style={{ borderColor: workshop.card_primary_border_color }}
        >
          <div className="min-w-0">
            <h2
              id="idea-preview-title"
              className="text-xl leading-tight font-semibold tracking-[-0.02em]"
            >
              {idea.title || "Untitled"}
            </h2>
            <p
              id="idea-preview-description"
              className="mt-1 text-sm"
              style={{ color: workshop.txt_secondary_color }}
            >
              Full idea submission from {idea.TeamName || "Unknown team"}.
            </p>
          </div>

          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: workshop.card_primary_border_color,
              outlineColor: workshop.btn_primary_bg_color,
            }}
            aria-label="Close idea preview"
            onClick={() => dialogRef.current?.close()}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
            <div
              className="aspect-4/3 overflow-hidden border bg-neutral-100"
              style={{ borderColor: workshop.card_primary_border_color }}
            >
              {idea.imageFileName?.trim() ? (
                <img
                  src={idea.imageFileName}
                  alt={idea.title || "Idea"}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-neutral-400">
                  <ImagePlusIcon className="size-9" aria-hidden="true" />
                  <span>No image available</span>
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-900">
                  {idea.TeamName || "Unknown team"}
                </span>
                <span
                  className="rounded-full border px-2.5 py-1"
                  style={{ borderColor: workshop.card_primary_border_color }}
                >
                  {idea.Category || "Unknown pillar"}
                </span>
                <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-white">
                  Shortlisted
                </span>
              </div>

              <div>
                <p className="font-medium">Submitted</p>
                <p
                  className="mt-1"
                  style={{ color: workshop.txt_secondary_color }}
                >
                  {formatRelativeDate(idea.CreatedDttm)}
                </p>
              </div>

              <div>
                <p className="font-medium">Description</p>
                <p
                  className="mt-1 text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: workshop.txt_secondary_color }}
                >
                  {idea.Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
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
