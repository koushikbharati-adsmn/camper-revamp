import { getVisitorId } from "@/lib/fingerprint"
import { toast } from "@/components/ui/toast"
import {
  type GenerateIdeaImagePayload,
  type IdeaImageSocketPayload,
  type IdeaShortlistSocketPayload,
  type IdeaUpsertSocketPayload,
  type ParticipantIdea,
  type ParticipantWorkshop,
  type ShortlistIdeaPayload,
  getParticipantIdeasOptions,
  getParticipantWorkshopOptions,
  participantIdeaMutationKeys,
  useGenerateIdeaImage,
  useSaveIdea,
  useScoutIdea,
  useShortlistIdea,
} from "@/services/participants"
import {
  queryOptions,
  useMutationState,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  createContext,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  FullscreenIcon,
  ImagePlusIcon,
  PlusIcon,
  RefreshCwIcon,
  ShapesIcon,
  SparklesIcon,
  SquarePenIcon,
  StarIcon,
  UsersIcon,
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
} from "@/services/big-screen"
import { cn } from "@/lib/utils"
import { NewsroomStatsRows } from "@/components/experience/experience-stats-rows"
import { ExperienceFooter } from "@/components/experience/experience-footer"
import { SharpenDialog } from "@/components/experience/sharpen-dialog"
// import { invalidateParticipantChatSessions } from "@/services/participant-chat"
import { socket } from "@/lib/socket"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type IdeaStatusFilter = "all" | "shortlisted" | "sharpened"

type ParticipantView = "home" | "stage" | "newsroom"

type ParticipantExperienceContextValue = {
  workshopCode: string
  visitorId: string
  workshop: ParticipantWorkshop
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const IDEA_FILTER_OPTIONS = [
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
] satisfies Array<{
  value: IdeaStatusFilter
  label: string
}>

const visitorIdOptions = queryOptions({
  queryKey: ["PARTICIPANT_VISITOR_ID"],
  queryFn: getVisitorId,
  staleTime: Infinity,
})

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const ParticipantExperienceContext =
  createContext<ParticipantExperienceContextValue | null>(null)

function ParticipantExperienceProvider({
  workshopCode,
  visitorId,
  workshop,
  children,
}: ParticipantExperienceContextValue & {
  children: ReactNode
}) {
  const value = useMemo(
    () => ({
      workshopCode,
      visitorId,
      workshop,
    }),
    [visitorId, workshop, workshopCode]
  )

  return (
    <ParticipantExperienceContext.Provider value={value}>
      {children}
    </ParticipantExperienceContext.Provider>
  )
}

function useParticipantExperience() {
  const context = useContext(ParticipantExperienceContext)

  if (!context) {
    throw new Error(
      "useParticipantExperience must be used within ParticipantExperienceProvider"
    )
  }

  return context
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function parseOptionalId(value: string) {
  return value === "all" ? null : Number(value)
}

/* -------------------------------------------------------------------------- */
/* Shared hooks                                                               */
/* -------------------------------------------------------------------------- */

function useNativeDialog(open: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return dialogRef
}

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

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
    <ParticipantExperienceProvider
      workshopCode={code}
      visitorId={visitorId}
      workshop={workshop}
    >
      <ParticipantExperience key={workshop.ID} />
    </ParticipantExperienceProvider>
  )
}

/* -------------------------------------------------------------------------- */
/* Participant experience                                                     */
/* -------------------------------------------------------------------------- */

function ParticipantExperience() {
  const { workshop, workshopCode, visitorId } = useParticipantExperience()
  const queryClient = useQueryClient()

  const walkthroughSteps = useMemo(
    () =>
      [...workshop.walkThrough].sort(
        (first, second) => first.DisplayOrder - second.DisplayOrder
      ),
    [workshop.walkThrough]
  )

  const walkthroughStorageKey = `participant-walkthrough-completed:${visitorId}:${workshopCode}`

  const [isWalkthroughActive, setIsWalkthroughActive] = useState(() => {
    if (walkthroughSteps.length === 0) return false

    try {
      return sessionStorage.getItem(walkthroughStorageKey) !== "true"
    } catch {
      return true
    }
  })

  const [activeView, setActiveView] = useState<ParticipantView>("home")

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  useEffect(() => {
    const joinWorkshopRoom = () => {
      socket.emit("join_room", { roomId: workshopCode })
    }

    socket.on("connect", joinWorkshopRoom)

    if (socket.connected) {
      joinWorkshopRoom()
    }

    return () => {
      socket.off("connect", joinWorkshopRoom)
    }
  }, [queryClient, workshopCode])

  const {
    data: activities = [],
    isPending: isActivitiesPending,
    isError: isActivitiesError,
  } = useQuery({
    ...getActivitiesOptions({
      code: workshopCode,
      type: null,
    }),
    select: (response) => response.data,
  })

  const handleWalkthroughComplete = () => {
    try {
      sessionStorage.setItem(walkthroughStorageKey, "true")
    } catch {
      // Continue for the current page load when browser storage is unavailable.
    }

    setIsWalkthroughActive(false)
  }

  const handleNavigateHome = () => {
    setActiveView("home")
  }

  const handleNavigateStage = () => {
    setActiveView("stage")
  }

  const handleNavigateNewsroom = () => {
    setActiveView("newsroom")
  }

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeamId(teamId)
  }

  const handleChangeTeam = (teamId: number) => {
    setSelectedTeamId(teamId)
  }

  const renderCurrentView = () => {
    if (isWalkthroughActive) {
      return (
        <WalkthroughScreen
          key={workshop.ID}
          steps={walkthroughSteps}
          onComplete={handleWalkthroughComplete}
        />
      )
    }

    if (activeView === "newsroom") {
      return <NewsroomScreen />
    }

    if (activeView === "stage") {
      return <StageScreen />
    }

    if (selectedTeamId !== null) {
      return (
        <IdeasScreen
          selectedTeamId={selectedTeamId}
          onTeamChange={handleChangeTeam}
        />
      )
    }

    return (
      <TeamsScreen teams={workshop.teams} onSelectTeam={handleSelectTeam} />
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      <ParticipantNavigation
        activeView={activeView}
        isDisabled={isWalkthroughActive}
        onNavigateHome={handleNavigateHome}
        onNavigateStage={handleNavigateStage}
        onNavigateNewsroom={handleNavigateNewsroom}
      />

      <main className="flex-1 overflow-y-auto">{renderCurrentView()}</main>

      <ExperienceFooter
        activities={activities}
        workshop={workshop}
        isError={isActivitiesError}
        isPending={isActivitiesPending}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function ParticipantNavigation({
  activeView,
  isDisabled,
  onNavigateHome,
  onNavigateStage,
  onNavigateNewsroom,
}: {
  activeView: ParticipantView
  isDisabled: boolean
  onNavigateHome: () => void
  onNavigateStage: () => void
  onNavigateNewsroom: () => void
}) {
  const { workshop } = useParticipantExperience()

  return (
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
                  activeView === "home" ? "currentColor" : "transparent",
              }}
              aria-current={activeView === "home" ? "page" : undefined}
              disabled={isDisabled}
              onClick={onNavigateHome}
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
                  activeView === "stage" ? "currentColor" : "transparent",
              }}
              aria-current={activeView === "stage" ? "page" : undefined}
              disabled={isDisabled}
              onClick={onNavigateStage}
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
                  activeView === "newsroom" ? "currentColor" : "transparent",
              }}
              aria-current={activeView === "newsroom" ? "page" : undefined}
              disabled={isDisabled}
              onClick={onNavigateNewsroom}
            >
              The Newsroom
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Newsroom                                                                   */
/* -------------------------------------------------------------------------- */

