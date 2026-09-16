import type { TextareaHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string
}

export default function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "border-theme7 bg-theme2 font-ogilvy-r text-base text-theme1 m-0 min-h-24 w-full resize-none rounded border px-3 py-2 transition-colors duration-200 outline-none focus:border-theme1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
