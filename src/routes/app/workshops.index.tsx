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
import { Spinner } from "@/components/ui/spinner"

const workshopFilterStatusSchema = z.enum([
  "all",
  "completed",
  "not-started",
  "in-progress",
])

export const Route = createFileRoute("/app/workshops/")({
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
        <Button render={<Link to="/app/workshops/new" />}>
          <PlusIcon />
          New Workshop
        </Button>
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
            <WorkshopCard key={workshop.ID} workshop={workshop} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkshopsHeader() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold">Workshops</h1>
      <p className="text-sm text-muted-foreground">
        View, Create & Assign Workshops and Create New Administrators
      </p>
    </header>
  )
}

function WorkshopCard({ workshop }: { workshop: WorkshopList }) {
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
              <DropdownMenuItem>
                <CopyIcon />
                Duplicate Workshop
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ClipboardIcon />
                Copy Bigscreen Link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <RotateCcwIcon />
                Reset Workshop
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
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
