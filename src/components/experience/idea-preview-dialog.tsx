import { useEffect, useRef, type KeyboardEvent } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  ShapesIcon,
  SparklesIcon,
  ThumbsUpIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { formatRelativeDate } from "@/lib/date"
import type { IdeaScreen } from "@/services/big-screen"
import type { ParticipantWorkshop } from "@/services/participants"

// Full-screen presenter for the big screen. Mirrors the native <dialog>
// idea preview used in the participants route (image stage with prev/next
// arrows on the left, idea details on the right), styled with the
// big-screen palette passed in via `workshop`.
export function IdeaPreviewDialog({
  idea,
  workshop,
  showVotes,
  position,
  total,
  hasPrevious,
  hasNext,
  onClose,
  onPrevious,
  onNext,
}: {
  idea?: IdeaScreen
  workshop: ParticipantWorkshop
  showVotes: boolean
  position: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (idea && !dialog.open) {
      dialog.showModal()
    }

    if (!idea && dialog.open) {
      dialog.close()
    }
  }, [idea])

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
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-black/70"
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      {idea && (
        <div
          className="flex h-full max-h-dvh min-h-0 flex-col overflow-hidden"
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            color: workshop.txt_primary_color,
          }}
        >
          <header
            className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6"
            style={{ borderColor: workshop.card_primary_border_color }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.16em] uppercase">
                Present
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
              onClick={() => dialogRef.current?.close()}
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:overflow-hidden">
            <div className="relative flex min-h-[48dvh] items-center justify-center overflow-hidden bg-neutral-950 p-12 sm:p-16 lg:min-h-0">
              <IdeaPreviewThumbnail idea={idea} />

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
                  {idea.CreatedDttm && (
                    <p
                      className="text-sm leading-6"
                      style={{ color: workshop.txt_secondary_color }}
                    >
                      Submitted {formatRelativeDate(idea.CreatedDttm)}
                    </p>
                  )}

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
                    {idea.Category || "Unknown pillar"}
                  </span>

                  {idea.flgCoach && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-white">
                      <SparklesIcon className="size-3.5" aria-hidden="true" />
                      Sharpened
                    </span>
                  )}

                  {showVotes && !!(idea.TotalVote ?? idea.Votes) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                      <ThumbsUpIcon
                        className="size-3.5"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                      {idea.TotalVote ?? idea.Votes}{" "}
                      {(idea.TotalVote ?? idea.Votes) === 1 ? "vote" : "votes"}
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
      )}
    </dialog>
  )
}

function IdeaPreviewThumbnail({ idea }: { idea: IdeaScreen }) {
  if (!idea.imageFileName?.trim()) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-neutral-500"
        aria-label={`${idea.title || "Untitled"} image unavailable`}
      >
        <ImageIcon className="size-12" aria-hidden="true" />
        <span>No image available</span>
      </div>
    )
  }

  return (
    <img
      src={idea.imageFileName}
      alt={`${idea.title || "Untitled"} submission`}
      className="max-h-full max-w-full object-contain"
    />
  )
}
