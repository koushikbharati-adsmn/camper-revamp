import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workshops/$id/big-screen')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workshops/$id/big-screen"!</div>
}
