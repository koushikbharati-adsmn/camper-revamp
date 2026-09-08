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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type WorkshopList,
  type WorkshopStatus,
  getWorkshopsOptions,
  useDeleteWorkshop,
  useDuplicateWorkshop,
  useResetWorkshop,
} from "@/services/workshops-panel"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import {
  ClipboardIcon,
  CopyIcon,
  EllipsisIcon,
  LightbulbIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SquarePenIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react"
import { useState } from "react"
import * as z from "zod"

const workshopFilterStatusSchema = z.enum([
  "all",
  "completed",
  "not-started",
  "in-progress",
])

export const Route = createFileRoute("/_authenticated/workshops/")({
  validateSearch: z.object({
    status: workshopFilterStatusSchema.optional().default("all"),
  }),
  loaderDeps: ({ search }) => ({ status: search.status ?? "all" }),
  loader: ({ context, deps }) =>
    context.queryClient.query(getWorkshopsOptions(deps)),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: WorkshopsPending,
  errorComponent: WorkshopsError,
  component: RouteComponent,
})

const items = [
  { label: "Select a status", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Not Started", value: "not-started" },
  { label: "In Progress", value: "in-progress" },
]

function RouteComponent() {
  const navigate = Route.useNavigate()
  const { status: searchStatus } = Route.useSearch()
  const { data: response } = useSuspenseQuery(
    getWorkshopsOptions({ status: searchStatus })
  )
  const [actionTarget, setActionTarget] = useState<WorkshopActionTarget | null>(
    null
  )

  return (
    <div>
      <WorkshopsHeader />

      <section className="mb-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <InputGroup className="w-full sm:max-w-xs">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <Select
          items={items}
          value={searchStatus}
          onValueChange={(value) => {
            const parsedStatus = workshopFilterStatusSchema.safeParse(value)

            if (!parsedStatus.success) return

            void navigate({
              search: {
                status:
                  parsedStatus.data === "all" ? undefined : parsedStatus.data,
              },
              replace: true,
            })
          }}
        >
          <SelectTrigger className="w-full sm:max-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Workshop Status</SelectLabel>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </section>

      {response.data.length === 0 ? (
        <div className="border border-dashed p-10 text-center">
          <h2 className="font-semibold">No workshops found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No workshops match the selected status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {response.data.map((workshop) => (
            <WorkshopCard
              key={workshop.ID}
              workshop={workshop}
              onDuplicate={() =>
                setActionTarget({ action: "duplicate", workshop })
              }
              onReset={() => setActionTarget({ action: "reset", workshop })}
              onDelete={() => setActionTarget({ action: "delete", workshop })}
            />
          ))}
        </div>
      )}

      <WorkshopActionDialog
        target={actionTarget}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null)
        }}
      />
    </div>
  )
}

function WorkshopsHeader() {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Workshops</h1>
        <p className="text-sm text-muted-foreground">
          View, Create & Assign Workshops and Create New Administrators
        </p>
      </div>
      <Button
        render={<Link to="/workshops/new" />}
        className="w-full sm:w-auto"
      >
        <PlusIcon />
        New Workshop
      </Button>
    </header>
  )
}

function WorkshopCard({
  workshop,
  onDuplicate,
  onReset,
  onDelete,
}: {
  workshop: WorkshopList
  onDuplicate: () => void
  onReset: () => void
  onDelete: () => void
}) {
  const status = getDisplayStatus(workshop.status, workshop.isPromptGen)

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <WorkshopLogo
            name={workshop.Name}
            logoFileName={workshop.logoFileName}
          />
          <div className="min-w-0">
            <CardTitle className="truncate">{workshop.Name}</CardTitle>
            <CardDescription>
              {formatCreatedDate(workshop.CreatedDttm)}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon">
                  <EllipsisIcon />
                </Button>
              }
            />
            <DropdownMenuContent className="w-40">
              <DropdownMenuItem>
                <PlayIcon />
                Manage Workshop
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SquarePenIcon />
                Edit Workshop
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <CopyIcon />
                Duplicate Workshop
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ClipboardIcon />
                Copy Bigscreen Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReset}>
                <RotateCcwIcon />
                Reset Workshop
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <TrashIcon />
                Delete Workshop
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-3 text-sm">
          {workshop.Desc || "No description provided."}
        </p>
        <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <li className="flex w-full items-center gap-1">
            <Badge className={status.className}>
              {!workshop.isPromptGen && <Spinner />}
              {status.label}
            </Badge>
          </li>
          <li className="flex items-center gap-1">
            <LightbulbIcon className="size-3" />
            {workshop.TotalIdea || 0}&nbsp;
            {workshop.TotalIdea === 1 ? "idea" : "ideas"}
          </li>
          <li className="flex items-center gap-1">
            <UserIcon className="size-3" />
            {workshop.AdminName || "Unassigned"}
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}

