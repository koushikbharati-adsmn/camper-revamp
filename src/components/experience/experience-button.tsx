import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type ExperienceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary"
  workshop: {
    btn_primary_bg_color: string
    btn_primary_txt_color: string
    btn_secondary_bg_color: string
    btn_secondary_border_color: string
    btn_secondary_txt_color: string
  }
}

export function ExperienceButton({
  variant = "primary",
  workshop,
  className,
  children,
  ...props
}: ExperienceButtonProps) {
  const isPrimary = variant === "primary"

  const backgroundColor = isPrimary
    ? workshop.btn_primary_bg_color
    : workshop.btn_secondary_bg_color

  const borderColor = isPrimary
    ? workshop.btn_primary_bg_color
    : workshop.btn_secondary_border_color

  const color = isPrimary
    ? workshop.btn_primary_txt_color
    : workshop.btn_secondary_txt_color

  return (
    <button
      type="button"
      className={cn(
        "min-w-28 rounded-md border px-5 py-2 text-sm font-medium",
        "transition-transform",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{
        backgroundColor,
        borderColor,
        color,
        outlineColor: borderColor,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
