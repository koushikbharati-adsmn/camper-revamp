import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/workshops/$id/manage")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workshops/$id/manage"!</div>
}