type WorkshopActionTarget = {
  action: "duplicate" | "reset" | "delete"
  workshop: WorkshopList
}

function WorkshopActionDialog({
  target,
  onOpenChange,
}: {
  target: WorkshopActionTarget | null
  onOpenChange: (open: boolean) => void
}) {
  const resetWorkshopMutation = useResetWorkshop()
  const duplicateWorkshopMutation = useDuplicateWorkshop()
  const deleteWorkshopMutation = useDeleteWorkshop()
  const isReset = target?.action === "reset"
  const isDelete = target?.action === "delete"
  const isDuplicate = target?.action === "duplicate"
  const isPending =
    resetWorkshopMutation.isPending ||
    duplicateWorkshopMutation.isPending ||
    deleteWorkshopMutation.isPending

  const confirmAction = async () => {
    if (!target) return

    try {
      const response =
        target.action === "reset"
          ? await resetWorkshopMutation.mutateAsync({
              id: target.workshop.ID,
            })
          : target.action === "duplicate"
            ? await duplicateWorkshopMutation.mutateAsync({
                workshop_id: target.workshop.ID,
                workshop_code: target.workshop.WorkshopCode,
              })
            : await deleteWorkshopMutation.mutateAsync({
                id: target.workshop.ID,
              })

      toast.add({
        type: "success",
        title:
          target.action === "reset"
            ? "Workshop reset"
            : target.action === "duplicate"
              ? "Workshop duplicated"
              : "Workshop deleted",
        description: response.message,
      })
      onOpenChange(false)
    } finally {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={isDuplicate ? undefined : "text-destructive"}
          >
            {isReset ? (
              <RotateCcwIcon className="size-5" />
            ) : isDelete ? (
              <TrashIcon className="size-5" />
            ) : (
              <CopyIcon className="size-5" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isReset ? "Reset" : isDelete ? "Delete" : "Duplicate"}{" "}
            {target?.workshop.Name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isReset
              ? `This will return ${target?.workshop.Name} to its initial state. Confirm that you want to continue.`
              : isDelete
                ? `This will permanently delete ${target?.workshop.Name}. This action cannot be undone.`
                : `This will create a new workshop using ${target?.workshop.Name} as its source. Confirm that you want to continue.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isDuplicate ? "default" : "destructive"}
            disabled={!target || isPending}
            onClick={() => void confirmAction()}
          >
            {isPending && <Spinner />}
            {isPending
              ? isReset
                ? "Resetting..."
                : isDelete
                  ? "Deleting..."
                  : "Duplicating..."
              : isReset
                ? "Reset workshop"
                : isDelete
                  ? "Delete workshop"
                  : "Duplicate workshop"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function WorkshopLogo({
  name,
  logoFileName,
}: {
  name: string
  logoFileName: string | null
}) {
  const [hasError, setHasError] = useState(false)

  if (!logoFileName || hasError) {
    return <div className="size-10 shrink-0 bg-muted" aria-hidden="true" />
  }

  return (
    <img
      className="size-10 shrink-0 object-contain"
      src={logoFileName}
      alt={`${name} logo`}
      onError={() => setHasError(true)}
    />
  )
}

function getDisplayStatus(
  status: WorkshopStatus | null,
  isPromptReady: boolean
) {
  if (!isPromptReady) {
    return {
      label: "Generating Prompt",
      className: "bg-blue-100 text-blue-700",
    }
  }
  if (status === "Completed") {
    return {
      label: "Completed",
      className: "bg-green-100 text-green-700",
    }
  }

  if (status === "Ideate" || status === "Vote") {
    return {
      label: "In Progress",
      className: "bg-amber-100 text-amber-700",
    }
  }

  return {
    label: "Not Started",
    className: "bg-zinc-100 text-zinc-700",
  }
}

function formatCreatedDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Created date unavailable"

  return `Created ${formatDistanceToNow(date, { addSuffix: true })}`
}

function WorkshopsPending() {
  return (
    <div>
      <WorkshopsHeader />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="size-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function WorkshopsError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div>
      <WorkshopsHeader />
      <div className="border border-destructive/40 p-10 text-center">
        <h2 className="font-semibold">Unable to load workshops</h2>
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
