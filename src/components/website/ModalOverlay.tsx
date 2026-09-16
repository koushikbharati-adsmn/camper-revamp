import { IconX } from "@tabler/icons-react"
import { useEffect, type MouseEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type ModalOverlayProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  headerClassName?: string
  closeClassName?: string
  closeOnOverlayClick?: boolean
}

export default function ModalOverlay({
  isOpen,
  onClose,
  title,
  children,
  className,
  headerClassName,
  closeClassName,
  closeOnOverlayClick = true,
}: ModalOverlayProps) {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) onClose()
  }

  return (
    <div
      className="border-theme1 bg-theme1/40 fixed inset-0 z-999 flex h-full w-full items-center justify-center border-2 p-4 animate-[modal-overlay-fade_0.2s_ease-out] motion-reduce:animate-none"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <section
        className={cn(
          "bg-theme2 text-theme1 relative m-0 grid max-h-[90vh] w-full max-w-lg gap-3 overflow-y-auto rounded-2xl p-5 shadow-sm animate-[modal-dialog-in_0.25s_ease-out_both] motion-reduce:animate-none",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-overlay-title" : undefined}
      >
        <div className={cn("flex w-full items-center justify-between gap-4", headerClassName)}>
          {title && (
            <h2 id="modal-overlay-title" className="font-phudu-b text-2xl text-theme1 m-0">
              {title}
            </h2>
          )}
          <button
            className={cn(
              "bg-theme4 text-theme1 absolute top-4 right-4 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 p-1 transition-colors duration-200 hover:bg-theme5",
              closeClassName
            )}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <IconX size={18} stroke={1.8} />
          </button>
        </div>
        <div className="font-ogilvy-r text-base text-theme1 grid w-full gap-5">
          {children}
        </div>
      </section>
    </div>
  )
}
