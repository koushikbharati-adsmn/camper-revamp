import {
  createNewWorkshopFormValue,
  WorkshopForm,
} from "@/components/workshop-form"
import { toast } from "@/components/ui/toast"
import { createWorkshopPayload } from "@/lib/workshop-payload"
import { getCoachesOptions } from "@/services/coaches"
import { getUsersOptions } from "@/services/users"
import { getWalkthroughOptions } from "@/services/walkthroughs"
import { useAddUpdateWorkshop } from "@/services/workshops-panel"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

const activeAdminOptions = getUsersOptions({
  is_active: true,
  role: "Admin",
})
const activeWalkthroughOptions = getWalkthroughOptions({ active: true })

export const Route = createFileRoute("/_authenticated/workshops/new")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(activeAdminOptions),
      context.queryClient.query(getCoachesOptions()),
      context.queryClient.query(activeWalkthroughOptions),
    ]),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const addUpdateWorkshopMutation = useAddUpdateWorkshop()
  const { data: users } = useSuspenseQuery({
    ...activeAdminOptions,
    select: (data) => data.data,
  })
  const { data: coaches } = useSuspenseQuery({
    ...getCoachesOptions(),
    select: (data) => data.data,
  })
  const { data: walkthroughs } = useSuspenseQuery({
    ...activeWalkthroughOptions,
    select: (data) => data.data,
  })

  return (
    <WorkshopForm
      mode="create"
      initialValue={createNewWorkshopFormValue(coaches, walkthroughs)}
      users={users}
      isSubmitting={addUpdateWorkshopMutation.isPending}
      onSubmit={async (workshop) => {
        try {
          const response = await addUpdateWorkshopMutation.mutateAsync(
            createWorkshopPayload(workshop)
          )
          toast.add({
            type: "success",
            title: "Workshop created",
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
