import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { QRCodeSVG } from "qrcode.react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ImageIcon,
  InfoIcon,
  ShapesIcon,
  SparklesIcon,
  ThumbsUpIcon,
  UsersIcon,
} from "lucide-react"

import { formatRelativeDate } from "@/lib/date"
import { getDurationParts } from "@/lib/utils"
import { useWorkshopTimer } from "@/hooks/use-workshop-timer"
import { socket } from "@/lib/socket"
import type { WorkshopStatus } from "@/lib/workshop-lifecycle"
import {
  type IdeaScreen,
  type WorkshopScreen,
  dashboardKeys,
  getActivitiesOptions,
  getDashboardOptions,
  getIdeasScreenOptions,
  getResultsScreenOptions,
  getWorkshopScreenOptions,
  ideaScreenKeys,
  resultScreenKeys,
  workshopScreenKeys,
} from "@/services/big-screen"
import type {
  IdeaCoachSocketPayload,
  IdeaImageSocketPayload,
  IdeaShortlistSocketPayload,
  IdeaUpsertSocketPayload,
  IdeaVoteSocketPayload,
  ParticipantWorkshop,
} from "@/services/participants"

import {
  ExperienceSelect,
  ExperienceSelectOption,
} from "@/components/experience/experience-select"
import { ExperienceButton } from "@/components/experience/experience-button"
import { ExperienceStatsCard } from "@/components/experience/experience-stats-card"
import { NewsroomStatsRows } from "@/components/experience/experience-stats-rows"
import { ExperienceFooter } from "@/components/experience/experience-footer"
import { IdeaPreviewDialog } from "@/components/experience/idea-preview-dialog"

export const Route = createFileRoute("/workshops/$id/big-screen")({
  component: RouteComponent,
})

type BigScreenPage = "ideas" | "newsroom"

// "all" is the local sentinel for the unfiltered dropdown option — every
// other value is a real (encrypted) team/category ID from getWorkshopScreenOptions,
// passed straight through to GET /api/big/idea, which decrypts it server-side.
const toFilterId = (value: string) => (value === "all" ? undefined : value)

// ExperienceSelect/ExperienceButton/ExperienceFooter are typed against the
// participant flow's per-workshop theme (ParticipantWorkshop), which the
// big-screen API doesn't return. The big screen uses a fixed black/white/red
// palette instead, so we satisfy just the fields these components read and
// cast the rest.
const bigScreenTheme = {
  txt_primary_color: "#111111",
  txt_secondary_color: "#6b7280",
  btn_primary_bg_color: "#111111",
  btn_primary_txt_color: "#ffffff",
  btn_secondary_bg_color: "#ffffff",
  btn_secondary_border_color: "#111111",
  btn_secondary_txt_color: "#111111",
  card_primary_bg_color: "#ffffff",
  card_primary_border_color: "#e5e5e5",
  card_primary_border_radius: "1rem",
  ticker_bg_color: "#111111",
  ticker_txt_color: "#ffffff",
  ticker_live_bg_color: "#ef4444",
  ticker_live_txt_color: "#ffffff",
} as unknown as ParticipantWorkshop

