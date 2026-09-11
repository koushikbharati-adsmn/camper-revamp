import { useState, type FormEvent } from "react"
import { QRCodeSVG } from "qrcode.react"

import ActivityList from "../../components/ActivityList/ActivityList"
import Button from "../../components/Button/Button"
import FieldInput from "../../components/FieldInput/FieldInput"
import IdeaViewModal from "../../components/IdeaViewModal/IdeaViewModal"
import IdeaVoteCard from "../../components/IdeaVoteCard/IdeaVoteCard"
import ModalOverlay from "../../components/ModalOverlay/ModalOverlay"
import NewsroomStats from "../../components/NewsroomStats/NewsroomStats"
import NewsroomStatsSummary from "../../components/NewsroomStats/NewsroomStatsSummary"
import TextArea from "../../components/TextArea/TextArea"
import TickerMarqueeSection from "../../components/TickerSection/TickerMarqueeSection"

import Select from "../../components/Select/Select"
import "../StagePage/StagePage.css"
import "./BigScreen.css"

// --------------------------------------------------
// Options
// --------------------------------------------------

const teamOptions = [
  { label: "All teams", value: "all" },
  { label: "Team 1", value: "team-1" },
  { label: "Team 2", value: "team-2" },
  { label: "Team 3", value: "team-3" },
  { label: "Team 4", value: "team-4" },
]

const pillarOptions = [
  { label: "All pillars", value: "all" },
  { label: "Pillar 1", value: "pillar-1" },
  { label: "Pillar 2", value: "pillar-2" },
]

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

const ideas = Array.from({ length: 5 }, (_, index) => ({
  title: "Idea Title",
  description:
    "Some quick example text to build on the card title and make up the bulk of the card's content.",
  age: `${index + 2} minutes ago`,
  votes: 0,
}))

// --------------------------------------------------
// Big Screen
// --------------------------------------------------

type BigScreenProps = {
  workshopId: string
}

export default function BigScreen({ workshopId }: BigScreenProps) {
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
    <div className="big-screen-root">
      <div className="big-screen-page">
        <div className="container">
          <div className="big-screen-page__inner">
            <div className="big-screen_slider">
              {/* ==========================================
                  HEADER
              ========================================== */}

              <div className="big-screen__header">
                <div className="big-screen__intro">
                  <div className="sectionTitle grid gap-1">
                    <h1 className="headTitle">WORKSHOP 1.</h1>
                    <p className="description">SHARE YOUR BEST THINKING</p>
                  </div>
                  <div className="toolbarBlock">
                    {/* Timer */}
                    {currentPage === "bigscreen2" && (
                      <div
                        className="sectionTwo__timer"
                        aria-label="Workshop time remaining"
                      >
                        00:00:00
                      </div>
                    )}

                    {/* Filters */}
                    {currentPage === "bigscreen1" && (
                      <div className="big-screen__filters">
                        <Select
                          options={teamOptions}
                          value={team}
                          onChange={(event) => setTeam(event.target.value)}
                          aria-label="Select team"
                        />

                        <Select
                          options={pillarOptions}
                          value={pillar}
                          onChange={(event) => setPillar(event.target.value)}
                          aria-label="Select pillar"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="rightHeader grid">
                  <NewsroomStatsSummary metrics={teams} values={[0, 0, 0, 0]} />
                </div>
              </div>

              {/* ==========================================
                  MAIN CONTENT
              ========================================== */}

              <div className="section-slider">
                {/* ==========================================
                    SHARED NAVIGATION
                    Same position for Next / Previous
                ========================================== */}

                <div className="section-slider__navigation">
                  {currentPage === "bigscreen1" ? (
                    <button
                      type="button"
                      className="section-slider__nav-button"
                      onClick={() => setCurrentPage("bigscreen2")}
                      aria-label="Go to next screen"
                    >
                      <span>Next</span>
                      <span
                        className="section-slider__arrow"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="section-slider__nav-button"
                      onClick={() => setCurrentPage("bigscreen1")}
                      aria-label="Go to previous screen"
                    >
                      <span
                        className="section-slider__arrow"
                        aria-hidden="true"
                      >
                        ←
                      </span>
                      <span>Previous</span>
                    </button>
                  )}
                </div>

                {/* ==========================================
                    PAGE CONTENT
                ========================================== */}

                <div className="section-slider__page" aria-label={currentPage}>
                  {currentPage === "bigscreen1" ? (
                    /* =====================================
                       SECTION ONE
                    ===================================== */

                    <div
                      className="sectionOne section-slider__fade"
                      key="bigscreen1"
                    >
                      {/* Idea Grid */}

                      <div className="big-screen__board" aria-label="Ideas">
                        <div className="big-screen__board-container">
                          {ideas.map((idea, index) => (
                            <div
                              key={`${idea.title}-${index}`}
                              className="big-screen__card"
                            >
                              <IdeaVoteCard
                                showSparkles={false}
                                showEdit={false}
                                {...idea}
                                image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80"
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
                      className="sectionTwo section-slider__fade"
                      key="bigscreen2"
                    >
                      {/* Left Content */}

                      <div className="sectionTwo__left">
                        {!showLatestActivity && (
                          <div
                            className="sectionTwo__qr"
                            id="scan-qr"
                            aria-label="Scan QR code"
                          >
                            <QRCodeSVG
                              value={participantsUrl}
                              title="Scan to join the workshop"
                              className="sectionTwo__qrImage"
                              size={1000}
                              marginSize={2}
                              level="H"
                              fgColor="#000000"
                              bgColor="#ffffff"
                            />
                          </div>
                        )}

                        {showLatestActivity ? (
                          <div className="sectionTwo__activity-content">
                            <ActivityList
                              activities={activities}
                              showTooltip
                              onShowScanQr={() => setShowLatestActivity(false)}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="sectionTwo__activity max-w-[60%]"
                            onClick={() => setShowLatestActivity(true)}
                          >
                            Show Latest Activity
                          </button>
                        )}
                      </div>

                      {/* Right Content */}

                      <div className="sectionTwo__right">
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
        className="big-screen__view-modal"
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
        className="stage-page__idea-modal"
      >
        <h3 className="stage-page__selected-pillar">
          {selectedPillar?.label ?? "All pillars"}
        </h3>

        <form className="stage-page__idea-form" onSubmit={handleIdeaSubmit}>
          <div className="stage-page__idea-fields">
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

          <div className="stage-page__idea-fields">
            <label className="flex gap-2">
              Add Title <span>(Optional)</span>
            </label>

            <FieldInput
              value={ideaTitle}
              onChange={(event) => setIdeaTitle(event.target.value)}
              placeholder="Enter a Title"
            />
          </div>

          <div className="stage-page__idea-fields">
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
            className="stage-page__submit-button w-full!"
          >
            {editingIdea ? "Save Changes" : "Submit"}
          </Button>
        </form>
      </ModalOverlay>
    </div>
  )
}
