import {
  createEditWorkshopFormValue,
  WorkshopForm,
} from "@/components/workshop-form"
import { toast } from "@/components/ui/toast"
import { updateWorkshopPayload } from "@/lib/workshop-payload"
import { getUsersOptions } from "@/services/users"
import {
  getWorkshopByIdOptions,
  useAddUpdateWorkshop,
} from "@/services/workshops-panel"
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
  const navigate = Route.useNavigate()
  const addUpdateWorkshopMutation = useAddUpdateWorkshop()
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
      isSubmitting={addUpdateWorkshopMutation.isPending}
      onSubmit={async (updatedWorkshop) => {
        try {
          const response = await addUpdateWorkshopMutation.mutateAsync(
            updateWorkshopPayload(updatedWorkshop, workshop)
          )
          toast.add({
            type: "success",
            title: "Workshop updated",
            description: response.message,
          })
          await navigate({ to: "/workshops" })
        } catch {
          return
        }
      }}
    />
  )
}
