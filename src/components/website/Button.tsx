import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  label?: string
  variant?: "primary" | "secondary" | "outline"
  className?: string
  loading?: boolean
}

const variantClassName: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-theme1 text-theme2",
  secondary:
    "border-theme1 bg-theme2 text-theme1 border hover:bg-theme1 hover:text-theme2",
  outline: "",
}

export default function Button({
  children,
  label,
  variant = "primary",
  className,
  type = "button",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "font-ogilvy-r text-base my-2 inline-flex cursor-pointer items-center justify-center rounded-lg px-6 py-3 shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        variantClassName[variant],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className="inline-flex items-center justify-center"
          aria-label="Loading"
        >
          <span
            className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        </span>
      ) : (
        (children ?? label)
      )}
    </button>
  )
}
