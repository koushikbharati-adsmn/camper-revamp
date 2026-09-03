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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFileRoute, Link } from "@tanstack/react-router"
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

export const Route = createFileRoute("/app/workshops/")({
  component: RouteComponent,
})

const items = [
  { label: "Select a status", value: null },
  { label: "Completed", value: "completed" },
  { label: "Not Started", value: "not-started" },
  { label: "In Progress", value: "in-progress" },
]

function RouteComponent() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Workshops</h1>
        <p className="text-sm text-muted-foreground">
          View, Create & Assign Workshops and Create New Administrators
        </p>
      </header>

      <section className="mb-6 flex items-center justify-end gap-2">
        <InputGroup className="w-full max-w-xs">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <Select items={items}>
          <SelectTrigger className="w-full max-w-48">
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="size-10 shrink-0 bg-muted" />
                <div>
                  <CardTitle>Refresh the Moment, Shift the Culture</CardTitle>
                  <CardDescription>Created about 1 month ago</CardDescription>
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
            <CardContent className="space-y-4">
              <p>
                A collaborative innovation workshop to create bold, culturally
                relevant ideas that turn Sprite into an active part of youth
                culture, refreshment and shared experiences.
              </p>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <li className="flex w-full items-center gap-1">
                  <Badge className="bg-green-100 text-green-700">
                    Completed
                  </Badge>
                </li>
                <li className="flex items-center gap-1">
                  <LightbulbIcon className="size-3" />
                  23 ideas
                </li>
                <li className="flex items-center gap-1">
                  <UserIcon className="size-3" />
                  Koushik Bharati
                </li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
