import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/app/workshops/$id/manage")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/workshops/$id/manage"!</div>
}
