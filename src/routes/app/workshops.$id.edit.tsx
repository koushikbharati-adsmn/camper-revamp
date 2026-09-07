import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/workshops/$id/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/workshops/$id/edit"!</div>
}
