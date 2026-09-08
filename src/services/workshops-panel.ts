import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

export type WorkshopFilterStatus =
  "in-progress" | "not-started" | "completed" | "all"
export type WorkshopStatus = "Ideate" | "Vote" | "Completed"

export interface WorkshopList {
  ID: string
  Name: string
  WorkshopCode: string
  isPromptGen: boolean
  Desc: string
  TotalIdea: number | null
  logoFileName: string | null
  status: WorkshopStatus | null
  AdminName: string | null
  CreatedDttm: string
  CreatedBy: string
}

interface GetWorkshopsResponse {
  success: boolean
  data: WorkshopList[]
}

interface WorkshopParams {
  status: WorkshopFilterStatus
}

const getWorkshops = async (params: WorkshopParams) => {
  const res = await apiClient.get<GetWorkshopsResponse>("/admin/workshop", {
    params,
  })

  return res.data
}

export function getWorkshopsOptions(params: WorkshopParams) {
  return queryOptions({
    queryKey: ["WORKSHOPS", params],
    queryFn: () => getWorkshops(params),
  })
}

interface ResetWorkshopPayload {
  id: string
}

const resetWorkshop = async (payload: ResetWorkshopPayload) => {
  const res = await apiClient.post<{
    success: boolean
    message: string
  }>(`/admin/workshop/reset/${payload.id}`, payload)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useResetWorkshop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ResetWorkshopPayload) => resetWorkshop(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["WORKSHOPS"],
      })
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

interface DuplicateWorkshopPayload {
  workshop_id: string
  workshop_code: string
}

const duplicateWorkshop = async (payload: DuplicateWorkshopPayload) => {
  const res = await apiClient.post<{
    success: boolean
    message: string
  }>(`/admin/duplicate`, payload)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useDuplicateWorkshop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DuplicateWorkshopPayload) =>
      duplicateWorkshop(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["WORKSHOPS"],
      })
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}
