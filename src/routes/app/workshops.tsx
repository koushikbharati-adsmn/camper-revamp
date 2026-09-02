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
import { createFileRoute } from "@tanstack/react-router"
import {
  ClipboardIcon,
  CopyIcon,
  EllipsisIcon,
  PlayIcon,
  RotateCcwIcon,
  SquarePenIcon,
  TrashIcon,
} from "lucide-react"

export const Route = createFileRoute("/app/workshops")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Workshops</h1>
        <p className="text-sm text-muted-foreground">
          View, Create & Assign Workshops and Create New Administrators
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="size-10 shrink-0 bg-muted" />
                <div>
                  <CardTitle>Refresh the Moment, Shift the Culture</CardTitle>
                  <CardDescription>
                    about 1 month ago &middot; Managed by Koushik Bharati
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
            <CardContent>
              <p>
                A collaborative innovation workshop to create bold, culturally
                relevant ideas that turn Sprite into an active part of youth
                culture, refreshment and shared experiences.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
