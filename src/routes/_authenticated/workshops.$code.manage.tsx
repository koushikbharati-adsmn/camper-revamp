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
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { socket } from "@/lib/socket"
import {
  type WorkshopLifecycleStatus,
  type WorkshopStatus,
  WORKSHOP_PHASES,
  canTransitionWorkshop,
  getWorkshopPhase,
  getWorkshopPhaseIndex,
} from "@/lib/workshop-lifecycle"
import { cn, getDurationParts } from "@/lib/utils"
import {
  type ManageIdea,
  type ManageWorkshop,
  getManageIdeasOptions,
  getManageWorkshopOptions,
  useExportPpt,
  useUpdateWorkshopStatus,
} from "@/services/workshops-manage"
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  ShapesIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StarIcon,
  TagsIcon,
  ThumbsUpIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useWorkshopTimer } from "@/hooks/use-workshop-timer"
import type {
  IdeaImageSocketPayload,
  IdeaShortlistSocketPayload,
  IdeaUpsertSocketPayload,
} from "@/services/participants"
import { z } from "zod"

type TimerStatus = "idle" | "running" | "paused"
type TimerState = {
  status: TimerStatus
  durationSeconds: number
  remainingSeconds: number
}

const manageWorkshopSearchSchema = z.object({
  team: z.coerce.number().int().positive().optional(),
  pillar: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute("/_authenticated/workshops/$code/manage")({
  validateSearch: manageWorkshopSearchSchema,
  loader: ({ context, params }) =>
    context.queryClient.query(getManageWorkshopOptions(params.code)),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: ManageWorkshopPending,
  errorComponent: ManageWorkshopError,
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = Route.useParams()
  const { team, pillar } = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: workshop } = useSuspenseQuery({
    ...getManageWorkshopOptions(code),
    select: (response) => response.data,
  })

  const updateStatusMutation = useUpdateWorkshopStatus()
  const exportPptMutation = useExportPpt()

  const queryClient = useQueryClient()

  const [pendingTransition, setPendingTransition] =
    useState<WorkshopStatus | null>(null)
  const [previewIdeaId, setPreviewIdeaId] = useState<number | null>(null)

  const ideasQueryOptions = getManageIdeasOptions({
    code,
    team_id: team ?? null,
    category_id: pillar ?? null,
  })

  const {
    data: ideas = [],
    isPending: isIdeasPending,
    refetch: refetchIdeas,
    error: ideasError,
  } = useQuery({
    ...ideasQueryOptions,
    select: (data) => data.data,
  })

  const previewIdeaIndex =
    previewIdeaId === null
      ? -1
      : ideas.findIndex((idea) => idea.ID === previewIdeaId)
  const previewIdea = previewIdeaIndex === -1 ? null : ideas[previewIdeaIndex]
  const hasPreviousIdea = previewIdeaIndex > 0
  const hasNextIdea =
    previewIdeaIndex >= 0 && previewIdeaIndex < ideas.length - 1

  useEffect(() => {
    const handleIdeaUpserted = ({
      roomId,
      idea: socketIdea,
    }: IdeaUpsertSocketPayload) => {
      if (roomId !== code) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (current) => {
        if (!current) return current

        const existingIdea = current.data.find(
          (idea) => idea.ID === socketIdea.ideaId
        )

        const matchesTeam = team === undefined || socketIdea.teamId === team

        const matchesPillar =
          pillar === undefined || socketIdea.categoryId === pillar

        const matchesFilters = matchesTeam && matchesPillar

        // Existing idea moved outside the currently selected filters.
        if (existingIdea && !matchesFilters) {
          return {
            ...current,
            data: current.data.filter((idea) => idea.ID !== socketIdea.ideaId),
          }
        }

        // Update existing idea.
        if (existingIdea) {
          return {
            ...current,
            data: current.data.map((idea) =>
              idea.ID === socketIdea.ideaId
                ? {
                    ...idea,
                    TeamID: socketIdea.teamId,
                    TeamName: socketIdea.teamName,
                    CategoryID: socketIdea.categoryId,
                    CategoryName: socketIdea.categoryName,
                    Desc: socketIdea.desc,
                    title: socketIdea.title,
                  }
                : idea
            ),
          }
        }

        // New idea does not belong to the currently selected filters.
        if (!matchesFilters) {
          return current
        }

        const newIdea: ManageIdea = {
          ID: socketIdea.ideaId,
          WorkshopID: 0,
          TeamID: socketIdea.teamId,
          TeamName: socketIdea.teamName,
          CategoryID: socketIdea.categoryId,
          CategoryName: socketIdea.categoryName,
          title: socketIdea.title || null,
          Desc: socketIdea.desc,
          imageFileName: null,
          CreatedDttm: new Date(
            Date.now() + 5.5 * 60 * 60 * 1000
          ).toISOString(),
          TotalVote: 0,
          flgTeam: false,
          flgCoach: false,
        }

        return {
          ...current,
          data: [...current.data, newIdea],
        }
      })
    }

    const handleIdeaShortlistUpdated = ({
      roomId,
      isShortlisted,
      idea: socketIdea,
    }: IdeaShortlistSocketPayload) => {
      if (roomId !== code) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (current) => {
        if (!current) return current

        return {
          ...current,
          data: current.data.map((idea) =>
            idea.ID === socketIdea.ID
              ? {
                  ...idea,
                  flgTeam: isShortlisted,
                }
              : idea
          ),
        }
      })
    }

    const handleIdeaImageGenerated = ({
      roomId,
      ideaId,
      imageUrl,
    }: IdeaImageSocketPayload) => {
      if (roomId !== code) return

      queryClient.setQueryData(ideasQueryOptions.queryKey, (current) => {
        if (!current) return current

        return {
          ...current,
          data: current.data.map((idea) =>
            idea.ID === ideaId
              ? {
                  ...idea,
                  imageFileName: imageUrl,
                }
              : idea
          ),
        }
      })
    }

    socket.on("idea_upserted", handleIdeaUpserted)
    socket.on("idea_shortlist_updated", handleIdeaShortlistUpdated)
    socket.on("idea_image_generated", handleIdeaImageGenerated)

    return () => {
      socket.off("idea_upserted", handleIdeaUpserted)
      socket.off("idea_shortlist_updated", handleIdeaShortlistUpdated)
      socket.off("idea_image_generated", handleIdeaImageGenerated)
    }
  }, [code, team, pillar, queryClient, ideasQueryOptions.queryKey])

  const {
    timer,
    setDuration,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    reset: resetTimer,
  } = useWorkshopTimer(code)

  const updateWorkshopStatus = (status: WorkshopStatus) => {
    if (!canTransitionWorkshop(workshop.status, status)) return

    updateStatusMutation.mutate(
      { code, status },
      {
        onSuccess: () => setPendingTransition(null),
      }
    )
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
          onStart={() => updateWorkshopStatus("Ideate")}
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
        teamId={team}
        pillarId={pillar}
        isLoading={isIdeasPending}
        errorMessage={ideasError?.message ?? null}
        onTeamFilterChange={(team) => {
          setPreviewIdeaId(null)
          void navigate({
            search: (prev) => ({
              ...prev,
              team,
            }),
            replace: true,
          })
        }}
        onPillarFilterChange={(pillar) => {
          setPreviewIdeaId(null)
          void navigate({
            search: (prev) => ({
              ...prev,
              pillar,
            }),
            replace: true,
          })
        }}
        onPreview={(idea) => setPreviewIdeaId(idea.ID)}
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
        onConfirm={() => {
          if (pendingTransition) {
            updateWorkshopStatus(pendingTransition)
          }
        }}
      />

      {previewIdea && (
        <IdeaPreviewDialog
          idea={previewIdea}
          open
          position={previewIdeaIndex + 1}
          total={ideas.length}
          hasPrevious={hasPreviousIdea}
          hasNext={hasNextIdea}
          onPrevious={() => {
            if (!hasPreviousIdea) return
            setPreviewIdeaId(ideas[previewIdeaIndex - 1].ID)
          }}
          onNext={() => {
            if (!hasNextIdea) return
            setPreviewIdeaId(ideas[previewIdeaIndex + 1].ID)
          }}
          onOpenChange={(open) => {
            if (!open) setPreviewIdeaId(null)
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
            <p className="text-sm font-medium">
              {getWorkshopPhase(status).message}
            </p>
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
              className="w-full sm:w-auto"
              disabled={isUpdating}
              onClick={() => onRequestTransition("Reveal")}
            >
              {isUpdating ? <Spinner /> : <EyeIcon />}
              Reveal Results
            </Button>
          )}
          {status === "Reveal" && (
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
    {
      label: "Teams",
      description: "Bifurcation of all participants",
      value: totalTeams,
      icon: UsersIcon,
    },
    {
      label: "Pillars",
      description: "Broad interaction buckets",
      value: totalPillars,
      icon: FolderKanbanIcon,
    },
    {
      label: "Ideas",
      description: "Ready for shortlist",
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
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="mt-2 text-3xl leading-none font-semibold tabular-nums">
                  {String(stat.value).padStart(2, "0")}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {stat.description}
                </p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
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
  teamId,
  pillarId,
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
  teamId?: number
  pillarId?: number
  isLoading: boolean
  errorMessage: string | null
  onTeamFilterChange: (value?: number) => void
  onPillarFilterChange: (value?: number) => void
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
  const isFiltered = teamId !== undefined || pillarId !== undefined

  return (
    <section
      className="space-y-0.5"
      aria-labelledby="idea-tracker-heading"
      aria-busy={isLoading}
    >
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
              value={teamId ? String(teamId) : "all"}
              onValueChange={(value) => {
                if (typeof value !== "string") return
                onTeamFilterChange(value === "all" ? undefined : Number(value))
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
              value={pillarId ? String(pillarId) : "all"}
              onValueChange={(value) => {
                if (typeof value !== "string") return

                onPillarFilterChange(
                  value === "all" ? undefined : Number(value)
                )
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
          <CardTitle>{idea.title ?? "Untitled"}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <UsersIcon />
            {idea.TeamName || "Unknown team"}
          </Badge>
          <Badge variant="outline">
            <ShapesIcon />
            {idea.CategoryName || "Unknown pillar"}
          </Badge>
          {idea.flgTeam && (
            <Badge>
              <StarIcon fill="currentColor" />
              Shortlisted
            </Badge>
          )}
          {idea.flgCoach && (
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <SparklesIcon />
              Sharpened
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3Icon className="size-3" />
            Submitted {formatRelativeDate(idea.CreatedDttm)}
          </span>
          {!!idea.TotalVote && (
            <>
              <span
                className="size-0.5 rounded-full bg-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ThumbsUpIcon className="size-3" />
                {idea.TotalVote} {idea.TotalVote === 1 ? "vote" : "votes"}
              </span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-4">
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {idea.Desc}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-auto w-full"
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
  position,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onOpenChange,
}: {
  idea: ManageIdea
  open: boolean
  position: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden bg-background p-0 text-foreground ring-0 sm:max-w-none"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" && hasPrevious) {
            event.preventDefault()
            onPrevious()
          }

          if (event.key === "ArrowRight" && hasNext) {
            event.preventDefault()
            onNext()
          }
        }}
      >
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.16em] uppercase">
              Idea preview
            </span>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <p
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              Idea {position} of {total}
            </p>
          </div>

          <DialogClose
            render={
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-full"
                aria-label="Close idea preview"
              />
            }
          >
            <XIcon />
          </DialogClose>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:overflow-hidden">
          <div className="relative flex min-h-[48dvh] items-center justify-center overflow-hidden bg-neutral-950 p-12 sm:p-16 lg:min-h-0">
            <IdeaThumbnail key={idea.ID} idea={idea} />

            <button
              type="button"
              className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-25 sm:left-6 sm:size-12"
              aria-label="View previous idea"
              disabled={!hasPrevious}
              onClick={onPrevious}
            >
              <ChevronLeftIcon className="size-6" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-25 sm:right-6 sm:size-12"
              aria-label="View next idea"
              disabled={!hasNext}
              onClick={onNext}
            >
              <ChevronRightIcon className="size-6" aria-hidden="true" />
            </button>
          </div>

          <aside className="min-w-0 border-t border-border lg:overflow-y-auto lg:border-t-0 lg:border-l">
            <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col-reverse gap-2 sm:flex-col">
                <p className="text-sm leading-6 text-muted-foreground">
                  Submitted {formatRelativeDate(idea.CreatedDttm)}
                </p>
                <DialogTitle className="text-3xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
                  {idea.title ?? "Untitled"}
                </DialogTitle>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <UsersIcon />
                  {idea.TeamName || "Unknown team"}
                </Badge>
                <Badge variant="outline">
                  <ShapesIcon />
                  {idea.CategoryName || "Unknown pillar"}
                </Badge>
                {idea.flgTeam && (
                  <Badge>
                    <StarIcon fill="currentColor" />
                    Shortlisted
                  </Badge>
                )}
                {idea.flgCoach && (
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <SparklesIcon />
                    Sharpened
                  </Badge>
                )}
                {!!idea.TotalVote && (
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    <ThumbsUpIcon />
                    {idea.TotalVote} {idea.TotalVote === 1 ? "vote" : "votes"}
                  </Badge>
                )}
              </div>

              <div className="my-8 border-t border-border" />

              <DialogDescription className="text-base leading-7 whitespace-pre-line">
                {idea.Desc}
              </DialogDescription>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IdeaThumbnail({ idea }: { idea: ManageIdea }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const imageUrl = idea.imageFileName?.trim() || null

  if (!imageUrl || failedImageUrl === imageUrl) {
    return (
      <div
        className="flex size-full items-center justify-center text-muted-foreground"
        aria-label={`${idea.title ?? "Untitled"} thumbnail unavailable`}
      >
        <ImageIcon className="size-8" />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={`${idea.title ?? "Untitled"} submission thumbnail`}
      className="size-full object-contain"
      onError={() => setFailedImageUrl(imageUrl)}
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
  onConfirm: () => void
}) {
  const isEnding = targetStatus === "Completed"
  const isRevealing = targetStatus === "Reveal"

  return (
    <AlertDialog open={Boolean(targetStatus)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={isEnding ? "text-destructive" : undefined}
          >
            {isEnding ? (
              <ShieldAlertIcon />
            ) : isRevealing ? (
              <EyeIcon />
            ) : (
              <TagsIcon />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isEnding
              ? "End this workshop?"
              : isRevealing
                ? "Reveal voting results?"
                : "Start voting?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isEnding
              ? "This completes the workshop. Returning to an earlier phase requires resetting the workshop, which may clear workshop activity."
              : isRevealing
                ? "This ends voting and reveals the results to participants."
                : "This starts voting. Returning to ideation requires resetting the workshop, which may clear workshop activity."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isEnding ? "destructive" : "default"}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <Spinner />}
            {isPending
              ? isEnding
                ? "Ending..."
                : isRevealing
                  ? "Revealing..."
                  : "Starting..."
              : isEnding
                ? "End Workshop"
                : isRevealing
                  ? "Reveal Results"
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
