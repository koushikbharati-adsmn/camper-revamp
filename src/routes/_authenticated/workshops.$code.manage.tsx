import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format } from "date-fns"
import {
  ArrowLeftIcon,
  CheckIcon,
  CircleIcon,
  Clock3Icon,
  EyeIcon,
  FlagIcon,
  FolderKanbanIcon,
  ImageIcon,
  LightbulbIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

type WorkshopStatus = "not_started" | "ideate" | "vote" | "completed"
type TimerStatus = "idle" | "running" | "paused"
type TimerState = {
  status: TimerStatus
  durationSeconds: number
  remainingSeconds: number
}

type Team = {
  id: string
  name: string
}

type Pillar = {
  id: string
  name: string
}

type Idea = {
  id: string
  title: string
  description: string
  teamId: Team["id"]
  pillarId: Pillar["id"]
  submittedAt: string
  thumbnailUrl: string
}

const MOCK_WORKSHOP = {
  name: "Future-Ready Customer Experience",
  description:
    "Guide teams from opportunity discovery through voting on the strongest customer experience concepts.",
  initialStatus: "not_started" as WorkshopStatus,
}

const MOCK_TEAMS: Team[] = [
  { id: "alpha", name: "Team Alpha" },
  { id: "bravo", name: "Team Bravo" },
  { id: "charlie", name: "Team Charlie" },
  { id: "delta", name: "Team Delta" },
]

const MOCK_PILLARS: Pillar[] = [
  { id: "sustainability", name: "Sustainability" },
  { id: "accessibility", name: "Accessibility" },
  { id: "personalization", name: "Personalization" },
]

const MOCK_IDEAS: Idea[] = [
  {
    id: "idea-1",
    title: "Refill and Reward Stations",
    description:
      "A network of smart refill points that recognizes returning customers, tracks packaging avoided, and turns every refill into loyalty credit. The experience combines practical waste reduction with a visible, motivating record of collective impact.",
    teamId: "alpha",
    pillarId: "sustainability",
    submittedAt: "2026-09-11T09:18:00Z",
    thumbnailUrl: "https://picsum.photos/seed/refill-station/800/600",
  },
  {
    id: "idea-2",
    title: "Calm Mode Shopping",
    description:
      "An accessibility setting that simplifies navigation, reduces visual noise, and offers step-by-step guidance across digital and physical touchpoints. Customers can save their preferences once and use them throughout the whole journey.",
    teamId: "bravo",
    pillarId: "accessibility",
    submittedAt: "2026-09-11T09:31:00Z",
    thumbnailUrl: "https://picsum.photos/seed/calm-shopping/800/600",
  },
  {
    id: "idea-3",
    title: "My Week, Ready to Go",
    description:
      "A weekly planning assistant that learns household routines and prepares a flexible collection of essentials before customers need to search. Suggestions explain why they were made and remain fully editable.",
    teamId: "charlie",
    pillarId: "personalization",
    submittedAt: "2026-09-11T09:44:00Z",
    thumbnailUrl: "https://picsum.photos/seed/weekly-planner/800/600",
  },
  {
    id: "idea-4",
    title: "Local Impact Receipt",
    description:
      "A redesigned receipt that translates purchases into simple local impact measures, including lower-carbon choices and support for nearby producers. It also recommends one realistic improvement for the next visit.",
    teamId: "alpha",
    pillarId: "sustainability",
    submittedAt: "2026-09-11T10:02:00Z",
    thumbnailUrl: "https://picsum.photos/seed/impact-receipt/800/600",
  },
  {
    id: "idea-5",
    title: "Ask Without Barriers",
    description:
      "A multimodal help point where customers can type, speak, sign, or select visual prompts to ask for assistance. Requests reach the best-placed colleague without requiring customers to explain their access needs repeatedly.",
    teamId: "delta",
    pillarId: "accessibility",
    submittedAt: "2026-09-11T10:16:00Z",
    thumbnailUrl: "https://picsum.photos/seed/accessible-help/800/600",
  },
  {
    id: "idea-6",
    title: "Discovery Path",
    description:
      "A store and app journey that adapts to the customer's available time and desired level of discovery, from a direct five-minute mission to a more exploratory visit built around new products and inspiration.",
    teamId: "bravo",
    pillarId: "personalization",
    submittedAt: "2026-09-11T10:28:00Z",
    thumbnailUrl: "https://picsum.photos/seed/discovery-path/800/600",
  },
]

const WORKSHOP_PHASES: Array<{
  status: WorkshopStatus
  label: string
  description: string
}> = [
  {
    status: "ideate",
    label: "Ideate",
    description: "Participants submit ideas",
  },
  {
    status: "vote",
    label: "Vote",
    description: "Participants vote on ideas",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Workshop has ended",
  },
]

export const Route = createFileRoute("/_authenticated/workshops/$code/manage")({
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = Route.useParams()
  const [workshopStatus, setWorkshopStatus] = useState<WorkshopStatus>(
    MOCK_WORKSHOP.initialStatus
  )
  const [pendingTransition, setPendingTransition] =
    useState<WorkshopStatus | null>(null)
  const [timer, setTimer] = useState<TimerState>({
    status: "idle",
    durationSeconds: 0,
    remainingSeconds: 0,
  })
  const [teamFilter, setTeamFilter] = useState("all")
  const [pillarFilter, setPillarFilter] = useState("all")
  const [previewIdea, setPreviewIdea] = useState<Idea | null>(null)

  useEffect(() => {
    if (timer.status !== "running") return

    const intervalId = window.setInterval(() => {
      setTimer((current) => {
        if (current.status !== "running") return current

        if (current.remainingSeconds <= 1) {
          return { ...current, status: "idle", remainingSeconds: 0 }
        }

        return {
          ...current,
          remainingSeconds: current.remainingSeconds - 1,
        }
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [timer.status])

  const filteredIdeas = MOCK_IDEAS.filter(
    (idea) =>
      (teamFilter === "all" || idea.teamId === teamFilter) &&
      (pillarFilter === "all" || idea.pillarId === pillarFilter)
  )

  const resetTimer = () => {
    setTimer((current) => ({
      ...current,
      status: "idle",
      remainingSeconds: current.durationSeconds,
    }))
  }

  return (
    <div className="space-y-6">
      <WorkshopHeader code={code} status={workshopStatus} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.75fr)]">
        <LifecycleCard
          status={workshopStatus}
          onStart={() => setWorkshopStatus("ideate")}
          onRequestTransition={setPendingTransition}
        />
        <TimerCard
          timer={timer}
          onStatusChange={(status) =>
            setTimer((current) => ({ ...current, status }))
          }
          onDurationChange={(durationSeconds) =>
            setTimer((current) =>
              current.status === "running"
                ? current
                : {
                    ...current,
                    durationSeconds,
                    remainingSeconds: durationSeconds,
                  }
            )
          }
          onReset={resetTimer}
        />
      </div>

      <WorkshopStats />

      <IdeaTracker
        ideas={filteredIdeas}
        teamFilter={teamFilter}
        pillarFilter={pillarFilter}
        onTeamFilterChange={setTeamFilter}
        onPillarFilterChange={setPillarFilter}
        onPreview={setPreviewIdea}
      />

      <LifecycleDialog
        targetStatus={pendingTransition}
        onOpenChange={(open) => {
          if (!open) setPendingTransition(null)
        }}
        onConfirm={() => {
          if (pendingTransition) setWorkshopStatus(pendingTransition)
          setPendingTransition(null)
        }}
      />

      {previewIdea && (
        <IdeaPreviewDialog
          idea={previewIdea}
          open
          onOpenChange={(open) => {
            if (!open) setPreviewIdea(null)
          }}
        />
      )}
    </div>
  )
}

function WorkshopHeader({
  code,
  status,
}: {
  code: string
  status: WorkshopStatus
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Link
          to="/workshops"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "mb-3 -ml-2 text-muted-foreground"
          )}
        >
          <ArrowLeftIcon />
          Back to workshops
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {MOCK_WORKSHOP.name}
          </h1>
          <WorkshopStatusBadge status={status} />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {MOCK_WORKSHOP.description}
        </p>
      </div>
      <Badge variant="outline" className="w-fit font-mono uppercase">
        {code}
      </Badge>
    </header>
  )
}

function LifecycleCard({
  status,
  onStart,
  onRequestTransition,
}: {
  status: WorkshopStatus
  onStart: () => void
  onRequestTransition: (status: WorkshopStatus) => void
}) {
  const currentPhaseIndex = WORKSHOP_PHASES.findIndex(
    (phase) => phase.status === status
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workshop Lifecycle</CardTitle>
        <CardDescription>
          Progress the workshop through each phase in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ol aria-label="Workshop phases">
          {WORKSHOP_PHASES.map((phase, index) => {
            const phaseState =
              index < currentPhaseIndex
                ? "completed"
                : index === currentPhaseIndex
                  ? "current"
                  : "upcoming"

            return (
              <li
                key={phase.status}
                aria-current={phaseState === "current" ? "step" : undefined}
                className="relative flex min-w-0 gap-3 pb-3 last:pb-0"
              >
                <div className="relative flex w-6 shrink-0 justify-center">
                  {index < WORKSHOP_PHASES.length - 1 && (
                    <span
                      className={cn(
                        "absolute top-6 bottom-0 w-px bg-border",
                        phaseState === "completed" && "bg-primary/40"
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-6 shrink-0 items-center justify-center border bg-card",
                      phaseState === "completed" &&
                        "border-primary/40 bg-primary/10 text-primary",
                      phaseState === "current" &&
                        "border-primary bg-primary text-primary-foreground",
                      phaseState === "upcoming" &&
                        "border-border text-muted-foreground"
                    )}
                  >
                    {phaseState === "completed" ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <CircleIcon className="size-2.5 fill-current" />
                    )}
                  </span>
                </div>
                <div
                  className={cn(
                    "min-w-0 flex-1 border border-border px-3 py-2.5",
                    phaseState === "current" &&
                      "border-primary/40 bg-primary/5 shadow-xs",
                    phaseState === "completed" && "bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={cn(
                        "font-medium",
                        phaseState === "current" && "font-semibold",
                        phaseState === "upcoming" && "text-muted-foreground"
                      )}
                    >
                      {phase.label}
                    </p>
                    <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                      {phaseState}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="text-sm font-medium">{getLifecycleMessage(status)}</p>
            <p className="text-xs text-muted-foreground">
              Lifecycle changes do not affect the workshop timer.
            </p>
          </div>
          {status === "not_started" && (
            <Button className="w-full sm:w-auto" onClick={onStart}>
              <PlayIcon />
              Start Workshop
            </Button>
          )}
          {status === "ideate" && (
            <Button
              className="w-full sm:w-auto"
              onClick={() => onRequestTransition("vote")}
            >
              <TagsIcon />
              Start Voting
            </Button>
          )}
          {status === "vote" && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => onRequestTransition("completed")}
            >
              <FlagIcon />
              End Workshop
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TimerCard({
  timer,
  onStatusChange,
  onDurationChange,
  onReset,
}: {
  timer: TimerState
  onStatusChange: (status: TimerStatus) => void
  onDurationChange: (durationSeconds: number) => void
  onReset: () => void
}) {
  const duration = getDurationParts(timer.remainingSeconds)
  const isEditable = timer.status !== "running"
  const canReset =
    timer.status !== "idle" ||
    (timer.durationSeconds > 0 &&
      timer.remainingSeconds !== timer.durationSeconds)

  const updateDurationPart = (
    part: keyof ReturnType<typeof getDurationParts>,
    rawValue: string
  ) => {
    const max = part === "hours" ? 99 : 59
    const parsedValue = Number(rawValue.replace(/\D/g, "").slice(0, 2)) || 0
    const nextDuration = {
      ...duration,
      [part]: Math.min(parsedValue, max),
    }

    onDurationChange(
      nextDuration.hours * 3600 +
        nextDuration.minutes * 60 +
        nextDuration.seconds
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workshop Timer</CardTitle>
        <CardDescription>
          Run the timer independently of the phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center py-5 text-center">
        <TimerStatusBadge status={timer.status} />
        <div
          role="group"
          aria-label="Workshop timer duration"
          className="mt-3 flex max-w-full items-start justify-center gap-1"
        >
          <TimerDurationInput
            label="Hours"
            value={duration.hours}
            disabled={!isEditable}
            onChange={(value) => updateDurationPart("hours", value)}
          />
          <span
            className="pt-1 font-mono text-4xl font-semibold text-muted-foreground sm:text-5xl"
            aria-hidden="true"
          >
            :
          </span>
          <TimerDurationInput
            label="Minutes"
            value={duration.minutes}
            disabled={!isEditable}
            onChange={(value) => updateDurationPart("minutes", value)}
          />
          <span
            className="pt-1 font-mono text-4xl font-semibold text-muted-foreground sm:text-5xl"
            aria-hidden="true"
          >
            :
          </span>
          <TimerDurationInput
            label="Seconds"
            value={duration.seconds}
            disabled={!isEditable}
            onChange={(value) => updateDurationPart("seconds", value)}
          />
        </div>
        <span className="sr-only" aria-live="polite">
          {formatDuration(timer.remainingSeconds)} remaining
        </span>
        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          {timer.status === "idle" && (
            <Button
              disabled={timer.remainingSeconds === 0}
              onClick={() => onStatusChange("running")}
            >
              <PlayIcon />
              Start
            </Button>
          )}
          {timer.status === "running" && (
            <Button onClick={() => onStatusChange("paused")}>
              <PauseIcon />
              Pause
            </Button>
          )}
          {timer.status === "paused" && (
            <Button
              disabled={timer.remainingSeconds === 0}
              onClick={() => onStatusChange("running")}
            >
              <PlayIcon />
              Resume
            </Button>
          )}
          {canReset && (
            <Button variant="outline" onClick={onReset}>
              <RotateCcwIcon />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TimerDurationInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: number
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid min-w-0 gap-1 text-center">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={String(value).padStart(2, "0")}
        disabled={disabled}
        aria-label={label}
        className="h-auto w-14 border-0 border-b bg-transparent px-0 py-1 text-center font-mono text-4xl font-semibold tracking-tight tabular-nums focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 sm:w-16 sm:text-5xl"
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label === "Hours" ? "HH" : label === "Minutes" ? "MM" : "SS"}
      </span>
    </label>
  )
}

function WorkshopStats() {
  const stats = [
    { label: "Teams", value: MOCK_TEAMS.length, icon: UsersIcon },
    { label: "Pillars", value: MOCK_PILLARS.length, icon: FolderKanbanIcon },
    {
      label: "Ideas Submitted",
      value: MOCK_IDEAS.length,
      icon: LightbulbIcon,
    },
  ]

  return (
    <section aria-labelledby="workshop-stats-heading">
      <h2 id="workshop-stats-heading" className="sr-only">
        Workshop statistics
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {stat.value}
                </p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function IdeaTracker({
  ideas,
  teamFilter,
  pillarFilter,
  onTeamFilterChange,
  onPillarFilterChange,
  onPreview,
}: {
  ideas: Idea[]
  teamFilter: string
  pillarFilter: string
  onTeamFilterChange: (value: string) => void
  onPillarFilterChange: (value: string) => void
  onPreview: (idea: Idea) => void
}) {
  const teamItems = [
    { value: "all", label: "All Teams" },
    ...MOCK_TEAMS.map((team) => ({ value: team.id, label: team.name })),
  ]
  const pillarItems = [
    { value: "all", label: "All Pillars" },
    ...MOCK_PILLARS.map((pillar) => ({
      value: pillar.id,
      label: pillar.name,
    })),
  ]

  return (
    <section aria-labelledby="idea-tracker-heading" className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="idea-tracker-heading" className="text-lg font-semibold">
              Idea Tracker
            </h2>
            <Badge variant="secondary">
              {MOCK_IDEAS.length} {MOCK_IDEAS.length === 1 ? "idea" : "ideas"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Browse and review ideas submitted by workshop teams.
          </p>
        </div>

        <div
          aria-label="Idea filters"
          role="group"
          className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-end"
        >
          <label className="grid gap-1 text-xs font-medium">
            Team
            <Select
              items={teamItems}
              value={teamFilter}
              onValueChange={(value) => {
                if (typeof value === "string") onTeamFilterChange(value)
              }}
            >
              <SelectTrigger
                className="w-full sm:w-44"
                aria-label="Filter by team"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teamItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Pillar
            <Select
              items={pillarItems}
              value={pillarFilter}
              onValueChange={(value) => {
                if (typeof value === "string") onPillarFilterChange(value)
              }}
            >
              <SelectTrigger
                className="w-full sm:w-44"
                aria-label="Filter by pillar"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pillarItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      {MOCK_IDEAS.length === 0 ? (
        <IdeasEmpty />
      ) : ideas.length === 0 ? (
        <IdeasEmpty filtered />
      ) : (
        <div className="grid gap-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onPreview={onPreview} />
          ))}
        </div>
      )}
    </section>
  )
}

function IdeaCard({
  idea,
  onPreview,
}: {
  idea: Idea
  onPreview: (idea: Idea) => void
}) {
  return (
    <article className="grid min-w-0 overflow-hidden border border-border bg-card sm:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="aspect-4/3 min-w-0 border-b border-border bg-muted/50 sm:border-r sm:border-b-0">
        <IdeaThumbnail idea={idea} />
      </div>
      <div className="flex min-w-0 flex-col p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{idea.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{getTeamName(idea.teamId)}</Badge>
              <Badge variant="outline">{getPillarName(idea.pillarId)}</Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3Icon className="size-3" />
                {formatSubmittedAt(idea.submittedAt)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onPreview(idea)}
          >
            <EyeIcon />
            Preview
          </Button>
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {idea.description}
        </p>
      </div>
    </article>
  )
}

function IdeasEmpty({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center bg-muted">
        <LightbulbIcon className="size-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">
        {filtered
          ? "No ideas match the selected filters."
          : "No ideas have been submitted yet."}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {filtered
          ? "Try choosing a different team or pillar."
          : "Ideas will appear here once participants start submitting them."}
      </p>
    </div>
  )
}

function IdeaPreviewDialog({
  idea,
  open,
  onOpenChange,
}: {
  idea: Idea
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{idea.title}</DialogTitle>
          <DialogDescription>
            Full idea submission from {getTeamName(idea.teamId)}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
          <div className="aspect-4/3 overflow-hidden border border-border bg-muted/50">
            <IdeaThumbnail idea={idea} />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{getTeamName(idea.teamId)}</Badge>
              <Badge variant="outline">{getPillarName(idea.pillarId)}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium">Submitted</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatSubmittedAt(idea.submittedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {idea.description}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IdeaThumbnail({ idea }: { idea: Idea }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className="flex size-full items-center justify-center text-muted-foreground"
        aria-label={`${idea.title} thumbnail unavailable`}
      >
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <img
      src={idea.thumbnailUrl}
      alt={`${idea.title} submission thumbnail`}
      className="size-full object-contain"
      onError={() => setHasError(true)}
    />
  )
}

function LifecycleDialog({
  targetStatus,
  onOpenChange,
  onConfirm,
}: {
  targetStatus: WorkshopStatus | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const isEnding = targetStatus === "completed"

  return (
    <AlertDialog open={Boolean(targetStatus)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={isEnding ? "text-destructive" : undefined}
          >
            {isEnding ? <ShieldAlertIcon /> : <TagsIcon />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isEnding ? "End this workshop?" : "Start voting?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isEnding
              ? "This completes the workshop and closes the lifecycle. You cannot move it back to an earlier phase."
              : "This moves the workshop from Ideate to Vote. You cannot return to the Ideate phase."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isEnding ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {isEnding ? "End Workshop" : "Start Voting"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function WorkshopStatusBadge({ status }: { status: WorkshopStatus }) {
  const statusStyles: Record<
    WorkshopStatus,
    { label: string; className: string }
  > = {
    not_started: {
      label: "Not Started",
      className:
        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    },
    ideate: {
      label: "Ideate",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    vote: {
      label: "Vote",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
  }

  const currentStatus = statusStyles[status]

  return (
    <Badge className={currentStatus.className}>{currentStatus.label}</Badge>
  )
}

function TimerStatusBadge({ status }: { status: TimerStatus }) {
  const labels: Record<TimerStatus, string> = {
    idle: "Idle",
    running: "Running",
    paused: "Paused",
  }

  return (
    <Badge variant="outline">
      <span
        className={cn(
          "size-1.5 rounded-full bg-muted-foreground",
          status === "running" && "bg-green-600",
          status === "paused" && "bg-amber-500"
        )}
      />
      {labels[status]}
    </Badge>
  )
}

function getLifecycleMessage(status: WorkshopStatus) {
  const messages: Record<WorkshopStatus, string> = {
    not_started: "The workshop is ready to start.",
    ideate: "Participants can submit ideas.",
    vote: "Participants can vote on submitted ideas.",
    completed: "The workshop is completed.",
  }

  return messages[status]
}

function getDurationParts(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function formatDuration(totalSeconds: number) {
  const duration = getDurationParts(totalSeconds)

  return [duration.hours, duration.minutes, duration.seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
}

function formatSubmittedAt(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? "Submitted time unavailable"
    : format(date, "PPP 'at' p")
}

function getTeamName(id: Team["id"]) {
  return MOCK_TEAMS.find((team) => team.id === id)?.name ?? "Unknown team"
}

function getPillarName(id: Pillar["id"]) {
  return (
    MOCK_PILLARS.find((pillar) => pillar.id === id)?.name ?? "Unknown pillar"
  )
}
