import { IconEdit, IconSparkles, IconStar } from "@tabler/icons-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

import Button from "./Button"

type IdeaVoteCardProps = {
  votes?: number
  title?: string
  description?: string
  age?: string
  image?: string
  className?: string
  onView?: () => void
  onEdit?: () => void
  viewLabel?: string
  onSparkles?: () => void
  showEdit?: boolean
  showSparkles?: boolean
}

const actionButtonClassName =
  "text-theme1 hover:bg-theme5 relative -m-1.5 flex size-8 items-center justify-center rounded-full transition-colors duration-200"

export default function IdeaVoteCard({
  votes = 0,
  title = "Idea Title",
  description = "Some quick example text to build on the card title and make up the bulk of the card's content.",
  age = "2 minutes ago",
  image,
  className,
  onView,
  onEdit,
  viewLabel = "View",
  onSparkles,
  showEdit = true,
  showSparkles = true,
}: IdeaVoteCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [, setShowSparklesConfetti] = useState(false)

  const handleFavorite = () => {
    setIsFavorite((favorite) => {
      const nextFavorite = !favorite
      if (nextFavorite) {
        setShowConfetti(true)
        window.setTimeout(() => setShowConfetti(false), 700)
      }
      return nextFavorite
    })
  }

  const handleSparkles = () => {
    setShowSparklesConfetti(false)

    // Allows animation to restart on every click
    window.requestAnimationFrame(() => {
      setShowSparklesConfetti(true)

      window.setTimeout(() => {
        setShowSparklesConfetti(false)
      }, 700)
    })

    onSparkles?.()
  }

  return (
    <div
      className={cn(
        "border-theme4 bg-theme2 text-theme1 flex h-full w-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      <div className="bg-theme5 relative grid aspect-4/3 h-auto justify-items-end overflow-hidden px-3 py-2">
        {image && (
          <img
            className="absolute inset-0 aspect-4/3 h-full w-full object-cover"
            src={image}
            alt=""
          />
        )}
        <div
          className="from-theme1/85 via-theme1/15 absolute inset-0 z-999 bg-linear-to-t to-transparent"
          aria-hidden="true"
        />
        <div className="relative z-999 flex flex-col text-center">
          <h2 className="font-phudu-b text-4xl text-theme2 m-0 leading-normal">
            {String(votes).padStart(2, "0")}
          </h2>
          <span className="text-xs text-theme2 leading-normal tracking-widest uppercase">
            VOTES
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="text-theme1 flex justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                actionButtonClassName,
                "transition-transform duration-200",
                isFavorite && "scale-110 text-red-500"
              )}
              onClick={handleFavorite}
              aria-label={isFavorite ? "Unfavorite idea" : "Favorite idea"}
              aria-pressed={isFavorite}
            >
              <IconStar
                size={20}
                stroke={1.8}
                fill={isFavorite ? "currentColor" : "none"}
              />
              {showConfetti && (
                <span
                  className="pointer-events-none absolute -top-3 left-1/2 text-[18px] text-yellow-500 animate-[vote-card-confetti_700ms_ease-out_forwards]"
                  aria-hidden="true"
                >
                  ✦
                </span>
              )}
            </button>
            {showEdit && (
              <button
                type="button"
                className={actionButtonClassName}
                onClick={onEdit}
                aria-label="Edit idea"
              >
                <IconEdit size={20} stroke={1.8} />
              </button>
            )}
          </div>
          <div>
            {showSparkles && (
              <button
                type="button"
                onClick={handleSparkles}
                className={actionButtonClassName}
                aria-label="AI suggestions"
              >
                <IconSparkles size={20} stroke={1.8} />
              </button>
            )}
          </div>
        </div>
        <h2 className="font-phudu-b text-2xl text-theme1 m-0 line-clamp-1 overflow-hidden leading-[1.1] text-ellipsis whitespace-nowrap">
          {title}
        </h2>
        <small className="text-sm text-theme9 min-h-5 tracking-wider">{age}</small>
        <p className="text-base font-ogilvy-r text-theme3 m-0 line-clamp-3 flex-1 overflow-hidden leading-normal text-ellipsis">
          {description}
        </p>
        <div>
          <Button type="button" className="w-fit" onClick={onView}>
            {viewLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
