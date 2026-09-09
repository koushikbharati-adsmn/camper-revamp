import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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
    queryKey: ["WALKTHROUGH", params],
    queryFn: () => getWalkthrough(params),
  })

interface SaveWalkthroughPayload {
  ID?: string
  Title: string
  Description: string
  IsActive: boolean
}

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
      queryClient.invalidateQueries({
        queryKey: ["WALKTHROUGH"],
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

interface DeleteWalkthroughPayload {
  id: string
}

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
      queryClient.invalidateQueries({
        queryKey: ["WALKTHROUGH"],
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

interface WalkthroughSequenceItem {
  id: string
  sequence: number
}

interface UpdateWalkthroughSequencePayload {
  order: WalkthroughSequenceItem[]
}

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

export const useUpdateWalkthroughSequence = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWalkthroughSequence,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["WALKTHROUGH"],
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