function NewsroomScreen() {
  const { workshop, workshopCode } = useParticipantExperience()

  const {
    data: dashboard,
    isPending: isDashboardPending,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    ...getDashboardOptions(workshopCode),
    select: (response) => response.data,
  })

  const {
    data: activities = [],
    isPending: isActivitiesPending,
    isError: isActivitiesError,
    refetch: refetchActivities,
  } = useQuery({
    ...getActivitiesOptions({
      code: workshopCode,
      type: null,
    }),
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

  const handleRetryDashboard = () => {
    void refetchDashboard()
  }

  const handleRetryActivities = () => {
    void refetchActivities()
  }

  return (
    <section className="min-h-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="container mx-auto w-full">
        {isDashboardPending ? (
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
        ) : isDashboardError ? (
          <div className="grid min-h-64 place-content-center gap-4 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                Unable to load newsroom statistics
              </h2>

              <p
                className="mt-1 text-sm"
                style={{
                  color: workshop.txt_secondary_color,
                }}
              >
                Check the connection and try again.
              </p>
            </div>

            <ExperienceButton
              workshop={workshop}
              variant="secondary"
              onClick={handleRetryDashboard}
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

              {isActivitiesPending ? (
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
              ) : isActivitiesError ? (
                <div
                  className="flex flex-col items-start gap-3 border px-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    borderColor: workshop.card_primary_border_color,
                  }}
                >
                  <div>
                    <p className="font-semibold">Unable to load activity</p>

                    <p
                      className="mt-1 text-sm"
                      style={{
                        color: workshop.txt_secondary_color,
                      }}
                    >
                      Check the connection and try again.
                    </p>
                  </div>

                  <ExperienceButton
                    workshop={workshop}
                    variant="secondary"
                    onClick={handleRetryActivities}
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
                            style={{
                              color: workshop.txt_secondary_color,
                            }}
                          >
                            {activity.TeamName}: {activity.Message}
                          </p>
                        </div>
                      </div>

                      <time
                        className="flex items-center gap-1.5 text-xs whitespace-nowrap"
                        dateTime={activity.CreatedDttm}
                        style={{
                          color: workshop.txt_secondary_color,
                        }}
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

/* -------------------------------------------------------------------------- */
/* Walkthrough                                                                */
/* -------------------------------------------------------------------------- */

function WalkthroughScreen({
  steps,
  onComplete,
}: {
  steps: ParticipantWorkshop["walkThrough"]
  onComplete: () => void
}) {
  const { workshop } = useParticipantExperience()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const currentStep = steps[currentStepIndex]

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handlePreviousStep = () => {
    setCurrentStepIndex((index) => index - 1)
  }

  const handleNextStep = () => {
    if (isLastStep) {
      onComplete()
      return
    }

    setCurrentStepIndex((index) => index + 1)
  }

  if (!currentStep) return null

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
          style={{
            borderColor: workshop.card_primary_border_color,
          }}
          role="progressbar"
          aria-label="Walkthrough progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={currentStepIndex + 1}
          aria-valuetext={`Step ${currentStepIndex + 1} of ${steps.length}`}
        >
          <div className="flex gap-2 px-6 pt-4 sm:gap-3 sm:px-10 sm:pt-6">
            {steps.map((step, index) => (
              <div key={step.ID} className="min-w-0 flex-1" aria-hidden="true">
                <p
                  className="mb-3 truncate text-center text-xs font-semibold tracking-wide uppercase"
                  style={{
                    color:
                      index === currentStepIndex
                        ? workshop.txt_primary_color
                        : workshop.txt_secondary_color,
                  }}
                >
                  <span className="sm:hidden">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="hidden sm:inline">{step.Title}</span>
                </p>

                <span
                  className="block h-1 rounded-full"
                  style={{
                    backgroundColor:
                      index <= currentStepIndex
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
            {currentStep.Title}
          </h1>

          <p
            className="mt-6 max-w-3xl text-base leading-7 whitespace-pre-line sm:mt-8 sm:text-xl sm:leading-8"
            style={{
              color: workshop.txt_secondary_color,
            }}
          >
            {currentStep.Description}
          </p>
        </div>

        <div
          className="flex min-h-16 items-center justify-end gap-3 border-t px-6 sm:px-10"
          style={{
            borderColor: workshop.card_primary_border_color,
          }}
        >
          {!isFirstStep && (
            <ExperienceButton
              variant="secondary"
              workshop={workshop}
              onClick={handlePreviousStep}
            >
              Previous
            </ExperienceButton>
          )}

          <ExperienceButton
            variant="primary"
            workshop={workshop}
            onClick={handleNextStep}
          >
            {isLastStep ? "Begin" : "Next"}
          </ExperienceButton>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Teams                                                                      */
/* -------------------------------------------------------------------------- */

function TeamsScreen({
  teams,
  onSelectTeam,
}: {
  teams: ParticipantWorkshop["teams"]
  onSelectTeam: (teamId: number) => void
}) {
  const { workshop } = useParticipantExperience()
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

  const handlePreviousTeam = () => {
    emblaApi?.scrollPrev()
  }

  const handleNextTeam = () => {
    emblaApi?.scrollNext()
  }

  const handleSelectCarouselItem = (index: number) => {
    emblaApi?.scrollTo(index)
  }

  const handleSelectTeam = (teamId: number) => {
    onSelectTeam(teamId)
  }

  if (teams.length === 0) {
    return <p className="p-4 sm:p-6">No teams available.</p>
  }

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
                      className={cn(
                        "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-left shadow-xs transition-[transform,opacity] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4",
                        isSelected
                          ? "scale-100 opacity-100 sm:scale-105"
                          : "scale-[0.90] opacity-55"
                      )}
                      onClick={() => handleSelectTeam(team.ID)}
                      style={{
                        borderColor: workshop.card_primary_border_color,
                      }}
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
                className="absolute top-1/2 left-2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 sm:-left-16"
                aria-label="Previous team"
                onClick={handlePreviousTeam}
                style={{
                  borderColor: workshop.btn_secondary_border_color,
                }}
              >
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="absolute top-1/2 right-2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 sm:-right-16"
                aria-label="Next team"
                onClick={handleNextTeam}
                style={{
                  borderColor: workshop.btn_secondary_border_color,
                }}
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
                  className={cn(
                    "size-2.5 rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-offset-4",
                    index === selectedIndex
                      ? "scale-135 bg-neutral-900"
                      : "bg-neutral-300"
                  )}
                  aria-label={`Go to ${team.TeamName}`}
                  aria-current={index === selectedIndex ? "true" : undefined}
                  onClick={() => handleSelectCarouselItem(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Ideas                                                                      */
/* -------------------------------------------------------------------------- */

function IdeasScreen({
  selectedTeamId,
  onTeamChange,
}: {
  selectedTeamId: number
  onTeamChange: (teamId: number) => void
}) {
  const queryClient = useQueryClient()
  const { workshop, workshopCode, visitorId } = useParticipantExperience()

  const teams = workshop.teams
  const pillars = workshop.category

  const [selectedPillarId, setSelectedPillarId] = useState<number | null>(null)

  const [ideaStatusFilter, setIdeaStatusFilter] =
    useState<IdeaStatusFilter>("all")

  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false)

  const [isScoutDialogOpen, setIsScoutDialogOpen] = useState(false)

  const [editingIdea, setEditingIdea] = useState<ParticipantIdea | null>(null)

  const [sharpeningIdea, setSharpeningIdea] = useState<ParticipantIdea | null>(
    null
  )

  const [fullscreenIdeaId, setFullscreenIdeaId] = useState<number | null>(null)

  const selectedPillar = pillars.find(
    (pillar) => pillar.ID === selectedPillarId
  )

  const ideasQueryOptions = getParticipantIdeasOptions({
    visitor_id: visitorId,
    workshop_code: workshopCode,
    team_id: selectedTeamId,
    category_id: selectedPillarId,
    is_shortlisted: ideaStatusFilter === "shortlisted" ? true : null,
    is_coached: ideaStatusFilter === "sharpened" ? true : null,
  })

  const { data: ideas = [], isPending: isIdeasPending } = useQuery({
    ...ideasQueryOptions,
    select: (response) => response.data,
  })

  useEffect(() => {
    const handleIdeaUpserted = ({
      roomId,
      idea: socketIdea,
    }: IdeaUpsertSocketPayload) => {
      if (roomId !== workshopCode) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData

        const existingIdea = oldData.data.find(
          (idea) => idea.ID === socketIdea.ideaId
        )

        // UPDATE
        if (existingIdea) {
          return {
            ...oldData,
            data: oldData.data.map((idea) =>
              idea.ID === socketIdea.ideaId
                ? {
                    ...idea,
                    CategoryID: socketIdea.categoryId,
                    CategoryName: socketIdea.categoryName,
                    Desc: socketIdea.desc,
                    title: socketIdea.title,
                    Context: socketIdea.context,
                  }
                : idea
            ),
          }
        }

        // ADD
        if (socketIdea.teamId !== selectedTeamId) {
          return oldData
        }

        if (
          selectedPillarId !== null &&
          socketIdea.categoryId !== selectedPillarId
        ) {
          return oldData
        }

        if (ideaStatusFilter !== "all") {
          return oldData
        }

        const team = teams.find((team) => team.ID === socketIdea.teamId)

        const newIdea: ParticipantIdea = {
          ID: socketIdea.ideaId,
          TeamID: socketIdea.teamId,
          TeamName: team?.TeamName ?? "",
          CategoryID: socketIdea.categoryId,
          CategoryName: socketIdea.categoryName,
          Desc: socketIdea.desc,
          title: socketIdea.title,
          Context: socketIdea.context,
          imageFileName: "",
          flgSelf: false,
          flgTeam: false,
          flgCoach: false,
          CreatedDttm: new Date().toISOString(),
        }

        return {
          ...oldData,
          data: [...oldData.data, newIdea],
        }
      })
    }

    const handleIdeaShortlistUpdated = ({
      roomId,
      isShortlisted,
      idea: socketIdea,
    }: IdeaShortlistSocketPayload) => {
      if (roomId !== workshopCode) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData

        const exists = oldData.data.some((idea) => idea.ID === socketIdea.ID)

        const matchesFilters =
          socketIdea.TeamID === selectedTeamId &&
          (selectedPillarId === null ||
            socketIdea.CategoryID === selectedPillarId) &&
          (ideaStatusFilter !== "shortlisted" || isShortlisted) &&
          (ideaStatusFilter !== "sharpened" || socketIdea.flgCoach)

        // Remove if it no longer belongs in this query
        if (!matchesFilters) {
          if (!exists) return oldData

          return {
            ...oldData,
            data: oldData.data.filter((idea) => idea.ID !== socketIdea.ID),
          }
        }

        // Update existing idea
        if (exists) {
          return {
            ...oldData,
            data: oldData.data.map((idea) =>
              idea.ID === socketIdea.ID
                ? {
                    ...idea,
                    flgTeam: isShortlisted,
                  }
                : idea
            ),
          }
        }

        // Add missing idea if it now belongs in this query
        return {
          ...oldData,
          data: [
            ...oldData.data,
            {
              ...socketIdea,
              flgTeam: isShortlisted,
            },
          ],
        }
      })
    }

    const handleIdeaImageGenerated = ({
      roomId,
      ideaId,
      imageUrl,
    }: IdeaImageSocketPayload) => {
      if (roomId !== workshopCode) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData

        return {
          ...oldData,
          data: oldData.data.map((idea) =>
            idea.ID === ideaId
              ? {
                  ...idea,
                  imageFileName: imageUrl,
                }
              : idea
          ),
        }
      })
    }

    socket.on("idea_upserted", handleIdeaUpserted)
    socket.on("idea_shortlist_updated", handleIdeaShortlistUpdated)
    socket.on("idea_image_generated", handleIdeaImageGenerated)

    return () => {
      socket.off("idea_upserted", handleIdeaUpserted)
      socket.off("idea_shortlist_updated", handleIdeaShortlistUpdated)
      socket.off("idea_image_generated", handleIdeaImageGenerated)
    }
  }, [
    workshopCode,
    selectedTeamId,
    selectedPillarId,
    ideaStatusFilter,
    teams,
    queryClient,
    ideasQueryOptions.queryKey,
  ])

  const generateIdeaImageMutation = useGenerateIdeaImage()
  const shortlistIdeaMutation = useShortlistIdea()
  const scoutIdeaMutation = useScoutIdea()

  const fullscreenIdea =
    fullscreenIdeaId === null
      ? null
      : (ideas.find((idea) => idea.ID === fullscreenIdeaId) ?? null)

  const pendingImageIdeaIds = useMutationState<number>({
    filters: {
      mutationKey: participantIdeaMutationKeys.generateImage,
      status: "pending",
    },
    select: (mutation) =>
      (mutation.state.variables as GenerateIdeaImagePayload).idea_id,
  })

  const pendingShortlistIdeaIds = useMutationState<number>({
    filters: {
      mutationKey: participantIdeaMutationKeys.shortlist,
      status: "pending",
    },
    select: (mutation) =>
      (mutation.state.variables as ShortlistIdeaPayload).idea_id,
  })

  const handleOpenNewIdeaDialog = () => {
    setEditingIdea(null)
    setIsIdeaDialogOpen(true)
  }

  const handleEditIdea = (idea: ParticipantIdea) => {
    setEditingIdea(idea)
    setIsIdeaDialogOpen(true)
  }

  const handleCloseIdeaDialog = () => {
    setIsIdeaDialogOpen(false)
    setEditingIdea(null)
  }

  const handleOpenSharpenDialog = (idea: ParticipantIdea) => {
    setSharpeningIdea(idea)
  }

  const handleCloseSharpenDialog = () => {
    setSharpeningIdea(null)
  }

  const handleEditSharpeningIdea = () => {
    if (!sharpeningIdea) return

    const idea = sharpeningIdea

    setSharpeningIdea(null)
    handleEditIdea(idea)
  }

  // const handleIdeaSaved = ({
  //   ideaId,
  //   invalidateChats,
  // }: {
  //   ideaId: number
  //   invalidateChats: boolean
  // }) => {
  //   if (!invalidateChats) return

  //   void invalidateParticipantChatSessions({
  //     visitorId,
  //     workshopCode,
  //     ideaId,
  //   }).then(({ failedCount, storageFailed }) => {
  //     if (failedCount === 0 && !storageFailed) return
  //   })
  // }

  const handleTeamSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onTeamChange(Number(event.target.value))
  }

  const handlePillarSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedPillarId(parseOptionalId(event.target.value))
  }

  const handleIdeaStatusFilterChange = (filter: IdeaStatusFilter) => {
    setIdeaStatusFilter(filter)
  }

  const handleGenerateIdeaImage = (idea: ParticipantIdea) => {
    const pillar = pillars.find((item) => item.ID === idea.CategoryID)

    generateIdeaImageMutation.mutate({
      idea_id: idea.ID,
      workshop_code: workshopCode,
      pillar_context: pillar?.Context ?? "",
      workshop_context: workshop.WorkshopContext,
      user_idea: idea.Desc,
      brand_guidelines: workshop.GuidelineFileName,
    })
  }

  const handleToggleShortlist = (idea: ParticipantIdea) => {
    shortlistIdeaMutation.mutate({
      workshop_code: workshopCode,
      idea_id: idea.ID,
      flag: !idea.flgTeam,
      idea,
    })
  }

  const handleScoutIdeas = () => {
    if (!selectedPillar || ideas.length === 0) return

    scoutIdeaMutation.reset()
    setIsScoutDialogOpen(true)

    scoutIdeaMutation.mutate({
      workshop_code: workshopCode,
      pillar_title: selectedPillar.Name,
      user_ideas: ideas.map((idea) => idea.Desc),
    })
  }

  const handleCloseScoutDialog = () => {
    setIsScoutDialogOpen(false)
  }

  const handleOpenFullscreenImage = (idea: ParticipantIdea) => {
    setFullscreenIdeaId(idea.ID)
  }

  const handleCloseFullscreenImage = () => {
    setFullscreenIdeaId(null)
  }

  return (
    <section className="container mx-auto w-full p-4 sm:p-6 lg:p-8">
      <IdeaDialog
        key={editingIdea?.ID ?? "new"}
        open={isIdeaDialogOpen}
        teamId={selectedTeamId}
        idea={editingIdea}
        onClose={handleCloseIdeaDialog}
        // onSaved={handleIdeaSaved}
      />

      <ScoutDialog
        open={isScoutDialogOpen}
        pillarTitle={selectedPillar?.Name ?? ""}
        suggestions={scoutIdeaMutation.data?.data.text ?? []}
        isPending={scoutIdeaMutation.isPending}
        isError={scoutIdeaMutation.isError}
        onClose={handleCloseScoutDialog}
      />

      {sharpeningIdea && (
        <SharpenDialog
          key={sharpeningIdea.ID}
          open
          idea={sharpeningIdea}
          coaches={workshop.coaches}
          workshop={workshop}
          visitorId={visitorId}
          workshopCode={workshopCode}
          onClose={handleCloseSharpenDialog}
          onEditIdea={handleEditSharpeningIdea}
        />
      )}

      {fullscreenIdea && (
        <IdeaImageFullscreenDialog
          idea={fullscreenIdea}
          open
          onClose={handleCloseFullscreenImage}
        />
      )}

      <div className="mb-6 flex flex-col items-stretch justify-end gap-3 lg:flex-row lg:items-center">
        <label>
          <span className="sr-only">Team</span>

          <ExperienceSelect
            workshop={workshop}
            value={selectedTeamId}
            onChange={handleTeamSelectChange}
            className="w-full lg:w-auto"
          >
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
            value={selectedPillarId ?? "all"}
            onChange={handlePillarSelectChange}
            className="w-full lg:w-auto"
          >
            <ExperienceSelectOption value="all">
              All pillars
            </ExperienceSelectOption>

            {pillars.map((pillar) => (
              <ExperienceSelectOption key={pillar.ID} value={pillar.ID}>
                {pillar.Name}
              </ExperienceSelectOption>
            ))}
          </ExperienceSelect>
        </label>

        <div className="max-w-full overflow-x-auto">
          <ExperienceSegmentedControl
            value={ideaStatusFilter}
            options={IDEA_FILTER_OPTIONS}
            workshop={workshop}
            ariaLabel="Filter ideas"
            onValueChange={handleIdeaStatusFilterChange}
          />
        </div>
      </div>

      <ul
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy={isIdeasPending}
      >
        <li>
          <button
            type="button"
            className="flex h-full w-full flex-col overflow-hidden rounded-lg border bg-white text-left shadow-xs transition-transform focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={handleOpenNewIdeaDialog}
          >
            <span className="grid aspect-4/3 w-full place-items-center bg-neutral-100 text-neutral-400">
              <PlusIcon className="size-9" aria-hidden="true" />
            </span>

            <span className="grid flex-1 place-items-center px-4 py-6 text-center text-xl font-semibold tracking-[-0.02em] uppercase">
              Add new idea
            </span>
          </button>
        </li>

        {isIdeasPending
          ? Array.from({ length: 3 }, (_, index) => (
              <IdeaCardSkeleton key={index} />
            ))
          : ideas.map((idea) => (
              <IdeateIdeaCard
                key={idea.ID}
                idea={idea}
                isGeneratingImage={pendingImageIdeaIds.includes(idea.ID)}
                isShortlistPending={pendingShortlistIdeaIds.includes(idea.ID)}
                onGenerateImage={() => handleGenerateIdeaImage(idea)}
                onOpenImage={() => handleOpenFullscreenImage(idea)}
                onToggleShortlist={() => handleToggleShortlist(idea)}
                onEdit={() => handleEditIdea(idea)}
                onSharpen={() => handleOpenSharpenDialog(idea)}
              />
            ))}
      </ul>

      {!isIdeasPending && ideas.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-500">
          No ideas available for these filters.
        </p>
      )}

      <button
        className="fixed right-4 bottom-16 z-20 flex items-center justify-center gap-2 drop-shadow-sm disabled:opacity-50 sm:right-6"
        type="button"
        disabled={
          !selectedPillar || ideas.length === 0 || scoutIdeaMutation.isPending
        }
        aria-label="Scout Ideas"
        aria-busy={scoutIdeaMutation.isPending}
        onClick={handleScoutIdeas}
        title={
          selectedPillar
            ? ideas.length === 0
              ? "No visible ideas to scout"
              : undefined
            : "Select a pillar to use Scout"
        }
      >
        <img className="size-12 sm:size-18" src="/scout.svg" alt="scout" />
      </button>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Idea card                                                                  */
/* -------------------------------------------------------------------------- */

function IdeateIdeaCard({
  idea,
  isGeneratingImage,
  isShortlistPending,
  onGenerateImage,
  onOpenImage,
  onToggleShortlist,
  onEdit,
  onSharpen,
}: {
  idea: ParticipantIdea
  isGeneratingImage: boolean
  isShortlistPending: boolean
  onGenerateImage: () => void
  onOpenImage: () => void
  onToggleShortlist: () => void
  onEdit: () => void
  onSharpen: () => void
}) {
  const { workshop } = useParticipantExperience()

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        {idea.imageFileName?.trim() ? (
          <>
            <img
              src={idea.imageFileName}
              alt={idea.title || "idea"}
              className="size-full object-contain"
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <button
                type="button"
                className="grid size-8 place-content-center rounded-md bg-neutral-950 text-white disabled:cursor-wait disabled:opacity-50"
                aria-label={`Regenerate the image for ${idea.title || "idea"}`}
                aria-busy={isGeneratingImage}
                disabled={isGeneratingImage}
                onClick={onGenerateImage}
              >
                <RefreshCwIcon
                  className={cn("size-4", isGeneratingImage && "animate-spin")}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="grid size-8 place-content-center rounded-md bg-neutral-950 text-white disabled:cursor-wait disabled:opacity-50"
                aria-label={`Open the image for ${idea.title || "idea"} in fullscreen`}
                onClick={onOpenImage}
              >
                <FullscreenIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400 disabled:cursor-wait disabled:opacity-50"
            aria-label={`Generate an image for ${idea.title || "idea"}`}
            aria-busy={isGeneratingImage}
            disabled={isGeneratingImage}
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

            <button
              type="button"
              aria-label={`Edit ${idea.title || "idea"}`}
              onClick={onEdit}
            >
              <SquarePenIcon className="size-5" aria-hidden="true" />
            </button>
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
            <ClockIcon className="size-3.5" aria-hidden="true" />

            {formatRelativeDate(idea.CreatedDttm)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1">
            {idea.TeamName || "Unknown team"}
          </span>

          <span className="rounded-full border px-2.5 py-1">
            {idea.CategoryName || "Unknown pillar"}
          </span>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-600">{idea.Desc}</p>

        <ExperienceButton
          variant="primary"
          workshop={workshop}
          className="w-28"
          onClick={onSharpen}
        >
          Sharpen
        </ExperienceButton>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Fullscreen idea image                                                      */
/* -------------------------------------------------------------------------- */

function IdeaImageFullscreenDialog({
  idea,
  open,
  onClose,
}: {
  idea: ParticipantIdea
  open: boolean
  onClose: () => void
}) {
  const dialogRef = useNativeDialog(open)
  const ideaTitle = idea.title || "Untitled idea"

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="fullscreen-idea-image-title"
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-black/95 p-0 text-white backdrop-blur-sm"
      onClose={onClose}
    >
      <div className="relative flex size-full items-center justify-center p-4 sm:p-8">
        <h2 id="fullscreen-idea-image-title" className="sr-only">
          {ideaTitle} image
        </h2>

        <img
          src={idea.imageFileName}
          alt={ideaTitle}
          className="max-h-full max-w-full object-contain"
        />

        <button
          type="button"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-black/70 text-white ring-1 ring-white/30 transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:top-6 sm:right-6"
          aria-label="Close fullscreen image"
          onClick={onClose}
        >
          <XIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Stage                                                                      */
/* -------------------------------------------------------------------------- */

function StageScreen() {
  const { workshop, workshopCode, visitorId } = useParticipantExperience()

  const teams = workshop.teams
  const pillars = workshop.category

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const [selectedPillarId, setSelectedPillarId] = useState<number | null>(null)

  const [previewIdeaId, setPreviewIdeaId] = useState<number | null>(null)

  const queryClient = useQueryClient()

  const ideasQueryOptions = getParticipantIdeasOptions({
    visitor_id: visitorId,
    workshop_code: workshopCode,
    team_id: selectedTeamId,
    category_id: selectedPillarId,
    is_shortlisted: true,
    is_coached: null,
  })

  const { data: ideas = [], isPending: isIdeasPending } = useQuery({
    ...ideasQueryOptions,
    select: (response) => response.data,
  })

  const previewIdeaIndex =
    previewIdeaId === null
      ? -1
      : ideas.findIndex((idea) => idea.ID === previewIdeaId)
  const previewIdea = previewIdeaIndex === -1 ? null : ideas[previewIdeaIndex]
  const hasPreviousIdea = previewIdeaIndex > 0
  const hasNextIdea =
    previewIdeaIndex >= 0 && previewIdeaIndex < ideas.length - 1

  useEffect(() => {
    const handleIdeaUpserted = ({
      roomId,
      idea: socketIdea,
    }: IdeaUpsertSocketPayload) => {
      if (roomId !== workshopCode) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData

        return {
          ...oldData,
          data: oldData.data.map((idea) =>
            idea.ID === socketIdea.ideaId
              ? {
                  ...idea,
                  CategoryID: socketIdea.categoryId,
                  CategoryName: socketIdea.categoryName,
                  Desc: socketIdea.desc,
                  title: socketIdea.title,
                  Context: socketIdea.context,
                }
              : idea
          ),
        }
      })
    }

    const handleIdeaShortlistUpdated = ({
      roomId,
      isShortlisted,
      idea: socketIdea,
    }: IdeaShortlistSocketPayload) => {
      if (roomId !== workshopCode) return

      if (!isShortlisted) {
        setPreviewIdeaId((current) =>
          current === socketIdea.ID ? null : current
        )
      }

      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData

        const exists = oldData.data.some((idea) => idea.ID === socketIdea.ID)

        // Stage only shows shortlisted ideas
        if (!isShortlisted) {
          if (!exists) return oldData

          return {
            ...oldData,
            data: oldData.data.filter((idea) => idea.ID !== socketIdea.ID),
          }
        }

        const matchesFilters =
          (selectedTeamId === null || socketIdea.TeamID === selectedTeamId) &&
          (selectedPillarId === null ||
            socketIdea.CategoryID === selectedPillarId)

        if (!matchesFilters) return oldData

        // Already present: update shortlist state
        if (exists) {
          return {
            ...oldData,
            data: oldData.data.map((idea) =>
              idea.ID === socketIdea.ID ? { ...idea, flgTeam: true } : idea
            ),
          }
        }

        // Newly shortlisted idea wasn't previously in Stage
        return {
          ...oldData,
          data: [
            ...oldData.data,
            {
              ...socketIdea,
              flgTeam: true,
            },
          ],
        }
      })
    }

    const handleIdeaImageGenerated = ({
      roomId,
      ideaId,
      imageUrl,
    }: IdeaImageSocketPayload) => {
      if (roomId !== workshopCode) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData

        return {
          ...oldData,
          data: oldData.data.map((idea) =>
            idea.ID === ideaId
              ? {
                  ...idea,
                  imageFileName: imageUrl,
                }
              : idea
          ),
        }
      })
    }

    socket.on("idea_upserted", handleIdeaUpserted)
    socket.on("idea_shortlist_updated", handleIdeaShortlistUpdated)
    socket.on("idea_image_generated", handleIdeaImageGenerated)

    return () => {
      socket.off("idea_upserted", handleIdeaUpserted)
      socket.off("idea_shortlist_updated", handleIdeaShortlistUpdated)
      socket.off("idea_image_generated", handleIdeaImageGenerated)
    }
  }, [
    workshopCode,
    selectedTeamId,
    selectedPillarId,
    queryClient,
    ideasQueryOptions.queryKey,
  ])

  const shortlistIdeaMutation = useShortlistIdea()

  const pendingShortlistIdeaIds = useMutationState<number>({
    filters: {
      mutationKey: participantIdeaMutationKeys.shortlist,
      status: "pending",
    },
    select: (mutation) =>
      (mutation.state.variables as ShortlistIdeaPayload).idea_id,
  })

  const handleTeamChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPreviewIdeaId(null)
    setSelectedTeamId(parseOptionalId(event.target.value))
  }

  const handlePillarChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPreviewIdeaId(null)
    setSelectedPillarId(parseOptionalId(event.target.value))
  }

  const handleRemoveFromShortlist = (idea: ParticipantIdea) => {
    shortlistIdeaMutation.mutate({
      workshop_code: workshopCode,
      idea_id: idea.ID,
      flag: false,
      idea,
    })
  }

  const handlePreviewIdea = (idea: ParticipantIdea) => {
    setPreviewIdeaId(idea.ID)
  }

  const handleClosePreview = () => {
    setPreviewIdeaId(null)
  }

  const handlePreviewPreviousIdea = () => {
    if (!hasPreviousIdea) return

    setPreviewIdeaId(ideas[previewIdeaIndex - 1].ID)
  }

  const handlePreviewNextIdea = () => {
    if (!hasNextIdea) return

    setPreviewIdeaId(ideas[previewIdeaIndex + 1].ID)
  }

  return (
    <section className="container mx-auto w-full p-4 sm:p-6 lg:p-8">
      {previewIdea && (
        <IdeaPreviewDialog
          idea={previewIdea}
          open
          position={previewIdeaIndex + 1}
          total={ideas.length}
          hasPrevious={hasPreviousIdea}
          hasNext={hasNextIdea}
          onPrevious={handlePreviewPreviousIdea}
          onNext={handlePreviewNextIdea}
          onClose={handleClosePreview}
        />
      )}

      <div className="mb-6 flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        <label>
          <span className="sr-only">Team</span>

          <ExperienceSelect
            workshop={workshop}
            value={selectedTeamId ?? "all"}
            onChange={handleTeamChange}
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
            value={selectedPillarId ?? "all"}
            onChange={handlePillarChange}
            className="w-full sm:w-auto"
          >
            <ExperienceSelectOption value="all">
              All pillars
            </ExperienceSelectOption>

            {pillars.map((pillar) => (
              <ExperienceSelectOption key={pillar.ID} value={pillar.ID}>
                {pillar.Name}
              </ExperienceSelectOption>
            ))}
          </ExperienceSelect>
        </label>
      </div>

      <ul
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy={isIdeasPending}
      >
        {isIdeasPending
          ? Array.from({ length: 4 }, (_, index) => (
              <IdeaCardSkeleton key={index} />
            ))
          : ideas.map((idea) => (
              <StageIdeaCard
                key={idea.ID}
                idea={idea}
                isShortlistPending={pendingShortlistIdeaIds.includes(idea.ID)}
                onRemoveFromShortlist={() => handleRemoveFromShortlist(idea)}
                onPreview={() => handlePreviewIdea(idea)}
              />
            ))}
      </ul>

      {!isIdeasPending && ideas.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-500">
          No shortlisted ideas match the selected filters.
        </p>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Stage card                                                                 */
/* -------------------------------------------------------------------------- */

function StageIdeaCard({
  idea,
  isShortlistPending,
  onRemoveFromShortlist,
  onPreview,
}: {
  idea: ParticipantIdea
  isShortlistPending: boolean
  onRemoveFromShortlist: () => void
  onPreview: () => void
}) {
  const { workshop } = useParticipantExperience()

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
            {idea.CategoryName || "Unknown pillar"}
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

/* -------------------------------------------------------------------------- */
/* Shared idea skeleton                                                       */
/* -------------------------------------------------------------------------- */

function IdeaCardSkeleton() {
  return (
    <li
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
  )
}

/* -------------------------------------------------------------------------- */
/* Idea preview dialog                                                        */
/* -------------------------------------------------------------------------- */

function IdeaPreviewDialog({
  idea,
  open,
  position,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onClose,
}: {
  idea: ParticipantIdea
  open: boolean
  position: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}) {
  const { workshop } = useParticipantExperience()

  const dialogRef = useNativeDialog(open)

  const handleClose = () => {
    onClose()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft" && hasPrevious) {
      event.preventDefault()
      onPrevious()
    }

    if (event.key === "ArrowRight" && hasNext) {
      event.preventDefault()
      onNext()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idea-preview-title"
      aria-describedby="idea-preview-description"
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-black/70"
      onClose={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="flex h-full max-h-dvh min-h-0 flex-col overflow-hidden"
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          color: workshop.txt_primary_color,
        }}
      >
        <header
          className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6"
          style={{
            borderColor: workshop.card_primary_border_color,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.16em] uppercase">
              The Stage
            </span>

            <span
              className="h-4 w-px"
              style={{ backgroundColor: workshop.card_primary_border_color }}
              aria-hidden="true"
            />

            <p
              className="text-sm tabular-nums"
              style={{ color: workshop.txt_secondary_color }}
              aria-live="polite"
            >
              Idea {position} of {total}
            </p>
          </div>

          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: workshop.card_primary_border_color,
              outlineColor: workshop.btn_primary_bg_color,
            }}
            aria-label="Close idea preview"
            onClick={handleClose}
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:overflow-hidden">
          <div className="relative flex min-h-[48dvh] items-center justify-center overflow-hidden bg-neutral-950 p-12 sm:p-16 lg:min-h-0">
            {idea.imageFileName?.trim() ? (
              <img
                src={idea.imageFileName}
                alt={idea.title || "Idea"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-neutral-500">
                <ImagePlusIcon className="size-12" aria-hidden="true" />

                <span>No image available</span>
              </div>
            )}

            <button
              type="button"
              className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-25 sm:left-6 sm:size-12"
              aria-label="View previous idea"
              disabled={!hasPrevious}
              onClick={onPrevious}
            >
              <ChevronLeftIcon className="size-6" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-25 sm:right-6 sm:size-12"
              aria-label="View next idea"
              disabled={!hasNext}
              onClick={onNext}
            >
              <ChevronRightIcon className="size-6" aria-hidden="true" />
            </button>
          </div>

          <aside
            className="min-w-0 border-t lg:overflow-y-auto lg:border-t-0 lg:border-l"
            style={{ borderColor: workshop.card_primary_border_color }}
          >
            <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col-reverse gap-2 sm:flex-col">
                <p
                  id="idea-preview-description"
                  className="text-sm leading-6"
                  style={{ color: workshop.txt_secondary_color }}
                >
                  {formatRelativeDate(idea.CreatedDttm)}
                </p>
                <h2
                  id="idea-preview-title"
                  className="text-3xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
                >
                  {idea.title || "Untitled"}
                </h2>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-900">
                  <UsersIcon className="size-3.5" aria-hidden="true" />
                  {idea.TeamName || "Unknown team"}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                  style={{
                    borderColor: workshop.card_primary_border_color,
                  }}
                >
                  <ShapesIcon className="size-3.5" aria-hidden="true" />
                  {idea.CategoryName || "Unknown pillar"}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-white">
                  <StarIcon
                    className="size-3.5"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  Shortlisted
                </span>

                {idea.flgCoach && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-900">
                    <SparklesIcon className="size-3.5" aria-hidden="true" />
                    Sharpened
                  </span>
                )}
              </div>

              <div
                className="my-8 border-t"
                style={{ borderColor: workshop.card_primary_border_color }}
              />

              <p
                className="text-base leading-7 whitespace-pre-line"
                style={{ color: workshop.txt_secondary_color }}
              >
                {idea.Desc}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Scout dialog                                                               */
/* -------------------------------------------------------------------------- */

function ScoutDialog({
  open,
  pillarTitle,
  suggestions,
  isPending,
  isError,
  onClose,
}: {
  open: boolean
  pillarTitle: string
  suggestions: string[]
  isPending: boolean
  isError: boolean
  onClose: () => void
}) {
  const { workshop } = useParticipantExperience()

  const dialogRef = useNativeDialog(open)

  const handleClose = () => {
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
      onClose={handleClose}
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
          <div className="min-w-0">
            <h2
              id="scout-dialog-title"
              className="text-lg font-semibold tracking-[-0.02em] sm:text-xl"
            >
              Scout Suggests
            </h2>

            <p
              className="mt-0.5 text-xs sm:mt-1 sm:text-sm"
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
            onClick={handleClose}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 sm:px-6 sm:py-6" aria-busy={isPending}>
            <div
              className="rounded-lg border p-4 sm:p-5"
              style={{
                backgroundColor: workshop.card_secondary_bg_color,
                borderColor: workshop.card_primary_border_color,
                color: workshop.card_secondary_txt_color,
              }}
            >
              <p className="mb-4 text-xs font-semibold tracking-[0.14em] uppercase">
                {pillarTitle}
              </p>

              {isPending ? (
                <div className="grid gap-5" aria-label="Loading suggestions">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex gap-3" aria-hidden="true">
                      <span className="h-4 w-4 shrink-0 animate-pulse rounded bg-current opacity-10" />

                      <div className="grid flex-1 gap-2">
                        <span className="h-3 w-full animate-pulse rounded bg-current opacity-10" />
                        <span className="h-3 w-5/6 animate-pulse rounded bg-current opacity-10" />
                        <span className="h-3 w-2/3 animate-pulse rounded bg-current opacity-10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <p className="text-sm leading-6">
                  Scout couldn&apos;t generate suggestions. Close this dialog
                  and try again.
                </p>
              ) : (
                <ol className="grid list-decimal gap-4 pl-6 text-sm leading-6 sm:text-base sm:leading-7">
                  {suggestions.map((suggestion, index) => (
                    <li key={`${index}-${suggestion}`}>{suggestion}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        <footer
          className="shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4"
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            borderColor: workshop.card_primary_border_color,
          }}
        >
          <ExperienceButton
            variant="primary"
            workshop={workshop}
            className="w-full"
            onClick={handleClose}
          >
            Back
          </ExperienceButton>
        </footer>
      </div>
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Idea dialog                                                                */
/* -------------------------------------------------------------------------- */

function IdeaDialog({
  open,
  teamId,
  idea,
  onClose,
  // onSaved,
}: {
  open: boolean
  teamId: number
  idea: ParticipantIdea | null
  onClose: () => void
  // onSaved: (result: { ideaId: number; invalidateChats: boolean }) => void
}) {
  const { workshop, workshopCode, visitorId } = useParticipantExperience()

  const pillars = workshop.category

  const dialogRef = useNativeDialog(open)
  const saveIdeaMutation = useSaveIdea()

  const initialForm = {
    categoryId: idea?.CategoryID ?? null,
    description: idea?.Desc ?? "",
    title: idea?.title ?? "",
    context: idea?.Context ?? "",
  }

  const [form, setForm] = useState(initialForm)

  const [errors, setErrors] = useState<{
    categoryId?: string
    description?: string
  }>({})

  const closeDialog = () => {
    setForm(initialForm)
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    if (saveIdeaMutation.isPending) return

    closeDialog()
  }

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (saveIdeaMutation.isPending) {
      event.preventDefault()
    }
  }

  const handleSubmitIdea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const categoryId = form.categoryId
    const description = form.description.trim()

    const validationErrors = {
      ...(categoryId === null && {
        categoryId: "Please select a pillar.",
      }),
      ...(!description && {
        description: "Idea description is required.",
      }),
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setErrors({})

    // TypeScript now knows categoryId is number
    const title = form.title.trim() || null
    const context = form.context.trim() || null

    saveIdeaMutation.mutate(
      {
        ...(idea && { idea_id: idea.ID }),
        visitor_id: visitorId,
        workshop_code: workshopCode,
        team_id: teamId,
        category_id: categoryId!,
        desc: description,
        title,
        context,
      },
      {
        onSuccess: (response) => {
          const category = pillars.find((pillar) => pillar.ID === categoryId)

          const team = workshop.teams.find((team) => team.ID === teamId)

          socket.emit("upsert_idea", {
            roomId: workshopCode,
            idea: {
              roomId: workshopCode,
              ideaId: response.data.idea_id,
              teamId,
              teamName: team?.TeamName ?? "",
              categoryId,
              categoryName: category?.Name ?? "",
              desc: description,
              title,
              context,
            },
          })

          // onSaved({
          //   ideaId: response.data.idea_id,
          //   invalidateChats: Boolean(idea),
          // })

          toast.add({
            type: "success",
            title: idea ? "Idea updated" : "Idea added",
            description: response.message,
          })

          closeDialog()
        },
      }
    )
  }

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
      onCancel={handleCancel}
      onClose={handleClose}
    >
      <form
        noValidate
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
        onSubmit={handleSubmitIdea}
      >
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
          <div className="min-w-0">
            <h2
              id="idea-dialog-title"
              className="text-lg font-semibold tracking-[-0.02em] sm:text-xl"
            >
              {idea ? "Edit idea" : "Add an idea"}
            </h2>

            <p
              className="mt-0.5 text-xs sm:mt-1 sm:text-sm"
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
            onClick={handleClose}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
            <label className="grid gap-1.5 sm:gap-2">
              <span className="text-sm font-medium">Pillar</span>

              <ExperienceSelect
                workshop={workshop}
                value={form.categoryId ?? ""}
                disabled={saveIdeaMutation.isPending}
                className="w-full"
                aria-invalid={Boolean(errors.categoryId)}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))

                  setErrors((current) => ({
                    ...current,
                    categoryId: undefined,
                  }))
                }}
              >
                <ExperienceSelectOption value="">
                  {pillars.length ? "Select a pillar" : "No pillars available"}
                </ExperienceSelectOption>

                {pillars.map((pillar) => (
                  <ExperienceSelectOption key={pillar.ID} value={pillar.ID}>
                    {pillar.Name}
                  </ExperienceSelectOption>
                ))}
              </ExperienceSelect>

              {errors.categoryId && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.categoryId}
                </p>
              )}
            </label>

            <div className="grid gap-1.5 sm:gap-2">
              <span className="sr-only text-sm font-medium">Description</span>
              <textarea
                autoFocus
                rows={4}
                value={form.description}
                disabled={saveIdeaMutation.isPending}
                aria-label="Idea description"
                aria-invalid={Boolean(errors.description)}
                placeholder="Describe your idea"
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))

                  setErrors((current) => ({
                    ...current,
                    description: undefined,
                  }))
                }}
                className={cn(
                  "min-h-24 w-full resize-none rounded-md border",
                  "bg-transparent px-3 py-2 text-sm leading-6",
                  "transition-colors outline-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{
                  borderColor: errors.description
                    ? "#dc2626"
                    : workshop.card_primary_border_color,
                  outlineColor: workshop.btn_primary_bg_color,
                }}
              />

              {errors.description && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <label className="grid gap-1.5 sm:gap-2">
              <span className="text-sm font-medium">
                Title{" "}
                <span
                  className="font-normal"
                  style={{
                    color: workshop.txt_secondary_color,
                  }}
                >
                  (Optional)
                </span>
              </span>

              <input
                type="text"
                value={form.title}
                disabled={saveIdeaMutation.isPending}
                placeholder="Give your idea a clear title"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
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

            <label className="grid gap-1.5 sm:gap-2">
              <span className="text-sm font-medium">
                Context{" "}
                <span
                  className="font-normal"
                  style={{
                    color: workshop.txt_secondary_color,
                  }}
                >
                  (Optional)
                </span>
              </span>

              <textarea
                rows={4}
                value={form.context}
                disabled={saveIdeaMutation.isPending}
                placeholder="Describe the context in which this idea will be used"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    context: event.target.value,
                  }))
                }
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
            onClick={handleClose}
          >
            Cancel
          </ExperienceButton>

          <ExperienceButton
            type="submit"
            variant="primary"
            workshop={workshop}
            disabled={saveIdeaMutation.isPending || pillars.length === 0}
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
