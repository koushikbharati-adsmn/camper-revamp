import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type TabOption = {
  label: string
  value: string
  disabled?: boolean
}

type TabbedProps = {
  options: TabOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  children?: ReactNode
}

export default function Tabbed({
  options,
  value,
  onChange,
  className,
  children,
}: TabbedProps) {
  return (
    <div
      className={cn(
        "border-theme7 bg-theme2 m-0 flex w-fit items-center gap-0 overflow-hidden rounded-lg border p-1 shadow-md",
        className
      )}
      role="tablist"
      aria-label="Select pillar"
    >
      {options.map((option) => (
        <button
          className={`font-ogilvy-r text-base text-theme1 m-0 h-full cursor-pointer px-3 py-1 whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            option.value === value ? "bg-theme10 rounded-sm font-semibold" : ""
          }`}
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
      {children}
    </div>
  )
}
