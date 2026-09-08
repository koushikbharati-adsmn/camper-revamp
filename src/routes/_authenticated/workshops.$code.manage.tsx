import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/workshops/$code/manage")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/workshops/$id/manage"!</div>
}
