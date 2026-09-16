import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ParticipantWorkshop } from "@/services/participants"

type ExperienceSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  workshop: ParticipantWorkshop
  size?: "sm" | "default"
}

function ExperienceSelect({
  workshop,
  className,
  size = "default",
  children,
  ...props
}: ExperienceSelectProps) {
  return (
    <div
      className={cn(
        "group/experience-select relative w-fit",
        "has-[select:disabled]:opacity-50",
        className
      )}
      data-slot="experience-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="experience-select"
        data-size={size}
        className={cn(
          "w-full min-w-0 appearance-none rounded-md border bg-transparent",
          "pr-9 pl-3 text-sm font-medium",
          "transition-colors outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:cursor-not-allowed",
          "data-[size=default]:h-10 data-[size=sm]:h-8"
        )}
        style={{
          borderColor: workshop.card_primary_border_color,
          // borderRadius: workshop.card_primary_border_radius,
          color: workshop.txt_primary_color,
          outlineColor: workshop.btn_primary_bg_color,
        }}
        {...props}
      >
        {children}
      </select>

      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 select-none"
        style={{
          color: workshop.txt_secondary_color,
        }}
        aria-hidden="true"
      />
    </div>
  )
}

function ExperienceSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="experience-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function ExperienceSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="experience-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { ExperienceSelect, ExperienceSelectOptGroup, ExperienceSelectOption }
