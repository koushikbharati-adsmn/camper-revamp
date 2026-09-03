import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/app/workshops/new")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">New Workshop</h1>
        <p className="text-sm text-muted-foreground">
          Build a workshop by switching things on.
        </p>
      </header>
      Hello "/app/workshops/new"!
    </div>
  )
}
