import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

// ---------------------------------------------
// TYPES
// ---------------------------------------------

export interface Walkthrough {
  ID: string
  Title: string
  Description: string
  DisplayOrder: number
  IsActive: boolean
  CreatedBy: number
  CreatedDttm: number
}

export interface WalkthroughResponse {
  success: boolean
  data: Walkthrough[]
}

interface GetWalkthroughParams {
  id?: string
}

interface SaveWalkthroughPayload {
  ID?: string
  Title: string
  Description: string
  IsActive: boolean
}

interface DeleteWalkthroughPayload {
  id: string
}

export interface WalkthroughSequenceItem {
  id: string
  sequence: number
}

export interface UpdateWalkthroughSequencePayload {
  order: WalkthroughSequenceItem[]
}

// ---------------------------------------------
// QUERY KEYS
// ---------------------------------------------

export const walkthroughKeys = {
  all: ["WALKTHROUGH"] as const,

  list: (params?: GetWalkthroughParams) => ["WALKTHROUGH", params] as const,
}

// ---------------------------------------------
// GET WALKTHROUGHS
// ---------------------------------------------

const getWalkthrough = async (
  params?: GetWalkthroughParams
): Promise<WalkthroughResponse> => {
  const res = await apiClient.get("/admin/walk-through", {
    params,
  })

  return res.data
}

export const getWalkthroughOptions = (params?: GetWalkthroughParams) =>
  queryOptions({
    queryKey: walkthroughKeys.list(params),
    queryFn: () => getWalkthrough(params),
  })

// ---------------------------------------------
// SAVE WALKTHROUGH
// ---------------------------------------------

const saveWalkthrough = async (
  payload: SaveWalkthroughPayload
): Promise<{
  success: boolean
  message: string
}> => {
  const res = await apiClient.post("/admin/walk-through", payload)

  if (!res.data.success) {
    throw new Error(res.data.message)
  }

  return res.data
}

export const useSaveWalkthrough = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveWalkthrough,

    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: walkthroughKeys.all,
      })
    },

    onError: (error: Error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

// ---------------------------------------------
// DELETE WALKTHROUGH
// ---------------------------------------------

const deleteWalkthrough = async (
  payload: DeleteWalkthroughPayload
): Promise<{
  success: boolean
  message: string
}> => {
  const res = await apiClient.delete(`/admin/walk-through/${payload.id}`)

  if (!res.data.success) {
    throw new Error(res.data.message)
  }

  return res.data
}

export const useDeleteWalkthrough = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWalkthrough,

    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: walkthroughKeys.all,
      })
    },

    onError: (error: Error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

// ---------------------------------------------
// UPDATE WALKTHROUGH SEQUENCE
// ---------------------------------------------

const updateWalkthroughSequence = async (
  payload: UpdateWalkthroughSequencePayload
): Promise<{
  success: boolean
  message: string
}> => {
  const res = await apiClient.post("/admin/walk-through/sequence", payload)

  if (!res.data.success) {
    throw new Error(res.data.message)
  }

  return res.data
}

// ---------------------------------------------
// OPTIMISTIC WALKTHROUGH SEQUENCE
// ---------------------------------------------

export const useUpdateWalkthroughSequence = () => {
  const queryClient = useQueryClient()

  const queryKey = walkthroughKeys.list()

  return useMutation({
    mutationFn: updateWalkthroughSequence,

    onMutate: async ({ order }) => {
      // Prevent an in-flight refetch from overwriting
      // our optimistic ordering.
      await queryClient.cancelQueries({
        queryKey,
        exact: true,
      })

      // Snapshot current server/cache state.
      const previousWalkthroughs =
        queryClient.getQueryData<WalkthroughResponse>(queryKey)

      const sequenceMap = new Map(
        order.map(({ id, sequence }) => [id, sequence])
      )

      // Update cache immediately.
      queryClient.setQueryData<WalkthroughResponse>(queryKey, (current) => {
        if (!current) {
          return current
        }

        const data = current.data
          .map((walkthrough) => {
            const sequence = sequenceMap.get(walkthrough.ID)

            if (sequence === undefined) {
              return walkthrough
            }

            return {
              ...walkthrough,
              DisplayOrder: sequence,
            }
          })
          .sort(
            (first, second) =>
              first.DisplayOrder - second.DisplayOrder ||
              first.Title.localeCompare(second.Title)
          )

        return {
          ...current,
          data,
        }
      })

      // Returned value becomes onError context.
      return {
        previousWalkthroughs,
      }
    },

    onError: (error, _variables, context) => {
      // Roll back optimistic update.
      if (context?.previousWalkthroughs) {
        queryClient.setQueryData(queryKey, context.previousWalkthroughs)
      }

      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description:
          error instanceof Error
            ? error.message
            : "Unable to update walkthrough order.",
      })
    },

    onSettled: () => {
      // Confirm order against server state.
      return queryClient.invalidateQueries({
        queryKey: walkthroughKeys.all,
      })
    },
  })
}
