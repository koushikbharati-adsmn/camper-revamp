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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { formatRelativeDate } from "@/lib/date"
import {
  type WorkshopLifecycleStatus,
  type WorkshopStatus,
  WORKSHOP_PHASES,
  canTransitionWorkshop,
  getWorkshopPhase,
  getWorkshopPhaseIndex,
} from "@/lib/workshop-lifecycle"
import { cn } from "@/lib/utils"
import {
  type ManageIdea,
  type ManageWorkshop,
  getManageIdeasOptions,
  getManageWorkshopOptions,
  useExportPpt,
  useUpdateWorkshopStatus,
} from "@/services/workshops-manage"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router"
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
import { useEffect, useRef, useState } from "react"
import { useWorkshopTimer } from "@/hooks/use-workshop-timer"

type TimerStatus = "idle" | "running" | "paused"
type TimerState = {
  status: TimerStatus
  durationSeconds: number
  remainingSeconds: number
}

export const Route = createFileRoute("/_authenticated/workshops/$code/manage")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.query(getManageWorkshopOptions(params.code)),
      context.queryClient.query(
        getManageIdeasOptions({
          code: params.code,
          team_id: null,
          category_id: null,
        })
      ),
    ]),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: ManageWorkshopPending,
  errorComponent: ManageWorkshopError,
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = Route.useParams()
  const { data: workshop } = useSuspenseQuery({
    ...getManageWorkshopOptions(code),
    select: (response) => response.data,
  })
  const updateStatusMutation = useUpdateWorkshopStatus()
  const exportPptMutation = useExportPpt()
  const [pendingTransition, setPendingTransition] =
    useState<WorkshopStatus | null>(null)

  const [teamFilter, setTeamFilter] = useState("all")
  const [pillarFilter, setPillarFilter] = useState("all")
  const [previewIdea, setPreviewIdea] = useState<ManageIdea | null>(null)
  const {
    data: ideas = [],
    isPending: isIdeasPending,
    refetch: refetchIdeas,
    error: ideasError,
  } = useQuery({
    ...getManageIdeasOptions({
      code,
      team_id: teamFilter === "all" ? null : Number(teamFilter),
      category_id: pillarFilter === "all" ? null : Number(pillarFilter),
    }),
    select: (data) => data.data,
  })

  const {
    timer,
    setDuration,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    reset: resetTimer,
  } = useWorkshopTimer(code)

  const transitionWorkshop = async (targetStatus: WorkshopStatus) => {
    if (!canTransitionWorkshop(workshop.status, targetStatus)) return false

    try {
      const response = await updateStatusMutation.mutateAsync({
        code,
        status: targetStatus,
      })
      toast.add({
        type: "success",
        title: "Workshop status updated",
        description: response.message,
      })
      return true
    } catch {
      return false
    }
  }

  const exportReport = async () => {
    try {
      const response = await exportPptMutation.mutateAsync({
        workshop_code: code,
      })
      const link = document.createElement("a")
      link.href = response.data.url
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.append(link)
      link.click()
      link.remove()
      toast.add({
        type: "success",
        title: "Report ready",
        description: response.message,
      })
    } catch {
      // Mutation hooks surface API errors and leave the action available to retry.
    }
  }

  return (
    <div className="space-y-6">
      <WorkshopHeader
        code={code}
        name={workshop.workshopName}
        description={workshop.Desc}
        status={workshop.status}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(28rem,0.9fr)]">
        <LifecycleCard
          status={workshop.status}
          isUpdating={updateStatusMutation.isPending}
          isExporting={exportPptMutation.isPending}
          onStart={() => void transitionWorkshop("Ideate")}
          onRequestTransition={setPendingTransition}
          onExport={() => void exportReport()}
        />
        <TimerCard
          timer={timer}
          onStart={startTimer}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onDurationChange={setDuration}
          onReset={resetTimer}
        />
      </div>

      <WorkshopStats
        totalTeams={workshop.totalTeam}
        totalPillars={workshop.totalCategory}
        totalIdeas={workshop.TotalIdea}
      />

      <IdeaTracker
        ideas={ideas}
        teams={workshop.teams}
        pillars={workshop.categories}
        totalIdeas={workshop.TotalIdea}
        teamFilter={teamFilter}
        pillarFilter={pillarFilter}
        isLoading={isIdeasPending}
        errorMessage={ideasError?.message ?? null}
        onTeamFilterChange={setTeamFilter}
        onPillarFilterChange={setPillarFilter}
        onPreview={setPreviewIdea}
        onRetry={() => void refetchIdeas()}
      />

      <LifecycleDialog
        targetStatus={pendingTransition}
        isPending={updateStatusMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !updateStatusMutation.isPending) {
            setPendingTransition(null)
          }
        }}
        onConfirm={async () => {
          if (
            pendingTransition &&
            (await transitionWorkshop(pendingTransition))
          ) {
            setPendingTransition(null)
          }
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
  name,
  description,
  status,
}: {
  code: string
  name: string
  description: string
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
            {name}
          </h1>
          <WorkshopStatusBadge status={status} />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
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
  isUpdating,
  isExporting,
  onStart,
  onRequestTransition,
  onExport,
}: {
  status: WorkshopLifecycleStatus
  isUpdating: boolean
  isExporting: boolean
  onStart: () => void
  onRequestTransition: (status: WorkshopStatus) => void
  onExport: () => void
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
            <Button
              className="w-full sm:w-auto"
              disabled={isUpdating}
              onClick={onStart}
            >
              {isUpdating ? <Spinner /> : <PlayIcon />}
              {isUpdating ? "Starting..." : "Start Workshop"}
            </Button>
          )}
          {status === "Ideate" && (
            <Button
              className="w-full sm:w-auto"
              disabled={isUpdating}
              onClick={() => onRequestTransition("Vote")}
            >
              {isUpdating ? <Spinner /> : <TagsIcon />}
              Start Voting
            </Button>
          )}
          {status === "Vote" && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isUpdating}
              onClick={() => onRequestTransition("Completed")}
            >
              {isUpdating ? <Spinner /> : <FlagIcon />}
              End Workshop
            </Button>
          )}
          {status === "Completed" && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isExporting}
              onClick={onExport}
            >
              {isExporting ? <Spinner /> : <DownloadIcon />}
              {isExporting ? "Preparing Report..." : "Download Report"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TimerCard({
  timer,
  onStart,
  onPause,
  onResume,
  onDurationChange,
  onReset,
}: {
  timer: TimerState
  onStart: () => void
  onPause: () => void
  onResume: () => void
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
    const value = Math.min(Number(rawValue) || 0, max)

    const nextDuration = {
      ...duration,
      [part]: value,
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

          <TimerSeparator />

          <TimerDurationInput
            label="Minutes"
            value={duration.minutes}
            disabled={!isEditable}
            onChange={(value) => updateDurationPart("minutes", value)}
          />

          <TimerSeparator />

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
            <Button disabled={timer.remainingSeconds === 0} onClick={onStart}>
              <PlayIcon />
              Start
            </Button>
          )}
          {timer.status === "running" && (
            <Button onClick={onPause}>
              <PauseIcon />
              Pause
            </Button>
          )}
          {timer.status === "paused" && (
            <Button disabled={timer.remainingSeconds === 0} onClick={onResume}>
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

function TimerSeparator() {
  return (
    <span
      aria-hidden="true"
      className="pt-2 font-mono text-5xl font-semibold text-muted-foreground sm:text-6xl lg:text-7xl"
    >
      :
    </span>
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
  const [inputValue, setInputValue] = useState(String(value).padStart(2, "0"))
  const isEditing = useRef(false)

  useEffect(() => {
    if (!isEditing.current) {
      setInputValue(String(value).padStart(2, "0"))
    }
  }, [value])

  return (
    <label className="grid min-w-0 gap-1.5 text-center">
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        value={inputValue}
        disabled={disabled}
        aria-label={label}
        className="h-auto w-20 [appearance:textfield] border-0 border-b bg-transparent px-0 py-2 text-center font-mono text-5xl font-semibold tracking-tight tabular-nums focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 sm:w-24 sm:text-6xl md:text-6xl lg:w-28 lg:text-7xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        onFocus={(event) => {
          isEditing.current = true
          event.currentTarget.select()
        }}
        onChange={(event) => {
          const rawValue = event.target.value

          // Allow empty value while editing, otherwise maximum 2 digits.
          if (!/^\d{0,2}$/.test(rawValue)) return

          setInputValue(rawValue)
          onChange(rawValue)
        }}
        onBlur={() => {
          isEditing.current = false
          setInputValue(String(value).padStart(2, "0"))
        }}
      />

      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </label>
  )
}

function WorkshopStats({
  totalTeams,
  totalPillars,
  totalIdeas,
}: {
  totalTeams: number
  totalPillars: number
  totalIdeas: number
}) {
  const stats = [
    { label: "Teams", value: totalTeams, icon: UsersIcon },
    { label: "Pillars", value: totalPillars, icon: FolderKanbanIcon },
    {
      label: "Ideas Submitted",
      value: totalIdeas,
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
  teams,
  pillars,
  totalIdeas,
  teamFilter,
  pillarFilter,
  isLoading,
  errorMessage,
  onTeamFilterChange,
  onPillarFilterChange,
  onPreview,
  onRetry,
}: {
  ideas: ManageIdea[]
  teams: ManageWorkshop["teams"]
  pillars: ManageWorkshop["categories"]
  totalIdeas: number
  teamFilter: string
  pillarFilter: string
  isLoading: boolean
  errorMessage: string | null
  onTeamFilterChange: (value: string) => void
  onPillarFilterChange: (value: string) => void
  onPreview: (idea: ManageIdea) => void
  onRetry: () => void
}) {
  const teamItems = [
    { value: "all", label: "All Teams" },
    ...teams.map((team) => ({
      value: String(team.ID),
      label: team.TeamName,
    })),
  ]
  const pillarItems = [
    { value: "all", label: "All Pillars" },
    ...pillars.map((pillar) => ({
      value: String(pillar.ID),
      label: pillar.Category,
    })),
  ]
  const isFiltered = teamFilter !== "all" || pillarFilter !== "all"

  return (
    <section aria-labelledby="idea-tracker-heading" aria-busy={isLoading}>
      <div className="flex flex-col gap-3 bg-background/90 py-4 backdrop-blur-md lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="idea-tracker-heading" className="text-lg font-semibold">
              Idea Tracker
            </h2>
            <Badge variant="secondary">
              {totalIdeas} {totalIdeas === 1 ? "idea" : "ideas"}
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

      {errorMessage ? (
        <IdeasError message={errorMessage} onRetry={onRetry} />
      ) : isLoading ? (
        <IdeasLoading />
      ) : totalIdeas === 0 ? (
        <IdeasEmpty />
      ) : ideas.length === 0 ? (
        <IdeasEmpty filtered={isFiltered} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.ID} idea={idea} onPreview={onPreview} />
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
  idea: ManageIdea
  onPreview: (idea: ManageIdea) => void
}) {
  return (
    <Card className="h-full gap-0 py-0">
      <div className="aspect-4/3 min-w-0 border-b border-border bg-muted/50">
        <IdeaThumbnail idea={idea} />
      </div>
      <CardHeader className="gap-3 py-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <CardTitle>{idea.Title}</CardTitle>
          {idea.flgTeam && (
            <Badge className="shrink-0">
              <FlagIcon />
              Shortlisted
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{idea.TeamName || "Unknown team"}</Badge>
          <Badge variant="outline">
            {idea.CategoryName || "Unknown pillar"}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3Icon className="size-3" />
            Submitted {formatRelativeDate(idea.CreatedDttm)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {idea.Desc}
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

function IdeasLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center border border-dashed border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading ideas...
      </div>
    </div>
  )
}

function IdeasError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-destructive/40 px-6 text-center">
      <h3 className="text-sm font-semibold">Unable to load ideas</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</p>
      <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function IdeaPreviewDialog({
  idea,
  open,
  onOpenChange,
}: {
  idea: ManageIdea
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{idea.Title}</DialogTitle>
          <DialogDescription>
            Full idea submission from {idea.TeamName || "Unknown team"}.
          </DialogDescription>
        </DialogHeader>

        <div className="no-scrollbar grid max-h-[70vh] gap-4 overflow-y-auto md:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
          <div className="aspect-4/3 overflow-hidden border border-border bg-muted/50">
            <IdeaThumbnail idea={idea} />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {idea.TeamName || "Unknown team"}
              </Badge>
              <Badge variant="outline">
                {idea.CategoryName || "Unknown pillar"}
              </Badge>
              {idea.flgTeam && (
                <Badge>
                  <FlagIcon />
                  Shortlisted
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-medium">Submitted</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRelativeDate(idea.CreatedDttm)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {idea.Desc}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IdeaThumbnail({ idea }: { idea: ManageIdea }) {
  const [hasError, setHasError] = useState(false)

  if (!idea.imageFileName?.trim() || hasError) {
    return (
      <div
        className="flex size-full items-center justify-center text-muted-foreground"
        aria-label={`${idea.Title} thumbnail unavailable`}
      >
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <img
      src={idea.imageFileName}
      alt={`${idea.Title} submission thumbnail`}
      className="size-full object-contain"
      onError={() => setHasError(true)}
    />
  )
}

function LifecycleDialog({
  targetStatus,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  targetStatus: WorkshopStatus | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
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
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isEnding ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {isPending && <Spinner />}
            {isPending
              ? isEnding
                ? "Ending..."
                : "Starting..."
              : isEnding
                ? "End Workshop"
                : "Start Voting"}
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

function ManageWorkshopPending() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-3 h-9 w-40" />
        <Skeleton className="h-8 w-full max-w-lg" />
        <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(28rem,0.9fr)]">
        <Skeleton className="h-128" />
        <Skeleton className="h-128" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

function ManageWorkshopError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <Link
        to="/workshops"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "-ml-2 text-muted-foreground"
        )}
      >
        <ArrowLeftIcon />
        Back to workshops
      </Link>
      <div className="border border-destructive/40 p-10 text-center">
        <h1 className="font-semibold">Unable to load workshop</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            reset()
            void router.invalidate()
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
