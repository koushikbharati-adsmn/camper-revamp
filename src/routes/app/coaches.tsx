import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/coaches')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/coaches"!</div>
}
