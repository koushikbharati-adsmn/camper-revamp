import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/walkthroughs")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/walkthrough"!</div>
}
