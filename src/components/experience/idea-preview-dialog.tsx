import { useEffect, useRef } from "react"
import {
  ImageIcon,
  ShapesIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { formatRelativeDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { IdeaScreen } from "@/services/big-screen"
import type { ParticipantWorkshop } from "@/services/participants"
import { ExperienceButton } from "@/components/experience/experience-button"

// No predefined modal component exists in the Experience library yet, so
// this mirrors the native <dialog> pattern already used for idea previews
// in the participants route, styled with the big-screen palette passed in
// via `workshop`. Used only by the big-screen route.
export function IdeaPreviewDialog({
  idea,
  workshop,
  onClose,
  onNext,
}: {
  idea?: IdeaScreen
  workshop: ParticipantWorkshop
  onClose: () => void
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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idea-preview-title"
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none",
        "overflow-hidden border-0 bg-transparent p-0 backdrop:bg-black/50",
        // Wide and flat on larger screens — capped by both a viewport-relative
        // and an absolute max-height so it stays landscape-proportioned
        // instead of growing tall on short/small viewports.
        "sm:m-auto sm:h-fit sm:max-h-[min(90dvh,48rem)]",
        "sm:w-[min(70rem,calc(100%-2rem))]"
      )}
      onClose={onClose}
    >
      {idea && (
        <div
          className="flex h-full max-h-dvh min-h-0 flex-col overflow-hidden sm:h-auto sm:max-h-[min(90dvh,48rem)] sm:rounded-2xl sm:border sm:shadow-lg"
          style={{
            backgroundColor: workshop.card_primary_bg_color,
            borderColor: workshop.card_primary_border_color,
            color: workshop.txt_primary_color,
          }}
        >
          <header
            className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5 sm:py-3"
            style={{ borderColor: workshop.card_primary_border_color }}
          >
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <h2
                id="idea-preview-title"
                className="min-w-0 truncate text-xl leading-tight font-bold uppercase"
              >
                {idea.title || "Untitled"}
              </h2>

              {idea.CreatedDttm && (
                <p className="shrink-0 text-base text-neutral-500">
                  Submitted {formatRelativeDate(idea.CreatedDttm)}
                </p>
              )}
            </div>

            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-md border"
              style={{ borderColor: workshop.card_primary_border_color }}
              aria-label="Close idea preview"
              onClick={() => dialogRef.current?.close()}
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="aspect-4/3 max-h-128 overflow-hidden rounded-xl">
                <IdeaPreviewThumbnail idea={idea} />
              </div>

              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1">
                    <UsersIcon className="size-3.5" aria-hidden="true" />
                    {idea.TeamName || "Unknown team"}
                  </span>

                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"
                    style={{
                      borderColor: workshop.card_primary_border_color,
                    }}
                  >
                    <ShapesIcon className="size-3.5" aria-hidden="true" />
                    {idea.Category || "Unknown pillar"}
                  </span>

                  {idea.flgCoach && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-white">
                      <SparklesIcon className="size-3.5" aria-hidden="true" />
                      Sharpened
                    </span>
                  )}
                </div>

                <p className="text-base leading-relaxed whitespace-pre-line text-neutral-900">
                  {idea.Desc}
                </p>
              </div>
            </div>
          </div>

          <footer
            className="flex shrink-0 justify-end border-t px-4 py-2.5 sm:px-5 sm:py-3"
            style={{ borderColor: workshop.card_primary_border_color }}
          >
            <ExperienceButton workshop={workshop} onClick={onNext}>
              Next idea
            </ExperienceButton>
          </footer>
        </div>
      )}
    </dialog>
  )
}

function IdeaPreviewThumbnail({ idea }: { idea: IdeaScreen }) {
  if (!idea.imageFileName?.trim()) {
    return (
      <div
        className="flex size-full items-center justify-center bg-neutral-100 text-neutral-400"
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
      className="size-full object-contain"
    />
  )
}
