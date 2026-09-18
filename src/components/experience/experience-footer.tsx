import type { WorkshopActivity } from "@/services/big-screen"
import type { ParticipantWorkshop } from "@/services/participants"
import { BellIcon } from "lucide-react"

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
          <div className="flex w-max animate-[ticker-scroll_20s_linear_infinite] whitespace-nowrap hover:paused">
            {[0, 1].map((group) => (
              <div
                key={group}
                className="pointer-events-none flex shrink-0 items-center select-none"
                aria-hidden={group === 1}
              >
                {activities.map((activity) => (
                  <div
                    key={`${group}-${activity.ID}`}
                    className="flex items-center gap-2 px-8"
                  >
                    <BellIcon
                      className="size-4 shrink-0"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <span className="text-xs font-semibold">
                      {activity.TeamName}: {activity.Message}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
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
