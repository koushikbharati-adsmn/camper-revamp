import { cn } from "@/lib/utils"
import type { ParticipantWorkshop } from "@/services/participants"

type SegmentOption<T extends string> = {
  value: T
  label: string
}

type ExperienceSegmentedControlProps<T extends string> = {
  value: T
  options: readonly SegmentOption<T>[]
  workshop: ParticipantWorkshop
  onValueChange: (value: T) => void
  className?: string
  ariaLabel?: string
}

export function ExperienceSegmentedControl<T extends string>({
  value,
  options,
  workshop,
  onValueChange,
  className,
  ariaLabel,
}: ExperienceSegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex w-max min-w-full rounded-md border p-1 lg:min-w-0",
        className
      )}
      style={{
        backgroundColor: workshop.card_primary_bg_color,
        borderColor: workshop.card_primary_border_color,
        borderRadius: workshop.card_primary_border_radius,
      }}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "h-8 shrink-0 rounded-md px-4 text-sm font-medium",
              "transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2"
            )}
            style={{
              backgroundColor: isActive
                ? workshop.btn_secondary_bg_color
                : "transparent",
              color: isActive
                ? workshop.txt_primary_color
                : workshop.txt_secondary_color,
              outlineColor: workshop.btn_primary_bg_color,
            }}
            aria-pressed={isActive}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
