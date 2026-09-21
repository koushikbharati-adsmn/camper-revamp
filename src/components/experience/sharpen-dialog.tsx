import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  ArrowDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CopyIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SendIcon,
  SquarePenIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { ExperienceButton } from "@/components/experience/experience-button"
import { Textarea } from "@/components/ui/textarea"
import {
  PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH,
  type ParticipantChatConnectionStatus,
  useParticipantChat,
} from "@/hooks/use-participant-chat"
import { cn, getInitials } from "@/lib/utils"
import {
  retryPendingParticipantChatDeletions,
  type ParticipantChatMessage,
} from "@/services/participant-chat"
import type {
  ParticipantIdea,
  ParticipantWorkshop,
  ParticipantWorkshopCoach,
} from "@/services/participants"

export function SharpenDialog({
  open,
  idea,
  coaches,
  workshop,
  visitorId,
  workshopCode,
  onClose,
  onEditIdea,
}: {
  open: boolean
  idea: ParticipantIdea
  coaches: ParticipantWorkshopCoach[]
  workshop: ParticipantWorkshop
  visitorId: string
  workshopCode: string
  onClose: () => void
  onEditIdea: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null)
  const [draft, setDraft] = useState("")
  const [cleanupPersistenceError, setCleanupPersistenceError] = useState<
    string | null
  >(null)

  const selectedCoach =
    coaches.find((coach) => coach.ID === selectedCoachId) ?? null

  const chat = useParticipantChat({
    open,
    visitorId,
    workshopCode,
    idea,
    coach: selectedCoach,
  })

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    void retryPendingParticipantChatDeletions({
      visitorId,
      workshopCode,
      ideaId: idea.ID,
    }).then(({ storageFailed }) => {
      setCleanupPersistenceError(
        storageFailed
          ? "Chat cleanup could not be saved because browser storage is unavailable."
          : null
      )
    })
  }, [idea.ID, visitorId, workshopCode])

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (chat.sendMessage(draft)) setDraft("")
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
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-black/70"
      onClose={onClose}
    >
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden"
        style={{
          backgroundColor: workshop.card_primary_bg_color,
          color: workshop.txt_primary_color,
        }}
      >
        {selectedCoach ? (
          <ChatWorkspace
            coach={selectedCoach}
            coaches={coaches}
            messages={chat.session.messages}
            draft={draft}
            workshop={workshop}
            connectionStatus={chat.connectionStatus}
            connectionError={chat.connectionError}
            requestError={chat.requestError}
            persistenceError={chat.persistenceError ?? cleanupPersistenceError}
            sessionStatus={chat.session.status}
            sessionStatusMessage={chat.session.statusMessage}
            isWaiting={chat.isWaiting}
            onChangeCoach={() => {
              if (chat.isWaiting) return
              setSelectedCoachId(null)
              setDraft("")
            }}
            onSelectCoach={(coach) => {
              if (chat.isWaiting || coach.ID === selectedCoach.ID) return
              setSelectedCoachId(coach.ID)
              setDraft("")
            }}
            onClose={onClose}
            onEditIdea={onEditIdea}
            onDraftChange={setDraft}
            onComposerKeyDown={handleComposerKeyDown}
            onSendMessage={handleSendMessage}
            onReconnect={chat.reconnect}
            onRetryMessage={chat.retryMessage}
          />
        ) : (
          <CoachSelectionView
            coaches={coaches}
            workshop={workshop}
            onClose={onClose}
            onSelectCoach={(coach) => {
              setSelectedCoachId(coach.ID)
              setDraft("")
            }}
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
      <WorkspaceHeader workshop={workshop} onClose={onClose}>
        <div className="min-w-0">
          <h2
            id="sharpen-dialog-title"
            className="truncate text-lg font-semibold tracking-tight sm:text-xl"
          >
            Choose a coach
          </h2>
        </div>
      </WorkspaceHeader>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
          {coaches.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {coaches.map((coach) => (
                <li key={coach.ID} className="min-w-0">
                  <button
                    type="button"
                    className="group flex h-full w-full items-center gap-4 rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-5"
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
                    <CoachAvatar coach={coach} className="size-14 sm:size-16" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold sm:text-lg">
                        {coach.CoachName}
                      </span>
                      <span
                        className="mt-0.5 block text-sm font-medium"
                        style={{
                          color:
                            coach.SecondaryTxtColor ||
                            workshop.txt_secondary_color,
                        }}
                      >
                        {coach.Title}
                      </span>
                      <span
                        className="mt-2 line-clamp-2 block text-sm leading-5"
                        style={{
                          color:
                            coach.SecondaryTxtColor ||
                            workshop.txt_secondary_color,
                        }}
                      >
                        {coach.Description}
                      </span>
                    </span>
                    <ChevronRightIcon
                      className="size-5 shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="grid min-h-64 place-content-center rounded-2xl border px-6 text-center"
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
      </main>
    </>
  )
}

function ChatWorkspace({
  coach,
  coaches,
  messages,
  draft,
  workshop,
  connectionStatus,
  connectionError,
  requestError,
  persistenceError,
  sessionStatus,
  sessionStatusMessage,
  isWaiting,
  onChangeCoach,
  onSelectCoach,
  onClose,
  onEditIdea,
  onDraftChange,
  onComposerKeyDown,
  onSendMessage,
  onReconnect,
  onRetryMessage,
}: {
  coach: ParticipantWorkshopCoach
  coaches: ParticipantWorkshopCoach[]
  messages: ParticipantChatMessage[]
  draft: string
  workshop: ParticipantWorkshop
  connectionStatus: ParticipantChatConnectionStatus
  connectionError: string | null
  requestError: string | null
  persistenceError: string | null
  sessionStatus: "active" | "ended" | "invalid"
  sessionStatusMessage: string | null
  isWaiting: boolean
  onChangeCoach: () => void
  onSelectCoach: (coach: ParticipantWorkshopCoach) => void
  onClose: () => void
  onEditIdea: () => void
  onDraftChange: (value: string) => void
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void
  onReconnect: () => void
  onRetryMessage: (messageId: string) => boolean
}) {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const previousMessageCountRef = useRef(messages.length)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const isConnected = connectionStatus === "connected"
  const isTerminal = sessionStatus !== "active"
  const isComposerDisabled = !isConnected || isWaiting || isTerminal

  useEffect(() => {
    const hasAddedMessage = messages.length > previousMessageCountRef.current
    previousMessageCountRef.current = messages.length

    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ block: "end" })
      setHasNewMessages(false)
    } else if (hasAddedMessage) {
      setHasNewMessages(true)
    }
  }, [isWaiting, messages])

  const scrollToBottom = () => {
    isNearBottomRef.current = true
    setHasNewMessages(false)
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }

  const composerPlaceholder = isTerminal
    ? sessionStatus === "ended"
      ? "Session has ended."
      : "This session cannot continue."
    : isConnected
      ? `Message ${coach.CoachName}`
      : "Connecting to your coach..."

  return (
    <>
      <WorkspaceHeader workshop={workshop} onClose={onClose}>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CoachAvatar coach={coach} className="size-10 sm:size-11" />
            <div className="min-w-0">
              <h2
                id="sharpen-dialog-title"
                className="truncate text-base leading-tight font-semibold sm:text-lg"
              >
                {coach.CoachName}
              </h2>
              <p
                className="truncate text-xs sm:text-sm"
                style={{ color: workshop.txt_secondary_color }}
              >
                {coach.Title}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ExperienceButton
              variant="secondary"
              workshop={workshop}
              className="flex size-9 min-w-0 items-center justify-center gap-2 p-0 sm:h-9 sm:w-auto sm:px-3"
              disabled={isWaiting}
              onClick={onEditIdea}
              aria-label="Edit idea"
            >
              <SquarePenIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Edit idea</span>
            </ExperienceButton>
            <ExperienceButton
              variant="secondary"
              workshop={workshop}
              className="flex size-9 min-w-0 items-center justify-center gap-2 p-0 sm:h-9 sm:w-auto sm:px-3"
              disabled={isWaiting}
              onClick={onChangeCoach}
              aria-label="Change coach"
            >
              <UsersIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Change coach</span>
            </ExperienceButton>
          </div>
        </div>
      </WorkspaceHeader>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside
          className="hidden min-h-0 border-r lg:flex lg:flex-col"
          style={{ borderColor: workshop.card_primary_border_color }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <p
              className="px-2 py-2 text-xs font-semibold tracking-wider uppercase"
              style={{ color: workshop.txt_secondary_color }}
            >
              Coaches
            </p>
            <ul className="grid gap-1.5">
              {coaches.map((candidate) => {
                const isSelected = candidate.ID === coach.ID

                return (
                  <li key={candidate.ID}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default"
                      style={{
                        backgroundColor: isSelected
                          ? workshop.card_secondary_bg_color
                          : "transparent",
                        borderColor: isSelected
                          ? workshop.card_primary_border_color
                          : "transparent",
                        outlineColor: workshop.btn_primary_bg_color,
                      }}
                      disabled={isSelected || isWaiting}
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => onSelectCoach(candidate)}
                    >
                      <CoachAvatar coach={candidate} className="size-9" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {candidate.CoachName}
                        </span>
                        <span
                          className="block truncate text-xs"
                          style={{ color: workshop.txt_secondary_color }}
                        >
                          {candidate.Title}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        <section className="relative flex min-h-0 min-w-0 flex-col">
          <div
            ref={scrollViewportRef}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
            onScroll={(event) => {
              const viewport = event.currentTarget
              const distanceFromBottom =
                viewport.scrollHeight -
                viewport.scrollTop -
                viewport.clientHeight
              isNearBottomRef.current = distanceFromBottom < 96
              if (isNearBottomRef.current) setHasNewMessages(false)
            }}
          >
            <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 pt-4 pb-52 sm:px-6 sm:pt-6 sm:pb-56">
              {!isConnected && (
                <ChatStatusNotice
                  kind={connectionStatus === "error" ? "error" : "loading"}
                  message={
                    connectionError ??
                    (connectionStatus === "reconnecting"
                      ? "Reconnecting to your coach..."
                      : "Connecting to your coach...")
                  }
                  workshop={workshop}
                  onRetry={
                    connectionStatus === "error" ? onReconnect : undefined
                  }
                />
              )}

              {requestError && (
                <ChatStatusNotice
                  kind="error"
                  message={requestError}
                  workshop={workshop}
                />
              )}

              {persistenceError && (
                <ChatStatusNotice
                  kind="warning"
                  message={persistenceError}
                  workshop={workshop}
                />
              )}

              {sessionStatusMessage && (
                <ChatStatusNotice
                  kind="error"
                  message={sessionStatusMessage}
                  workshop={workshop}
                />
              )}

              <div
                className="grid gap-4"
                role="log"
                aria-label={`Conversation with ${coach.CoachName}`}
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    coach={coach}
                    workshop={workshop}
                    canRetry={isConnected && !isWaiting && !isTerminal}
                    onRetry={() => onRetryMessage(message.id)}
                  />
                ))}

                {isWaiting && (
                  <div className="flex max-w-[88%] items-end gap-2 justify-self-start sm:max-w-[75%]">
                    <CoachAvatar coach={coach} className="size-8" />
                    <div
                      className="rounded-2xl rounded-bl-sm border px-4 py-3"
                      style={{
                        backgroundColor: workshop.card_secondary_bg_color,
                        borderColor: workshop.card_primary_border_color,
                        color: workshop.card_secondary_txt_color,
                      }}
                    >
                      <span className="sr-only">Coach is thinking</span>
                      <span className="flex gap-1" aria-hidden="true">
                        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-current" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>
            </div>
          </div>

          <form
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pt-10 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5"
            style={{
              background: `linear-gradient(to top, ${workshop.card_primary_bg_color} 55%, transparent)`,
            }}
            onSubmit={(event) => {
              isNearBottomRef.current = true
              onSendMessage(event)
            }}
          >
            <div className="pointer-events-auto mx-auto w-full max-w-3xl">
              {hasNewMessages && (
                <button
                  type="button"
                  className="mx-auto mb-2 flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: workshop.card_secondary_bg_color,
                    borderColor: workshop.card_primary_border_color,
                    color: workshop.card_secondary_txt_color,
                    outlineColor: workshop.btn_primary_bg_color,
                  }}
                  onClick={scrollToBottom}
                >
                  <ArrowDownIcon className="size-4" aria-hidden="true" />
                  New message
                </button>
              )}
              <label htmlFor="participant-chat-message" className="sr-only">
                Message {coach.CoachName}
              </label>
              <div
                className="flex items-end gap-2 rounded-2xl border p-2 shadow-sm"
                style={{
                  backgroundColor: workshop.card_secondary_bg_color,
                  borderColor: workshop.card_primary_border_color,
                }}
              >
                <Textarea
                  id="participant-chat-message"
                  rows={1}
                  value={draft}
                  maxLength={PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH}
                  disabled={isComposerDisabled}
                  placeholder={composerPlaceholder}
                  className="max-h-40 min-h-10 flex-1 resize-none overflow-y-auto rounded-xl border-0 bg-transparent px-2 py-2 text-sm leading-6 shadow-none focus-visible:ring-0 md:text-sm dark:bg-transparent"
                  style={{ color: workshop.card_secondary_txt_color }}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                />
                <ExperienceButton
                  type="submit"
                  workshop={workshop}
                  className="grid size-10 min-w-0 shrink-0 place-items-center rounded-xl p-0"
                  disabled={isComposerDisabled || !draft.trim()}
                  aria-busy={isWaiting}
                  aria-label={isWaiting ? "Waiting for coach" : "Send message"}
                >
                  <SendIcon className="size-4" aria-hidden="true" />
                </ExperienceButton>
              </div>
              <div
                className="mt-1.5 flex justify-between gap-3 px-1 text-[11px]"
                style={{ color: workshop.txt_secondary_color }}
              >
                <p className="w-full text-center">
                  Enter to send, Shift + Enter for a new line
                </p>
                {draft.length > PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH * 0.8 && (
                  <span className="tabular-nums">
                    {draft.length}/{PARTICIPANT_CHAT_MESSAGE_MAX_LENGTH}
                  </span>
                )}
              </div>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}

function WorkspaceHeader({
  workshop,
  onClose,
  children,
}: {
  workshop: ParticipantWorkshop
  onClose: () => void
  children: ReactNode
}) {
  return (
    <header
      className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6"
      style={{ borderColor: workshop.card_primary_border_color }}
    >
      {children}
      <CloseButton workshop={workshop} onClick={onClose} />
    </header>
  )
}

function ChatMessage({
  message,
  coach,
  workshop,
  canRetry,
  onRetry,
}: {
  message: ParticipantChatMessage
  coach: ParticipantWorkshopCoach
  workshop: ParticipantWorkshop
  canRetry: boolean
  onRetry: () => void
}) {
  const isCoach = message.author === "coach"

  if (message.author === "system") {
    return (
      <p
        className="max-w-xl justify-self-center rounded-full border px-3 py-1.5 text-center text-xs break-words"
        style={{
          borderColor: workshop.card_primary_border_color,
          color: workshop.txt_secondary_color,
        }}
      >
        {message.text}
      </p>
    )
  }

  return (
    <div
      className={cn(
        "flex max-w-[88%] items-end gap-2 sm:max-w-[75%]",
        isCoach ? "justify-self-start" : "justify-self-end"
      )}
    >
      {isCoach && <CoachAvatar coach={coach} className="size-8" />}
      <div className="min-w-0">
        <span className="sr-only">
          {isCoach ? coach.CoachName : "You"} said:
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap",
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
                  opacity: message.status === "pending" ? 0.75 : 1,
                }
          }
        >
          {message.text}
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-[11px]",
            isCoach ? "justify-start" : "justify-end"
          )}
          style={{ color: workshop.txt_secondary_color }}
        >
          {message.createdAt && (
            <time dateTime={new Date(message.createdAt).toISOString()}>
              {formatMessageTime(message.createdAt)}
            </time>
          )}
          {message.status === "pending" && <span>Sending</span>}
          {message.status === "failed" && (
            <>
              <span>Not sent</span>
              <button
                type="button"
                className="font-semibold underline underline-offset-2 disabled:opacity-50"
                disabled={!canRetry}
                onClick={onRetry}
              >
                Retry
              </button>
            </>
          )}
          <button
            type="button"
            className="rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-2"
            aria-label="Copy message"
            onClick={() => void navigator.clipboard?.writeText(message.text)}
          >
            <CopyIcon className="size-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatStatusNotice({
  kind,
  message,
  workshop,
  onRetry,
}: {
  kind: "error" | "loading" | "warning"
  message: string
  workshop: ParticipantWorkshop
  onRetry?: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ borderColor: workshop.card_primary_border_color }}
      role={kind === "error" ? "alert" : "status"}
    >
      {kind === "loading" ? (
        <LoaderCircleIcon
          className="size-5 shrink-0 animate-spin"
          aria-hidden="true"
        />
      ) : (
        <CircleAlertIcon className="size-5 shrink-0" aria-hidden="true" />
      )}
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <ExperienceButton
          variant="secondary"
          workshop={workshop}
          className="min-w-0 px-3 py-1.5"
          onClick={onRetry}
        >
          <span className="flex items-center gap-2">
            <RefreshCwIcon className="size-4" aria-hidden="true" />
            Retry
          </span>
        </ExperienceButton>
      )}
    </div>
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
      className="grid size-10 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2"
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

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp)
}
