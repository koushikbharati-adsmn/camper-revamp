import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  SendIcon,
  SparklesIcon,
  SquarePenIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { ExperienceButton } from "@/components/experience/experience-button"
import { cn, getInitials } from "@/lib/utils"
import type {
  ParticipantIdea,
  ParticipantWorkshop,
  ParticipantWorkshopCoach,
} from "@/services/participants"

type SharpenMessage = {
  id: string
  author: "coach" | "participant"
  text: string
}

export function SharpenDialog({
  open,
  idea,
  coaches,
  workshop,
  onClose,
  onEditIdea,
}: {
  open: boolean
  idea: ParticipantIdea
  coaches: ParticipantWorkshopCoach[]
  workshop: ParticipantWorkshop
  onClose: () => void
  onEditIdea: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(1)
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null)
  const [messages, setMessages] = useState<SharpenMessage[]>([])
  const [draft, setDraft] = useState("")

  const selectedCoach =
    coaches.find((coach) => coach.ID === selectedCoachId) ?? null

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages])

  const handleSelectCoach = (coach: ParticipantWorkshopCoach) => {
    setSelectedCoachId(coach.ID)
    setDraft("")
    setMessages([
      {
        id: "coach-introduction",
        author: "coach",
        text: `Hi, I'm ${coach.CoachName}. Let's sharpen ${idea.title || "this idea"}. What would you like to explore first?`,
      },
    ])
  }

  const handleChangeCoach = () => {
    setSelectedCoachId(null)
    setMessages([])
    setDraft("")
  }

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = draft.trim()

    if (!text || !selectedCoach) return

    setMessages((current) => [
      ...current,
      {
        id: `participant-message-${nextMessageId.current++}`,
        author: "participant",
        text,
      },
    ])
    setDraft("")
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sharpen-dialog-title"
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none",
        "overflow-hidden border-0 bg-transparent p-0",
        "backdrop:bg-black/60",
        "sm:m-auto sm:h-[min(48rem,calc(100dvh-2rem))]",
        "sm:w-[min(64rem,calc(100%-2rem))]"
      )}
      onClose={onClose}
    >
      <div
        className={cn(
          "flex h-full max-h-dvh min-h-0 flex-col overflow-hidden",
          "sm:max-h-[min(48rem,calc(100dvh-2rem))]",
          "sm:rounded-lg sm:border sm:shadow-xl"
        )}
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          borderColor: workshop.card_primary_border_color,
          color: workshop.txt_primary_color,
        }}
      >
        {selectedCoach ? (
          <ChatView
            coach={selectedCoach}
            messages={messages}
            draft={draft}
            messagesEndRef={messagesEndRef}
            workshop={workshop}
            onChangeCoach={handleChangeCoach}
            onClose={onClose}
            onEditIdea={onEditIdea}
            onDraftChange={setDraft}
            onComposerKeyDown={handleComposerKeyDown}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <CoachSelectionView
            coaches={coaches}
            workshop={workshop}
            onClose={onClose}
            onSelectCoach={handleSelectCoach}
          />
        )}
      </div>
    </dialog>
  )
}

