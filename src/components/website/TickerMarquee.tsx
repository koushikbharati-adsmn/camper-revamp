import { IconBell } from "@tabler/icons-react"

type TickerMarqueeProps = {
  items: string[]
}

export default function TickerMarquee({ items }: TickerMarqueeProps) {
  const repeatedItems = Array.from({ length: 10 }, () => items).flat()

  const renderItems = (isDuplicate = false) => (
    <div className="flex min-w-max shrink-0 items-center" aria-hidden={isDuplicate}>
      {repeatedItems.map((item, index) => (
        <span
          className="flex items-center gap-2 whitespace-nowrap px-8 text-sm font-semibold"
          key={`${item}-${index}`}
        >
          <IconBell className="shrink-0" size={20} stroke={1.8} aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  )

  return (
    <div
      className="z-999 fixed bottom-0 flex w-full items-center overflow-hidden border-y border-theme7 bg-theme5 py-2 font-ogilvy-r text-xs text-theme1"
      aria-label="Live updates"
    >
      <span className="z-10 flex absolute top-0 left-0 h-full shrink-0 items-center gap-1.5 bg-theme1 px-2 font-ogilvy-r text-base font-semibold text-theme2">
        <span
          className="size-1.5 rounded-full bg-theme2 animate-[ticker-indicator_1.2s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        LIVE
      </span>
      <div className="flex w-max shrink-0 items-center animate-[ticker-scroll_80s_linear_infinite]">
        {renderItems()}
        {renderItems(true)}
      </div>
    </div>
  )
}
