import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/workshops/$id/edit")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workshops/$id/edit"!</div>
}
