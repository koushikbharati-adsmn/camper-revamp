import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/coaches")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/coaches"!</div>
}
