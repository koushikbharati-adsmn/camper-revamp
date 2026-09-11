import { createFileRoute } from "@tanstack/react-router"

import BigScreen from "../pages/BigScreen/BigScreen" // adjust path to match your project structure

export const Route = createFileRoute("/workshops/$id/big-screen")({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <BigScreen workshopId={id} />
}
