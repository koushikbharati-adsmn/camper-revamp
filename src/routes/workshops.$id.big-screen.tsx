import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { QRCodeSVG } from "qrcode.react"
import {
  EyeIcon,
  ImageIcon,
  InfoIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react"

import { formatRelativeDate } from "@/lib/date"
import { getDurationParts } from "@/lib/utils"
import { useWorkshopTimer } from "@/hooks/use-workshop-timer"
import {
  type IdeaScreen,
  getActivitiesOptions,
  getDashboardOptions,
  getIdeasScreenOptions,
  getWorkshopScreenOptions,
  ideScreenKeys,
} from "@/services/big-screen"
import {
  type ParticipantWorkshop,
  useShortlistIdea,
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
  // Shortlist (same endpoint/behavior as the participant stage screen)
  // --------------------------------------------------

  const queryClient = useQueryClient()
  const shortlistIdeaMutation = useShortlistIdea()

  const toggleShortlist = async (idea: IdeaScreen) => {
    try {
      await shortlistIdeaMutation.mutateAsync({
        workshop_code: workshopId,
        idea_id: idea.ID,
        flag: !idea.flgTeam,
      })

      await queryClient.invalidateQueries({ queryKey: ideScreenKeys.all })
    } catch {
      return
    }
  }

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

  return (
    <div className="flex h-dvh flex-col bg-neutral-100">
      <main className="flex-1 overflow-y-auto py-3">
        <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-[6%]">
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
                  <p className="m-0 text-sm text-neutral-500">Loading ideas…</p>
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

                <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ideas.map((idea, index) => (
                    <IdeaCard
                      key={`${idea.title}-${index}`}
                      idea={idea}
                      isShortlistPending={shortlistIdeaMutation.isPending}
                      onView={() => setSelectedIdeaIndex(index)}
                      onToggleShortlist={() => void toggleShortlist(idea)}
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
                          borderColor: bigScreenTheme.card_primary_border_color,
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
        onClose={() => setSelectedIdeaIndex(null)}
        onNext={() =>
          setSelectedIdeaIndex(((selectedIdeaIndex ?? 0) + 1) % ideas.length)
        }
      />
    </div>
  )
}

function IdeaCard({
  idea,
  isShortlistPending,
  onView,
  onToggleShortlist,
}: {
  idea: IdeaScreen
  isShortlistPending: boolean
  onView: () => void
  onToggleShortlist: () => void
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs"
      style={{ borderColor: bigScreenTheme.card_primary_border_color }}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        <IdeaThumbnail idea={idea} />

        <span className="absolute top-2 right-2 text-right text-white [text-shadow:0_1px_4px_rgb(0_0_0_/_0.6)]">
          <span className="block text-2xl leading-none font-black">
            {String(idea.Votes ?? 0).padStart(2, "0")}
          </span>
          <span className="block text-[10px] font-semibold tracking-wider uppercase">
            Votes
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={
              idea.flgTeam
                ? `Remove ${idea.title || "idea"} from shortlist`
                : `Shortlist ${idea.title || "idea"}`
            }
            aria-pressed={Boolean(idea.flgTeam)}
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
          {idea.flgCoach && (
            <SparklesIcon className="size-5" aria-hidden="true" />
          )}
        </div>

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
          <span className="rounded-full bg-neutral-100 px-2.5 py-1">
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="rounded-full border px-2.5 py-1">
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