function CoachSelectionView({
  coaches,
  workshop,
  onClose,
  onSelectCoach,
}: {
  coaches: ParticipantWorkshopCoach[]
  workshop: ParticipantWorkshop
  onClose: () => void
  onSelectCoach: (coach: ParticipantWorkshopCoach) => void
}) {
  return (
    <>
      <header
        className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-4 sm:px-6"
        style={{ borderColor: workshop.card_primary_border_color }}
      >
        <div className="min-w-0">
          <p
            className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase"
            style={{ color: workshop.txt_secondary_color }}
          >
            <SparklesIcon className="size-4" aria-hidden="true" />
            Sharpen
          </p>

          <h2
            id="sharpen-dialog-title"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Choose your coach
          </h2>
        </div>

        <CloseButton workshop={workshop} onClick={onClose} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-5 sm:px-6 sm:py-7">
          {coaches.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach) => (
                <li key={coach.ID} className="min-w-0">
                  <button
                    type="button"
                    className={cn(
                      "flex h-full min-h-52 w-full flex-col items-start rounded-lg border p-5 text-left",
                      "transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md",
                      "focus-visible:outline-2 focus-visible:outline-offset-2"
                    )}
                    style={{
                      backgroundColor: workshop.card_secondary_bg_color,
                      borderColor: workshop.card_primary_border_color,
                      color:
                        coach.PrimaryTxtColor || workshop.txt_primary_color,
                      outlineColor: workshop.btn_primary_bg_color,
                    }}
                    aria-label={`Select ${coach.CoachName} as your coach`}
                    onClick={() => onSelectCoach(coach)}
                  >
                    <CoachAvatar coach={coach} className="size-16" />

                    <h3 className="mt-4 text-lg leading-tight font-semibold">
                      {coach.CoachName}
                    </h3>

                    <p
                      className="mt-1 text-sm font-medium"
                      style={{
                        color:
                          coach.SecondaryTxtColor ||
                          workshop.txt_secondary_color,
                      }}
                    >
                      {coach.Title}
                    </p>

                    <p
                      className="mt-3 line-clamp-3 text-sm leading-6"
                      style={{
                        color:
                          coach.SecondaryTxtColor ||
                          workshop.txt_secondary_color,
                      }}
                    >
                      {coach.Description}
                    </p>

                    <span className="mt-auto pt-5 text-sm font-semibold">
                      Start a conversation
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="grid min-h-56 place-content-center rounded-lg border px-6 text-center"
              style={{ borderColor: workshop.card_primary_border_color }}
            >
              <UsersIcon className="mx-auto size-9" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">
                No coaches available
              </h3>
              <p
                className="mt-1 max-w-md text-sm leading-6"
                style={{ color: workshop.txt_secondary_color }}
              >
                This workshop does not have any coaches assigned yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer
        className="flex shrink-0 justify-end border-t px-4 py-3 sm:px-6"
        style={{ borderColor: workshop.card_primary_border_color }}
      >
        <ExperienceButton
          variant="secondary"
          workshop={workshop}
          onClick={onClose}
        >
          Cancel
        </ExperienceButton>
      </footer>
    </>
  )
}

function ChatView({
  coach,
  messages,
  draft,
  messagesEndRef,
  workshop,
  onChangeCoach,
  onClose,
  onEditIdea,
  onDraftChange,
  onComposerKeyDown,
  onSendMessage,
}: {
  coach: ParticipantWorkshopCoach
  messages: SharpenMessage[]
  draft: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  workshop: ParticipantWorkshop
  onChangeCoach: () => void
  onClose: () => void
  onEditIdea: () => void
  onDraftChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <>
      <header
        className="shrink-0 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: workshop.card_primary_border_color }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CoachAvatar coach={coach} className="size-11" />

            <div className="min-w-0">
              <p
                className="text-xs font-semibold tracking-[0.14em] uppercase"
                style={{ color: workshop.txt_secondary_color }}
              >
                Sharpening with
              </p>
              <h2
                id="sharpen-dialog-title"
                className="truncate text-lg leading-tight font-semibold"
              >
                {coach.CoachName}
              </h2>
            </div>
          </div>

          <CloseButton workshop={workshop} onClick={onClose} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <ExperienceButton
            variant="secondary"
            workshop={workshop}
            className="min-w-0 px-3 py-1.5"
            onClick={onChangeCoach}
          >
            <span className="flex items-center gap-2">
              <UsersIcon className="size-4" aria-hidden="true" />
              Change coach
            </span>
          </ExperienceButton>

          <ExperienceButton
            variant="secondary"
            workshop={workshop}
            className="min-w-0 px-3 py-1.5"
            onClick={onEditIdea}
          >
            <span className="flex items-center gap-2">
              <SquarePenIcon className="size-4" aria-hidden="true" />
              Edit idea
            </span>
          </ExperienceButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-5 sm:px-6 sm:py-7">
          <div
            className="grid gap-5"
            role="log"
            aria-label={`Conversation with ${coach.CoachName}`}
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message) => {
              const isCoach = message.author === "coach"

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[88%] items-end gap-2 sm:max-w-[75%]",
                    isCoach ? "justify-self-start" : "justify-self-end"
                  )}
                >
                  {isCoach && (
                    <CoachAvatar coach={coach} className="size-8 shrink-0" />
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap",
                      isCoach ? "rounded-bl-sm border" : "rounded-br-sm"
                    )}
                    style={
                      isCoach
                        ? {
                            backgroundColor: workshop.card_secondary_bg_color,
                            borderColor: workshop.card_primary_border_color,
                            color: workshop.card_secondary_txt_color,
                          }
                        : {
                            backgroundColor: workshop.btn_primary_bg_color,
                            color: workshop.btn_primary_txt_color,
                          }
                    }
                  >
                    {message.text}
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>
      </div>

      <form
        className="shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4"
        style={{ borderColor: workshop.card_primary_border_color }}
        onSubmit={onSendMessage}
      >
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 sm:gap-3">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Message {coach.CoachName}</span>
            <textarea
              autoFocus
              rows={1}
              value={draft}
              placeholder={`Message ${coach.CoachName}`}
              className={cn(
                "max-h-32 min-h-11 w-full resize-none rounded-lg border bg-transparent px-3 py-2.5",
                "text-sm leading-6 outline-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2"
              )}
              style={{
                borderColor: workshop.card_primary_border_color,
                outlineColor: workshop.btn_primary_bg_color,
              }}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={onComposerKeyDown}
            />
          </label>

          <ExperienceButton
            type="submit"
            workshop={workshop}
            className="grid size-11 min-w-0 shrink-0 place-items-center p-0"
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            <SendIcon className="size-4" aria-hidden="true" />
          </ExperienceButton>
        </div>
      </form>
    </>
  )
}

function CoachAvatar({
  coach,
  className,
}: {
  coach: ParticipantWorkshopCoach
  className?: string
}) {
  const [hasImageError, setHasImageError] = useState(false)
  const hasImage = Boolean(coach.AvatarFileName?.trim()) && !hasImageError

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700",
        className
      )}
      aria-hidden="true"
    >
      {hasImage ? (
        <img
          src={coach.AvatarFileName}
          alt=""
          className="size-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        getInitials(coach.CoachName, "C")
      )}
    </span>
  )
}

function CloseButton({
  workshop,
  onClick,
}: {
  workshop: ParticipantWorkshop
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border",
        "transition-colors hover:bg-black/5",
        "focus-visible:outline-2 focus-visible:outline-offset-2"
      )}
      style={{
        borderColor: workshop.card_primary_border_color,
        outlineColor: workshop.btn_primary_bg_color,
      }}
      aria-label="Close Sharpen"
      onClick={onClick}
    >
      <XIcon className="size-5" aria-hidden="true" />
    </button>
  )
}
