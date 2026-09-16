import { useMemo, useState, type FormEvent } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { formatRelativeDate } from "@/lib/date"
import { getIdeasOptions, getWorkshopOptions } from "@/services/bigscreen"

import ActivityList from "@/components/ActivityList/ActivityList"
import Button from "@/components/Button/Button"
import FieldInput from "@/components/FieldInput/FieldInput"
import IdeaViewModal from "@/components/IdeaViewModal/IdeaViewModal"
import IdeaVoteCard from "@/components/IdeaVoteCard/IdeaVoteCard"
import ModalOverlay from "@/components/ModalOverlay/ModalOverlay"
import NewsroomStats from "@/components/NewsroomStats/NewsroomStats"
import NewsroomStatsSummary from "@/components/NewsroomStats/NewsroomStatsSummary"
import Select from "@/components/Select/Select"
import TextArea from "@/components/TextArea/TextArea"
import TickerMarqueeSection from "@/components/TickerSection/TickerMarqueeSection"

export const Route = createFileRoute("/workshops/$id/big-screen")({
  component: RouteComponent,
})

// --------------------------------------------------
// Dummy Data
// --------------------------------------------------

const teams = ["Draft", "Shortlisted", "Sharpened", "Total Ideas"]

const teamStats = ["Team 1", "Team 2", "Team 3", "Team 4"].map((title) => ({
  title,
  submitted: 0,
  shortlisted: 0,
  sharpened: 0,
  total: 0,
}))

const activities = [1, 2, 3, 4].map((id) => ({
  id,
  message: "Notification",
  detail: "This is a notification",
}))

// "all" is the local sentinel for the unfiltered dropdown option — every
// other value is a real (encrypted) team/category ID from getWorkshopOptions,
// passed straight through to GET /api/big/idea, which decrypts it server-side.
const toFilterId = (value: string) => (value === "all" ? undefined : value)

// --------------------------------------------------
// Big Screen
// --------------------------------------------------

