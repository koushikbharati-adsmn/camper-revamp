import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workshops/$code/participants')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workshops/$code/participants"!</div>
}
