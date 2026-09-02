import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/workshops')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/workshops"!</div>
}