function RouteComponent() {
  const { id: workshopId } = Route.useParams()
  const participantsUrl = `${window.location.origin}/workshops/${workshopId}/participants`

  const queryClient = useQueryClient()

  const [team, setTeam] = useState("all")
  const [pillar, setPillar] = useState("all")
  const [currentPage, setCurrentPage] = useState<BigScreenPage>("ideas")
  const [showLatestActivity, setShowLatestActivity] = useState(false)
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(
    null
  )

  // --------------------------------------------------
  // Workshop
  // --------------------------------------------------

  const { data: workshopResponse } = useQuery(
    getWorkshopScreenOptions(workshopId)
  )
  const workshop = workshopResponse?.data
  const isVotingPhase = workshop?.status === "Vote"
  const isRevealPhase = workshop?.status === "Reveal"
  // Vote counts stay hidden while ideating and only appear once the
  // workshop has ended.
  const showVotes = workshop?.status === "Completed"

  // --------------------------------------------------
  // Realtime updates
  // --------------------------------------------------

  useEffect(() => {
    const joinWorkshopRoom = () => {
      socket.emit("join_room", { roomId: workshopId })
    }

    const handleWorkshopStatus = ({
      roomId,
      status,
    }: {
      roomId: string
      status: WorkshopStatus
    }) => {
      if (roomId !== workshopId) return

      queryClient.setQueryData(
        workshopScreenKeys.detail(workshopId),
        (current: typeof workshopResponse) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  status,
                },
              }
            : current
      )

      // Vote counts only come back once the workshop is completed, so
      // fetch the ideas again when it ends.
      if (status === "Completed") {
        void queryClient.invalidateQueries({ queryKey: ideaScreenKeys.all })
      }
    }

    const invalidateIdeas = (roomId: string) => {
      if (roomId !== workshopId) return

      void queryClient.invalidateQueries({ queryKey: ideaScreenKeys.all })
      void queryClient.invalidateQueries({ queryKey: resultScreenKeys.all })
      void queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(workshopId),
      })
    }

    const handleIdeaUpserted = ({ roomId }: IdeaUpsertSocketPayload) => {
      invalidateIdeas(roomId)
    }

    const handleIdeaCoachUpdated = ({ roomId }: IdeaCoachSocketPayload) => {
      invalidateIdeas(roomId)
    }

    const handleIdeaShortlistUpdated = ({
      roomId,
    }: IdeaShortlistSocketPayload) => {
      invalidateIdeas(roomId)
    }

    const handleIdeaImageGenerated = ({ roomId }: IdeaImageSocketPayload) => {
      invalidateIdeas(roomId)
    }

    const handleIdeaVoteUpdated = ({ roomId }: IdeaVoteSocketPayload) => {
      invalidateIdeas(roomId)
    }

    socket.on("connect", joinWorkshopRoom)
    socket.on("workshop_status", handleWorkshopStatus)
    socket.on("idea_upserted", handleIdeaUpserted)
    socket.on("idea_coach_updated", handleIdeaCoachUpdated)
    socket.on("idea_shortlist_updated", handleIdeaShortlistUpdated)
    socket.on("idea_image_generated", handleIdeaImageGenerated)
    socket.on("idea_vote_updated", handleIdeaVoteUpdated)

    if (socket.connected) {
      joinWorkshopRoom()
    }

    return () => {
      socket.off("connect", joinWorkshopRoom)
      socket.off("workshop_status", handleWorkshopStatus)
      socket.off("idea_upserted", handleIdeaUpserted)
      socket.off("idea_coach_updated", handleIdeaCoachUpdated)
      socket.off("idea_shortlist_updated", handleIdeaShortlistUpdated)
      socket.off("idea_image_generated", handleIdeaImageGenerated)
      socket.off("idea_vote_updated", handleIdeaVoteUpdated)
    }
  }, [queryClient, workshopId])

  const teamOptions = [
    { label: "All teams", value: "all" },
    ...(workshop?.teams.map((team) => ({
      label: team.TeamName,
      value: team.ID,
    })) ?? []),
  ]

  const pillarOptions = [
    { label: "All pillars", value: "all" },
    ...(workshop?.categories.map((category) => ({
      label: category.Name,
      value: category.ID,
    })) ?? []),
  ]

  // --------------------------------------------------
  // Dashboard
  // --------------------------------------------------

  const { data: dashboardResponse } = useQuery(getDashboardOptions(workshopId))
  const overall = dashboardResponse?.data.overall
  const teamStats = dashboardResponse?.data.teams ?? []

  const summary = [
    { label: "Draft", value: overall?.Draft ?? 0 },
    { label: "Shortlisted", value: overall?.Shortlisted ?? 0 },
    { label: "Sharpened", value: overall?.Sharpened ?? 0 },
    { label: "Total Ideas", value: overall?.TotalIdeas ?? 0 },
  ]

  // --------------------------------------------------
  // Ideas
  // --------------------------------------------------

  const {
    data: ideasResponse,
    isLoading: isIdeasLoading,
    isError: isIdeasError,
  } = useQuery(
    getIdeasScreenOptions({
      workshop_code: workshopId,
      category_id: toFilterId(pillar),
      team_id: toFilterId(team),
    })
  )
  const ideas = ideasResponse?.data ?? []

  const selectedIdea =
    selectedIdeaIndex === null ? undefined : ideas[selectedIdeaIndex]

  // --------------------------------------------------
  // Latest Activity (also feeds the ticker)
  // --------------------------------------------------

  const {
    data: activitiesResponse,
    isPending: isActivitiesPending,
    isError: isActivitiesError,
  } = useQuery(getActivitiesOptions({ code: workshopId, type: null }))
  const activities = activitiesResponse?.data ?? []

  // --------------------------------------------------
  // Timer
  // --------------------------------------------------

  const { timer } = useWorkshopTimer(workshopId)
  const duration = getDurationParts(timer.remainingSeconds)

  // Reveal is edge-to-edge (no page padding), with the ticker pinned below.
  if (isRevealPhase) {
    return (
      <div className="flex h-dvh flex-col bg-white">
        <BigScreenRevealView
          workshopId={workshopId}
          teamOptions={teamOptions}
          pillarOptions={pillarOptions}
        />

        <ExperienceFooter
          workshop={bigScreenTheme}
          activities={activities}
          isPending={isActivitiesPending}
          isError={isActivitiesError}
        />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-neutral-100">
      <main className="flex-1 overflow-y-auto py-3">
        <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-[6%]">
          {isVotingPhase ? (
            <BigScreenVotingView
              workshop={workshop}
              participantsUrl={participantsUrl}
            />
          ) : (
            <div className="flex w-full flex-col gap-4 rounded-2xl bg-white p-3 shadow-sm md:p-4 lg:p-5">
              {/* ==========================================
                HEADER
            ========================================== */}

              <div className="grid w-full grid-cols-1 items-stretch gap-3 md:gap-4 xl:grid-cols-[30%_minmax(0,1fr)] xl:gap-8">
                <div className="grid min-w-0 content-between gap-3">
                  <div className="grid gap-1">
                    <h1 className="m-0 line-clamp-2 text-2xl leading-normal font-black uppercase md:text-4xl">
                      {workshop?.Name ?? "Workshop"}
                    </h1>
                    {workshop?.Desc && (
                      <p className="m-0 line-clamp-2 text-sm leading-[1.4] font-medium text-neutral-500">
                        {workshop.Desc}
                      </p>
                    )}
                  </div>

                  {/*
                  Fixed min-height so the toolbar takes up the same space
                  whether it's showing the (short) filters on screen 1 or
                  the (tall) timer on screen 2.
                */}
                  <div className="flex min-h-14 w-full flex-wrap items-center gap-3 md:min-h-20">
                    {currentPage === "newsroom" ? (
                      <div
                        className="w-full rounded-2xl p-4 text-center text-2xl leading-none font-bold tracking-widest shadow-sm md:text-5xl"
                        style={{
                          backgroundColor: bigScreenTheme.btn_primary_bg_color,
                          color: bigScreenTheme.btn_primary_txt_color,
                        }}
                        aria-label="Workshop time remaining"
                      >
                        {String(duration.hours).padStart(2, "0")}:
                        {String(duration.minutes).padStart(2, "0")}:
                        {String(duration.seconds).padStart(2, "0")}
                      </div>
                    ) : (
                      <div className="flex w-full flex-wrap items-center gap-2">
                        <ExperienceSelect
                          workshop={bigScreenTheme}
                          value={team}
                          onChange={(event) => setTeam(event.target.value)}
                          aria-label="Select team"
                          className="w-44 shrink-0"
                        >
                          {teamOptions.map((option) => (
                            <ExperienceSelectOption
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </ExperienceSelectOption>
                          ))}
                        </ExperienceSelect>

                        <ExperienceSelect
                          workshop={bigScreenTheme}
                          value={pillar}
                          onChange={(event) => setPillar(event.target.value)}
                          aria-label="Select pillar"
                          className="w-44 shrink-0"
                        >
                          {pillarOptions.map((option) => (
                            <ExperienceSelectOption
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </ExperienceSelectOption>
                          ))}
                        </ExperienceSelect>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {summary.map((stat) => (
                    <ExperienceStatsCard
                      key={stat.label}
                      value={stat.value}
                      label={stat.label}
                      backgroundColor={bigScreenTheme.btn_primary_bg_color}
                      color={bigScreenTheme.btn_primary_txt_color}
                    />
                  ))}
                </div>
              </div>

              {/* ==========================================
                SHARED NAVIGATION
            ========================================== */}

              <div className="flex w-full items-center justify-end">
                {currentPage === "ideas" ? (
                  <ExperienceButton
                    workshop={bigScreenTheme}
                    aria-label="Go to next screen"
                    onClick={() => setCurrentPage("newsroom")}
                  >
                    Next →
                  </ExperienceButton>
                ) : (
                  <ExperienceButton
                    workshop={bigScreenTheme}
                    aria-label="Go to previous screen"
                    onClick={() => setCurrentPage("ideas")}
                  >
                    ← Previous
                  </ExperienceButton>
                )}
              </div>

              {/* ==========================================
                PAGE CONTENT
            ========================================== */}

              {currentPage === "ideas" ? (
                <div className="w-full" aria-label="Ideas">
                  {isIdeasLoading && (
                    <p className="m-0 text-sm text-neutral-500">
                      Loading ideas…
                    </p>
                  )}

                  {isIdeasError && (
                    <p className="m-0 text-sm text-neutral-500">
                      Couldn't load ideas. Please try again.
                    </p>
                  )}

                  {!isIdeasLoading && !isIdeasError && ideas.length === 0 && (
                    <p className="m-0 text-sm text-neutral-500">
                      No ideas submitted yet.
                    </p>
                  )}

                  <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {ideas.map((idea, index) => (
                      <IdeaCard
                        key={`${idea.title}-${index}`}
                        idea={idea}
                        showVotes={showVotes}
                        onView={() => setSelectedIdeaIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-[25%_minmax(0,1fr)] lg:gap-x-8">
                  {/* Left content */}
                  <div className="flex min-w-0 flex-col items-center gap-4">
                    {!showLatestActivity && (
                      <>
                        {workshop?.shortUrl && (
                          <p className="text-sm font-semibold text-neutral-700">
                            {workshop.shortUrl}
                          </p>
                        )}

                        <div
                          className="relative flex w-full items-center justify-center gap-2 rounded-2xl border p-4 shadow-sm"
                          style={{
                            borderColor:
                              bigScreenTheme.card_primary_border_color,
                          }}
                          id="scan-qr"
                          aria-label="Scan QR code"
                        >
                          <QRCodeSVG
                            value={participantsUrl}
                            title="Scan to join the workshop"
                            className="h-auto w-full max-w-full object-contain"
                            size={1000}
                            marginSize={2}
                            level="H"
                            fgColor="#000000"
                            bgColor="#ffffff"
                          />
                        </div>
                      </>
                    )}

                    {showLatestActivity ? (
                      <div className="flex w-full flex-col gap-3">
                        <div className="flex w-full items-center justify-between gap-3">
                          <h2 className="text-lg font-bold">Latest Activity</h2>
                          <ExperienceButton
                            workshop={bigScreenTheme}
                            variant="secondary"
                            className="rounded-full"
                            onClick={() => setShowLatestActivity(false)}
                          >
                            Show QR
                          </ExperienceButton>
                        </div>

                        {isActivitiesPending ? (
                          <p className="text-sm text-neutral-500">
                            Loading activity...
                          </p>
                        ) : isActivitiesError ? (
                          <p className="text-sm text-neutral-500">
                            Couldn't load activity.
                          </p>
                        ) : activities.length === 0 ? (
                          <p className="text-sm text-neutral-500">
                            No activity yet.
                          </p>
                        ) : (
                          // Fixed height with an inner scroll so a long
                          // activity feed doesn't stretch the page.
                          <ul className="flex max-h-96 w-full flex-col gap-2 overflow-y-auto pr-1">
                            {activities.map((activity) => (
                              <li
                                key={activity.ID}
                                className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
                              >
                                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-black text-white">
                                  <InfoIcon
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold">
                                    {activity.TeamName || "Notification"}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {activity.Message}
                                  </p>
                                  <time className="mt-1 block text-right text-[10px] text-neutral-400">
                                    {formatRelativeDate(activity.CreatedDttm)}
                                  </time>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <ExperienceButton
                        workshop={bigScreenTheme}
                        className="max-w-[60%]"
                        onClick={() => setShowLatestActivity(true)}
                      >
                        Show Latest Activity
                      </ExperienceButton>
                    )}
                  </div>

                  {/* Right content */}
                  <div className="min-w-0">
                    <NewsroomStatsRows teams={teamStats} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==========================================
          TICKER
          Pinned to the bottom of the viewport, same layout technique as
          the participants route: a flex column with a scrollable middle
          section, so the footer never scrolls out of view.
      ========================================== */}

      <ExperienceFooter
        workshop={bigScreenTheme}
        activities={activities}
        isPending={isActivitiesPending}
        isError={isActivitiesError}
      />

      {/* ==========================================
          PRESENT MODAL
      ========================================== */}

      <IdeaPreviewDialog
        idea={selectedIdea}
        workshop={bigScreenTheme}
        showVotes={showVotes}
        position={(selectedIdeaIndex ?? 0) + 1}
        total={ideas.length}
        hasPrevious={selectedIdeaIndex !== null && selectedIdeaIndex > 0}
        hasNext={
          selectedIdeaIndex !== null && selectedIdeaIndex < ideas.length - 1
        }
        onClose={() => setSelectedIdeaIndex(null)}
        onPrevious={() =>
          setSelectedIdeaIndex((current) =>
            current === null ? null : Math.max(current - 1, 0)
          )
        }
        onNext={() =>
          setSelectedIdeaIndex((current) =>
            current === null ? null : Math.min(current + 1, ideas.length - 1)
          )
        }
      />
    </div>
  )
}

function BigScreenVotingView({
  workshop,
  participantsUrl,
}: {
  workshop: WorkshopScreen | undefined
  participantsUrl: string
}) {
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] w-full flex-col gap-6 rounded-2xl bg-white p-4 shadow-sm md:p-8">
      <div className="grid gap-1">
        <h1 className="m-0 text-2xl leading-normal font-black uppercase md:text-4xl">
          {workshop?.Name ?? "Workshop"}
        </h1>
        {workshop?.Desc && (
          <p className="m-0 text-sm leading-[1.4] font-medium text-neutral-500">
            {workshop.Desc}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div
          className="relative flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border p-4 shadow-sm"
          style={{ borderColor: bigScreenTheme.card_primary_border_color }}
          id="scan-qr-vote"
          aria-label="Scan QR code to begin voting"
        >
          <QRCodeSVG
            value={participantsUrl}
            title="Scan to begin voting"
            className="h-auto w-full max-w-full object-contain"
            size={1000}
            marginSize={2}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>

        <p className="m-0 max-w-sm text-lg font-semibold tracking-wide text-neutral-700 uppercase">
          Scan this QR on your phones
          <br />
          to begin Voting
        </p>
      </div>
    </div>
  )
}

type FilterOption = { label: string; value: string }

// Full-screen results view, laid out like the participant voting screen:
// header, image stage with prev/next arrows, and a details panel with the
// team/pillar filters. Filters always start on "all" and are local to this
// view. Results come from GET /api/big/results.
function BigScreenRevealView({
  workshopId,
  teamOptions,
  pillarOptions,
}: {
  workshopId: string
  teamOptions: FilterOption[]
  pillarOptions: FilterOption[]
}) {
  const [team, setTeam] = useState("all")
  const [pillar, setPillar] = useState("all")
  const [ideaIndex, setIdeaIndex] = useState(0)

  const {
    data: resultsResponse,
    isPending,
    isError,
  } = useQuery(
    getResultsScreenOptions({
      code: workshopId,
      category_id: toFilterId(pillar),
      team_id: toFilterId(team),
    })
  )
  const ideas = resultsResponse?.data ?? []

  const boundedIndex = Math.min(ideaIndex, Math.max(ideas.length - 1, 0))
  const idea = ideas[boundedIndex]
  const hasPrevious = boundedIndex > 0
  const hasNext = boundedIndex < ideas.length - 1

  const handleTeamChange = (value: string) => {
    setTeam(value)
    setIdeaIndex(0)
  }

  const handlePillarChange = (value: string) => {
    setPillar(value)
    setIdeaIndex(0)
  }

  const filters = (
    <div className="grid grid-cols-2 gap-2">
      <ExperienceSelect
        workshop={bigScreenTheme}
        value={team}
        onChange={(event) => handleTeamChange(event.target.value)}
        aria-label="Filter results by team"
        className="w-full"
      >
        {teamOptions.map((option) => (
          <ExperienceSelectOption key={option.value} value={option.value}>
            {option.label}
          </ExperienceSelectOption>
        ))}
      </ExperienceSelect>

      <ExperienceSelect
        workshop={bigScreenTheme}
        value={pillar}
        onChange={(event) => handlePillarChange(event.target.value)}
        aria-label="Filter results by pillar"
        className="w-full"
      >
        {pillarOptions.map((option) => (
          <ExperienceSelectOption key={option.value} value={option.value}>
            {option.label}
          </ExperienceSelectOption>
        ))}
      </ExperienceSelect>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <header
        className="flex min-h-16 shrink-0 items-center gap-4 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: bigScreenTheme.card_primary_border_color }}
      >
        <h1 className="m-0 text-sm font-semibold tracking-[0.16em] uppercase">
          Reveal
        </h1>

        <span
          className="h-4 w-px"
          style={{ backgroundColor: bigScreenTheme.card_primary_border_color }}
          aria-hidden="true"
        />

        <p
          className="m-0 text-sm tabular-nums"
          style={{ color: bigScreenTheme.txt_secondary_color }}
          aria-live="polite"
        >
          {isPending
            ? "Loading results"
            : ideas.length > 0
              ? `Idea ${boundedIndex + 1} of ${ideas.length}`
              : "No ideas"}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:overflow-hidden">
        <div className="relative flex min-h-[48dvh] items-center justify-center overflow-hidden bg-neutral-950 p-12 sm:p-16 lg:min-h-0">
          {idea ? (
            idea.imageFileName?.trim() ? (
              <img
                src={idea.imageFileName}
                alt={`${idea.title || "Untitled"} submission`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-neutral-500">
                <ImageIcon className="size-12" aria-hidden="true" />
                <span>No image available</span>
              </div>
            )
          ) : (
            <p className="m-0 text-neutral-400">
              {isPending
                ? "Loading results…"
                : isError
                  ? "Couldn't load results."
                  : "No ideas match these filters."}
            </p>
          )}

          <button
            type="button"
            className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-25 sm:left-6 sm:size-12"
            aria-label="View previous idea"
            disabled={!hasPrevious}
            onClick={() => setIdeaIndex(boundedIndex - 1)}
          >
            <ChevronLeftIcon className="size-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-25 sm:right-6 sm:size-12"
            aria-label="View next idea"
            disabled={!hasNext}
            onClick={() => setIdeaIndex(boundedIndex + 1)}
          >
            <ChevronRightIcon className="size-6" aria-hidden="true" />
          </button>
        </div>

        <aside
          className="min-w-0 border-t lg:overflow-y-auto lg:border-t-0 lg:border-l"
          style={{ borderColor: bigScreenTheme.card_primary_border_color }}
        >
          <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
            {filters}

            {idea && (
              <>
                <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-col">
                  {idea.CreatedDttm && (
                    <p
                      className="m-0 text-sm leading-6"
                      style={{ color: bigScreenTheme.txt_secondary_color }}
                    >
                      {formatRelativeDate(idea.CreatedDttm)}
                    </p>
                  )}
                  <h2 className="m-0 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
                    {idea.title || "Untitled"}
                  </h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-900">
                    <UsersIcon className="size-3.5" aria-hidden="true" />
                    {idea.teamName || "Unknown team"}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                    style={{
                      borderColor: bigScreenTheme.card_primary_border_color,
                    }}
                  >
                    <ShapesIcon className="size-3.5" aria-hidden="true" />
                    {idea.Category || "Unknown pillar"}
                  </span>
                  {idea.flgCoach && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-white">
                      <SparklesIcon className="size-3.5" aria-hidden="true" />
                      Sharpened
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                    <ThumbsUpIcon
                      className="size-3.5"
                      fill="currentColor"
                      aria-hidden="true"
                    />
                    {idea.totalVote ?? 0}{" "}
                    {idea.totalVote === 1 ? "vote" : "votes"}
                  </span>
                </div>

                <div
                  className="my-8 border-t"
                  style={{
                    borderColor: bigScreenTheme.card_primary_border_color,
                  }}
                />

                <p
                  className="m-0 text-base leading-7 whitespace-pre-line"
                  style={{ color: bigScreenTheme.txt_secondary_color }}
                >
                  {idea.Desc}
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function IdeaCard({
  idea,
  showVotes,
  onView,
}: {
  idea: IdeaScreen
  showVotes: boolean
  onView: () => void
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs"
      style={{ borderColor: bigScreenTheme.card_primary_border_color }}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        <IdeaThumbnail idea={idea} />

        {showVotes && (
          <span className="absolute top-2 right-2 text-right text-white [text-shadow:0_1px_4px_rgb(0_0_0_/_0.6)]">
            <span className="block text-2xl leading-none font-black">
              {String(idea.TotalVote ?? idea.Votes ?? 0).padStart(2, "0")}
            </span>
            <span className="block text-[10px] font-semibold tracking-wider uppercase">
              Votes
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {idea.flgCoach && (
          <div className="flex justify-end">
            <SparklesIcon className="size-5" aria-hidden="true" />
          </div>
        )}

        <div>
          <h2 className="text-xl leading-tight font-bold uppercase">
            {idea.title || "Untitled"}
          </h2>
          {idea.CreatedDttm && (
            <p className="text-sm text-neutral-500">
              {formatRelativeDate(idea.CreatedDttm)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1">
            <UsersIcon className="size-3.5" aria-hidden="true" />
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
            <ShapesIcon className="size-3.5" aria-hidden="true" />
            {idea.Category || "Unknown pillar"}
          </span>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-500">{idea.Desc}</p>

        <ExperienceButton
          workshop={bigScreenTheme}
          variant="primary"
          className="mt-auto flex w-28 items-center justify-center gap-2"
          onClick={onView}
        >
          <EyeIcon className="size-4" aria-hidden="true" />
          Present
        </ExperienceButton>
      </div>
    </div>
  )
}

function IdeaThumbnail({ idea }: { idea: IdeaScreen }) {
  if (!idea.imageFileName?.trim()) {
    return (
      <div
        className="flex size-full items-center justify-center text-neutral-400"
        aria-label={`${idea.title || "Untitled"} thumbnail unavailable`}
      >
        <ImageIcon className="size-8" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={idea.imageFileName}
      alt={`${idea.title || "Untitled"} submission thumbnail`}
      className="size-full object-cover"
    />
  )
}
