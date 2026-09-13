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
import {
  type WorkshopLifecycleStatus,
  type WorkshopStatus,
  WORKSHOP_PHASES,
  canTransitionWorkshop,
  getWorkshopPhase,
  getWorkshopPhaseIndex,
} from "@/lib/workshop-lifecycle"
import { cn } from "@/lib/utils"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format } from "date-fns"
import {
  ArrowLeftIcon,
  CheckIcon,
  CircleIcon,
  Clock3Icon,
  DownloadIcon,
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
  shortlisted: boolean
  submittedAt: string
  thumbnailUrl: string
}

const MOCK_WORKSHOP = {
  name: "Future-Ready Customer Experience",
  description:
    "Guide teams from opportunity discovery through voting on the strongest customer experience concepts.",
  initialStatus: null as WorkshopLifecycleStatus,
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
    shortlisted: true,
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
    shortlisted: false,
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
    shortlisted: true,
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
    shortlisted: false,
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
    shortlisted: true,
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
    shortlisted: false,
    submittedAt: "2026-09-11T10:28:00Z",
    thumbnailUrl: "https://picsum.photos/seed/discovery-path/800/600",
  },
]

export const Route = createFileRoute("/_authenticated/workshops/$code/manage")({
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = Route.useParams()
  const [workshopStatus, setWorkshopStatus] = useState<WorkshopLifecycleStatus>(
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

  const transitionWorkshop = (targetStatus: WorkshopStatus) => {
    setWorkshopStatus((currentStatus) =>
      canTransitionWorkshop(currentStatus, targetStatus)
        ? targetStatus
        : currentStatus
    )
  }

  return (
    <div className="space-y-6">
      <WorkshopHeader code={code} status={workshopStatus} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(28rem,0.9fr)]">
        <LifecycleCard
          status={workshopStatus}
          onStart={() => transitionWorkshop("Ideate")}
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
          if (pendingTransition) transitionWorkshop(pendingTransition)
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
  status: WorkshopLifecycleStatus
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
  status: WorkshopLifecycleStatus
  onStart: () => void
  onRequestTransition: (status: WorkshopStatus) => void
}) {
  const currentPhaseIndex = getWorkshopPhaseIndex(status)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workshop Lifecycle</CardTitle>
        <CardDescription>
          Progress the workshop through each phase in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <ol
          aria-label="Workshop phases"
          className="relative before:absolute before:top-4 before:bottom-4 before:left-4 before:w-px before:bg-border"
        >
          {WORKSHOP_PHASES.map((phase, index) => {
            const phaseState =
              index < currentPhaseIndex
                ? "completed"
                : index === currentPhaseIndex
                  ? "current"
                  : "upcoming"

            return (
              <li
                key={phase.label}
                aria-current={phaseState === "current" ? "step" : undefined}
                aria-label={`${phase.label}, ${phaseState}`}
                className="relative flex min-w-0 gap-4 pb-7 last:pb-0"
              >
                <div className="relative flex w-8 shrink-0 justify-center">
                  <span
                    className={cn(
                      "relative z-10 flex size-8 shrink-0 items-center justify-center border bg-card",
                      phaseState === "completed" &&
                        "border-primary/40 text-primary",
                      phaseState === "current" &&
                        "border-primary bg-primary text-primary-foreground ring-2 ring-primary/15 ring-offset-2 ring-offset-card",
                      phaseState === "upcoming" &&
                        "border-border text-muted-foreground"
                    )}
                  >
                    {phaseState === "completed" ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <CircleIcon className="size-2.5 fill-current" />
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        phaseState === "current" && "font-semibold",
                        phaseState === "upcoming" && "text-muted-foreground"
                      )}
                    >
                      {phase.label}
                    </p>
                    {phaseState === "current" && (
                      <Badge
                        variant="outline"
                        className="text-[0.65rem] uppercase"
                      >
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="text-sm font-medium">{getLifecycleMessage(status)}</p>
            <p className="text-xs text-muted-foreground">
              Lifecycle changes do not affect the workshop timer.
            </p>
          </div>
          {status === null && (
            <Button className="w-full sm:w-auto" onClick={onStart}>
              <PlayIcon />
              Start Workshop
            </Button>
          )}
          {status === "Ideate" && (
            <Button
              className="w-full sm:w-auto"
              onClick={() => onRequestTransition("Vote")}
            >
              <TagsIcon />
              Start Voting
            </Button>
          )}
          {status === "Vote" && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => onRequestTransition("Completed")}
            >
              <FlagIcon />
              End Workshop
            </Button>
          )}
          {status === "Completed" && (
            <Button variant="outline" className="w-full sm:w-auto" disabled>
              <DownloadIcon />
              Download Report
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
            className="pt-2 font-mono text-5xl font-semibold text-muted-foreground sm:text-6xl lg:text-7xl"
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
            className="pt-2 font-mono text-5xl font-semibold text-muted-foreground sm:text-6xl lg:text-7xl"
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
    <label className="grid min-w-0 gap-1.5 text-center">
      <Input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={String(value).padStart(2, "0")}
        disabled={disabled}
        aria-label={label}
        className="h-auto w-20 [appearance:textfield] border-0 border-b bg-transparent px-0 py-2 text-center font-mono text-5xl font-semibold tracking-tight tabular-nums focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 sm:w-24 sm:text-6xl md:text-6xl lg:w-28 lg:text-7xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(event.target.value)}
      />

      <span className="text-xs font-medium text-muted-foreground">{label}</span>
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
    <section aria-labelledby="idea-tracker-heading">
      <div className="sticky -top-4 flex flex-col gap-3 bg-background/90 py-4 backdrop-blur-md lg:flex-row lg:items-end lg:justify-between">
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
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
    <Card className="h-full gap-0 py-0">
      <div className="aspect-4/3 min-w-0 border-b border-border bg-muted/50">
        <IdeaThumbnail idea={idea} />
      </div>
      <CardHeader className="gap-3 py-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <CardTitle>{idea.title}</CardTitle>
          {idea.shortlisted && (
            <Badge className="shrink-0">
              <FlagIcon />
              Shortlisted
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{getTeamName(idea.teamId)}</Badge>
          <Badge variant="outline">{getPillarName(idea.pillarId)}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3Icon className="size-3" />
            {formatSubmittedAt(idea.submittedAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {idea.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={() => onPreview(idea)}
        >
          <EyeIcon />
          Preview
        </Button>
      </CardContent>
    </Card>
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
              {idea.shortlisted && (
                <Badge>
                  <FlagIcon />
                  Shortlisted
                </Badge>
              )}
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
  const isEnding = targetStatus === "Completed"

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
              ? "This completes the workshop. Returning to an earlier phase requires resetting the workshop, which may clear workshop activity."
              : "This starts voting. Returning to ideation requires resetting the workshop, which may clear workshop activity."}
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

function WorkshopStatusBadge({ status }: { status: WorkshopLifecycleStatus }) {
  const currentStatus = getWorkshopPhase(status)

  return (
    <Badge className={currentStatus.badgeClassName}>
      {currentStatus.label}
    </Badge>
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

function getLifecycleMessage(status: WorkshopLifecycleStatus) {
  return getWorkshopPhase(status).message
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
