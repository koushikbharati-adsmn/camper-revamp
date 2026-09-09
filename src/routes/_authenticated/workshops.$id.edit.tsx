import {
  createEditWorkshopFormValue,
  WorkshopForm,
} from "@/components/workshop-form"
import { getUsersOptions } from "@/services/users"
import { getWorkshopByIdOptions } from "@/services/workshops-panel"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

const activeAdminOptions = getUsersOptions({
  is_active: true,
  role: "Admin",
})

export const Route = createFileRoute("/_authenticated/workshops/$id/edit")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.query(getWorkshopByIdOptions(params.id)),
      context.queryClient.query(activeAdminOptions),
    ]),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: workshop } = useSuspenseQuery({
    ...getWorkshopByIdOptions(id),
    select: (data) => data.data,
  })
  const { data: users } = useSuspenseQuery({
    ...activeAdminOptions,
    select: (data) => data.data,
  })
  return (
    <WorkshopForm
      key={workshop.ID}
      mode="edit"
      initialValue={createEditWorkshopFormValue(workshop)}
      users={users}
      onSubmit={(updatedWorkshop) =>
        console.log("Updated workshop", updatedWorkshop)
      }
    />
  )
}
