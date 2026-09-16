import type { ChangeEvent } from "react"

import { cn } from "@/lib/utils"

interface InputProps {
  value: string
  placeholder?: string
  maxLength?: number
  className?: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function FieldInput({
  value,
  placeholder,
  maxLength,
  className,
  onChange,
}: InputProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={onChange}
      className={cn(
        "border-theme1 bg-theme2 font-ogilvy-r text-base text-theme1 my-2 w-full rounded-lg border px-4 py-3 transition-all duration-200 outline-none placeholder:font-ogilvy-r placeholder:text-theme1 placeholder:opacity-50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  )
}
