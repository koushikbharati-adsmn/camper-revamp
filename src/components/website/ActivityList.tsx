import { IconExclamationCircleFilled } from "@tabler/icons-react"

type Activity = {
  id: number
  message: string
  detail: string
}

type ActivityListProps = {
  activities: Activity[]
  showTooltip?: boolean
  onShowScanQr?: () => void
}

export default function ActivityList({
  activities,
  showTooltip = false,
  onShowScanQr,
}: ActivityListProps) {
  return (
    <section className="grid w-full gap-5 lg:gap-8" aria-label="Latest activity">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <h2 className="font-phudu-b text-3xl text-theme1 m-0 leading-normal whitespace-nowrap">
          Latest Activity
        </h2>

        {onShowScanQr && (
          <button
            type="button"
            className="bg-theme1 text-theme2 cursor-pointer rounded-full px-3 py-2 font-ogilvy-r text-base whitespace-nowrap shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
            onClick={onShowScanQr}
          >
            Show QR
          </button>
        )}
      </div>

      <div className="grid gap-2 overflow-y-auto lg:max-h-[calc(100%-70px)]">
        {activities.map((activity) => (
          <div
            className="border-theme4 bg-theme2 hover:bg-theme5 flex items-start gap-6 rounded-2xl border px-3 py-3 shadow-[0_2px_8px_rgb(0_0_0/5%)] transition-colors duration-200 lg:px-5"
            key={activity.id}
          >
            <span
              className={`relative inline-flex h-5 w-5 shrink-0 cursor-pointer ${showTooltip ? "group" : ""}`}
              tabIndex={showTooltip ? 0 : undefined}
              aria-label={
                showTooltip ? `More details: ${activity.detail}` : undefined
              }
            >
              <IconExclamationCircleFilled />

              {showTooltip && (
                <span className="bg-theme1 text-base text-theme2 pointer-events-none absolute top-1/2 left-full z-10 ml-2 w-max max-w-64 -translate-y-1/2 rounded px-3 py-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  {activity.detail}
                </span>
              )}
            </span>

            <span className="grid gap-2">
              <strong className="text-base text-theme1 leading-tight">
                {activity.message}
              </strong>
              <small className="text-base text-theme1 leading-tight">
                {activity.detail}
              </small>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
