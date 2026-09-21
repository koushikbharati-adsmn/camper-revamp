import type { WorkshopActivity } from "@/services/big-screen"
import type { ParticipantWorkshop } from "@/services/participants"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ActivityTeamBadge } from "@/components/experience/activity-team-badge"

// Constant scroll speed in px/second, independent of how many activities exist.
const TICKER_SPEED = 60

const activitiesKey = (activities: WorkshopActivity[]) =>
  activities
    .map(
      (a) => `${a.CreatedDttm}|${a.TeamName}|${a.TeamColorCode}|${a.Message}`
    )
    .join("\n")

function TickerMarquee({ activities }: { activities: WorkshopActivity[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const pausedRef = useRef(false)
  const latestRef = useRef(activities)
  const displayedKeyRef = useRef(activitiesKey(activities))
  const [displayed, setDisplayed] = useState(activities)
  const [spacer, setSpacer] = useState(0)

  useEffect(() => {
    latestRef.current = activities
  }, [activities])

  // New data never touches the strip mid-scroll: it is swapped in only when a
  // loop wraps around, so the ticker never restarts or jumps halfway.
  useEffect(() => {
    let lastPhase = 0
    const id = setInterval(() => {
      const animation = animationRef.current
      const duration = Number(animation?.effect?.getTiming().duration)
      if (!animation || !(duration > 0)) return

      const phase = (Number(animation.currentTime ?? 0) % duration) / duration
      if (phase < lastPhase) {
        const next = latestRef.current
        const key = activitiesKey(next)
        if (key !== displayedKeyRef.current) {
          displayedKeyRef.current = key
          setDisplayed(next)
        }
      }
      lastPhase = phase
    }, 100)
    return () => clearInterval(id)
  }, [])

  // One loop = the activities plus a spacer. Unless the list is at least two
  // bars long, the spacer is one bar wide so the whole list scrolls fully off
  // the left edge before the next round enters from the right (a short list is
  // never shown twice at once). The animation runs on the compositor so it
  // stays smooth on low-end devices.
  useLayoutEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const content = contentRef.current
    if (!container || !track || !content) return

    const measure = () => {
      const contentWidth = content.getBoundingClientRect().width
      const containerWidth = container.getBoundingClientRect().width
      if (contentWidth === 0 || containerWidth === 0) return

      const nextSpacer = contentWidth < containerWidth * 2 ? containerWidth : 0
      setSpacer(nextSpacer)

      const loopWidth = contentWidth + nextSpacer
      const duration = (loopWidth / TICKER_SPEED) * 1000
      const previous = animationRef.current
      const previousDuration = Number(previous?.effect?.getTiming().duration)
      if (previous && Math.abs(previousDuration - duration) < 1) return

      const progress =
        previous && previousDuration > 0
          ? (Number(previous.currentTime ?? 0) % previousDuration) /
            previousDuration
          : 0

      previous?.cancel()

      // Keep the same position on the strip when the width changes (no restart)
      const animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(${-loopWidth}px, 0, 0)` },
        ],
        { duration, iterations: Infinity, easing: "linear" }
      )
      animation.currentTime = progress * duration
      if (pausedRef.current) animation.pause()
      animationRef.current = animation
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(content)
    return () => {
      observer.disconnect()
      animationRef.current?.cancel()
      animationRef.current = null
    }
  }, [])

  const setPaused = (paused: boolean) => {
    pausedRef.current = paused
    if (paused) animationRef.current?.pause()
    else animationRef.current?.play()
  }

  return (
    <div
      ref={containerRef}
      className="min-w-0 flex-1 overflow-hidden"
      // Mouse only: on touch devices "hover" sticks after a tap and freezes the ticker
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex w-max whitespace-nowrap will-change-transform"
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="pointer-events-none flex shrink-0 items-center select-none"
            aria-hidden={copy > 0}
          >
            <div
              ref={copy === 0 ? contentRef : undefined}
              className="flex shrink-0 items-center"
            >
              {displayed.map((activity, index) => (
                <div
                  key={`${copy}-${index}-${activity.CreatedDttm}`}
                  className="flex items-center gap-2 px-8"
                >
                  <ActivityTeamBadge
                    teamName={activity.TeamName}
                    teamColorCode={activity.TeamColorCode}
                  />

                  <span className="text-xs font-semibold">
                    {activity.Message}
                  </span>
                </div>
              ))}
            </div>

            {spacer > 0 && (
              <div className="shrink-0" style={{ width: spacer }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExperienceFooter({
  isPending,
  isError,
  activities,
  workshop,
}: {
  isPending: boolean
  isError: boolean
  activities: WorkshopActivity[]
  workshop: ParticipantWorkshop
}) {
  return (
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
        {activities.length > 0 ? (
          <TickerMarquee activities={activities} />
        ) : (
          <p className="px-8 text-xs font-semibold">
            {isPending
              ? "Loading latest activity..."
              : isError
                ? "Activity is temporarily unavailable."
                : "No activity yet."}
          </p>
        )}
      </div>
    </footer>
  )
}