function RouteComponent() {
  const { id: workshopId } = Route.useParams()
  const participantsUrl = `${window.location.origin}/workshops/${workshopId}/participants`

  const [team, setTeam] = useState("all")
  const [pillar, setPillar] = useState("all")

  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(
    null
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [ideaTitle, setIdeaTitle] = useState("")
  const [ideaDescription, setIdeaDescription] = useState("")

  const [showLatestActivity, setShowLatestActivity] = useState(false)

  const [currentPage, setCurrentPage] = useState<"bigscreen1" | "bigscreen2">(
    "bigscreen1"
  )

  // --------------------------------------------------
  // Workshop
  // --------------------------------------------------

  const { data: workshopResponse } = useQuery(getWorkshopOptions(workshopId))
  const workshop = workshopResponse?.data

  const teamOptions = useMemo(
    () => [
      { label: "All teams", value: "all" },
      ...(workshop?.teams.map((team) => ({
        label: team.TeamName,
        value: team.ID,
      })) ?? []),
    ],
    [workshop]
  )

  const pillarOptions = useMemo(
    () => [
      { label: "All pillars", value: "all" },
      ...(workshop?.categories.map((category) => ({
        label: category.Name,
        value: category.ID,
      })) ?? []),
    ],
    [workshop]
  )

  // --------------------------------------------------
  // Ideas
  // --------------------------------------------------

  const {
    data: ideasResponse,
    isLoading: isIdeasLoading,
    isError: isIdeasError,
  } = useQuery(
    getIdeasOptions({
      workshop_code: workshopId,
      category_id: toFilterId(pillar),
      team_id: toFilterId(team),
    })
  )

  const ideas = useMemo(
    () =>
      (ideasResponse?.data ?? []).map((idea) => ({
        title: idea.TeamName,
        description: idea.Desc,
        age: idea.CreatedDttm ? formatRelativeDate(idea.CreatedDttm) : undefined,
        votes: idea.Votes ?? 0,
        image: idea.imageFileName ?? undefined,
      })),
    [ideasResponse]
  )

  // --------------------------------------------------
  // Selected Idea
  // --------------------------------------------------

  const selectedIdea =
    selectedIdeaIndex === null ? undefined : ideas[selectedIdeaIndex]

  const selectedPillar = pillarOptions.find((option) => option.value === pillar)

  // --------------------------------------------------
  // Idea Submit
  // --------------------------------------------------

  const handleIdeaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsLoading(false)
    setIsModalOpen(false)
    setEditingIdea(false)
  }

  // --------------------------------------------------
  // Edit Idea
  // --------------------------------------------------

  const handleEditIdea = (index: number) => {
    const idea = ideas[index]

    setIdeaTitle(idea.title)
    setIdeaDescription(idea.description)

    setEditingIdea(true)
    setIsModalOpen(true)
  }

  // --------------------------------------------------
  // Close Modal
  // --------------------------------------------------

  const handleCloseIdeaModal = () => {
    setIsModalOpen(false)
    setEditingIdea(false)
  }

  return (
    <div className="contents font-ogilvy-r text-base tracking-wide">
      <div className="flex min-h-dvh w-full flex-1 flex-col overflow-y-auto bg-theme6/25 py-3 pb-14">
        <div className="mx-auto flex w-full flex-1 items-start px-4 lg:px-[8%]">
          <div className="flex w-full flex-col rounded-2xl bg-theme2 p-3 shadow-sm md:p-4 lg:p-5">
            <div className="flex w-full min-w-0 flex-col gap-3 md:gap-4">
              {/* ==========================================
                  HEADER
              ========================================== */}

              <div className="grid h-auto w-full grid-cols-1 items-stretch gap-3 md:gap-4 xl:min-h-[25dvh] xl:grid-cols-[30%_minmax(0,1fr)] xl:gap-8">
                <div className="grid min-w-0 content-between gap-3">
                  <div className="grid gap-1">
                    <h1 className="m-0 line-clamp-2 font-phudu-black text-2xl leading-normal md:text-4xl">
                      {workshop?.Name ?? "Workshop"}
                    </h1>
                    <p className="m-0 line-clamp-2 font-ogilvy-r text-sm leading-[1.4] font-medium tracking-wide text-theme1 uppercase">
                      SHARE YOUR BEST THINKING
                    </p>
                  </div>
                  {/*
                    Fixed height so the toolbar takes up the same space
                    whether it's showing the (short) filters on screen 1 or
                    the (tall) timer on screen 2 — otherwise the header row,
                    and the stat tiles stretched to match it, resize every
                    time Next/Previous is pressed.
                  */}
                  <div className="flex min-h-14 w-full flex-wrap items-center gap-3 md:min-h-20">
                    {/* Timer */}
                    {currentPage === "bigscreen2" && (
                      <div
                        className="w-full rounded-2xl bg-theme1 p-4 text-center font-phudu-b text-2xl leading-none tracking-widest text-theme2 shadow-sm md:text-5xl"
                        aria-label="Workshop time remaining"
                      >
                        00:00:00
                      </div>
                    )}

                    {/* Filters */}
                    {currentPage === "bigscreen1" && (
                      <div className="flex w-full flex-wrap items-center gap-2">
                        <Select
                          options={teamOptions}
                          value={team}
                          onChange={setTeam}
                          aria-label="Select team"
                        />

                        <Select
                          options={pillarOptions}
                          value={pillar}
                          onChange={setPillar}
                          aria-label="Select pillar"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid">
                  <NewsroomStatsSummary metrics={teams} values={[0, 0, 0, 0]} />
                </div>
              </div>

              {/* ==========================================
                  MAIN CONTENT
              ========================================== */}

              <div className="flex w-full min-w-0 flex-col">
                {/* ==========================================
                    SHARED NAVIGATION
                    Same position for Next / Previous
                ========================================== */}

                <div className="mb-3 flex w-full items-center justify-end md:mb-4">
                  {currentPage === "bigscreen1" ? (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-theme7 bg-theme1 px-3 py-2 font-ogilvy-r text-base text-theme2 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 md:px-6 md:py-3"
                      onClick={() => setCurrentPage("bigscreen2")}
                      aria-label="Go to next screen"
                    >
                      <span>Next</span>
                      <span className="inline-flex items-center justify-center" aria-hidden="true">
                        →
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-theme7 bg-theme1 px-3 py-2 font-ogilvy-r text-base text-theme2 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 md:px-6 md:py-3"
                      onClick={() => setCurrentPage("bigscreen1")}
                      aria-label="Go to previous screen"
                    >
                      <span className="inline-flex items-center justify-center" aria-hidden="true">
                        ←
                      </span>
                      <span>Previous</span>
                    </button>
                  )}
                </div>

                {/* ==========================================
                    PAGE CONTENT
                ========================================== */}

                <div className="relative w-full min-w-0" aria-label={currentPage}>
                  {currentPage === "bigscreen1" ? (
                    /* =====================================
                       SECTION ONE
                    ===================================== */

                    <div
                      className="relative flex w-full min-w-0 flex-col animate-[big-screen-section-fade_0.4s_ease-out_both] motion-reduce:animate-none"
                      key="bigscreen1"
                    >
                      {/* Idea Grid */}

                      <div className="w-full max-w-full min-w-0" aria-label="Ideas">
                        {isIdeasLoading && (
                          <p className="m-0 font-ogilvy-r text-sm text-theme1">
                            Loading ideas…
                          </p>
                        )}

                        {isIdeasError && (
                          <p className="m-0 font-ogilvy-r text-sm text-theme1">
                            Couldn't load ideas. Please try again.
                          </p>
                        )}

                        {!isIdeasLoading && !isIdeasError && ideas.length === 0 && (
                          <p className="m-0 font-ogilvy-r text-sm text-theme1">
                            No ideas submitted yet.
                          </p>
                        )}

                        <div className="grid w-full min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5">
                          {ideas.map((idea, index) => (
                            <div
                              key={`${idea.title}-${index}`}
                              className="min-w-0 overflow-hidden rounded-2xl border border-theme7 bg-theme2 transition-all duration-300 hover:-translate-y-1 [&_.idea-vote-card]:h-full [&_.idea-vote-card]:rounded-none [&_.idea-vote-card]:border-0 [&_.idea-vote-card]:shadow-none [&_.idea-vote-card]:transition-none [&_.idea-vote-card:hover]:translate-y-0 [&_.idea-vote-card:hover]:shadow-none"
                            >
                              <IdeaVoteCard
                                showSparkles={false}
                                showEdit={false}
                                {...idea}
                                image={
                                  idea.image ??
                                  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80"
                                }
                                viewLabel="Present"
                                onView={() => setSelectedIdeaIndex(index)}
                                onEdit={() => handleEditIdea(index)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* =====================================
                       SECTION TWO
                    ===================================== */

                    <div
                      className="grid w-full min-w-0 grid-cols-1 items-start gap-4 animate-[big-screen-section-fade_0.4s_ease-out_both] motion-reduce:animate-none lg:grid-cols-[25%_minmax(0,1fr)] lg:gap-x-8"
                      key="bigscreen2"
                    >
                      {/* Left Content */}

                      <div className="flex min-w-0 flex-col items-center gap-4">
                        {!showLatestActivity && (
                          <div
                            className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-theme2 p-4 shadow-sm"
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
                        )}

                        {showLatestActivity ? (
                          <div className="relative flex w-full min-w-0 flex-col">
                            <ActivityList
                              activities={activities}
                              showTooltip
                              onShowScanQr={() => setShowLatestActivity(false)}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="max-w-[60%] cursor-pointer rounded-full bg-theme1 px-3 py-2 font-ogilvy-r text-base whitespace-nowrap text-theme2 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                            onClick={() => setShowLatestActivity(true)}
                          >
                            Show Latest Activity
                          </button>
                        )}
                      </div>

                      {/* Right Content */}

                      <div className="flex min-w-0 items-start">
                        <NewsroomStats teams={teamStats} showSummary={false} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <TickerMarqueeSection />
      </div>

      {/* ==========================================
          PRESENT MODAL
      ========================================== */}

      <IdeaViewModal
        isOpen={selectedIdea !== undefined}
        onClose={() => setSelectedIdeaIndex(null)}
        idea={selectedIdea}
        pillarLabel={selectedPillar?.label}
        className="w-full max-w-5xl rounded-2xl [&_.modal-overlay__header]:absolute [&_.modal-overlay__header]:top-4 [&_.modal-overlay__header]:right-4 [&_.modal-overlay__header]:z-10 [&_.modal-overlay__close]:bg-theme10"
        onNext={() =>
          setSelectedIdeaIndex(((selectedIdeaIndex ?? 0) + 1) % ideas.length)
        }
      />

      {/* ==========================================
          EDIT IDEA MODAL
      ========================================== */}

      <ModalOverlay
        isOpen={isModalOpen}
        onClose={handleCloseIdeaModal}
        title={editingIdea ? "Edit Idea" : "Add New Idea"}
      >
        <h3 className="m-0 font-phudu-b text-lg text-theme1">
          {selectedPillar?.label ?? "All pillars"}
        </h3>

        <form className="grid gap-4" onSubmit={handleIdeaSubmit}>
          <div className="grid gap-2">
            <label>
              <TextArea
                aria-label="Idea description"
                placeholder="Enter your idea here"
                rows={4}
                value={ideaDescription}
                onChange={(event) => setIdeaDescription(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="grid gap-2">
            <label className="flex gap-2">
              Add Title <span>(Optional)</span>
            </label>

            <FieldInput
              value={ideaTitle}
              onChange={(event) => setIdeaTitle(event.target.value)}
              placeholder="Enter a Title"
            />
          </div>

          <div className="grid gap-2">
            <label className="flex gap-2">
              Add Context <span>(Optional)</span>
            </label>

            <TextArea
              aria-label="Add context"
              placeholder="Enter a context"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full!"
          >
            {editingIdea ? "Save Changes" : "Submit"}
          </Button>
        </form>
      </ModalOverlay>
    </div>
  )
}
