import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import { urlToFile } from "@/lib/utils"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

export interface CoachItem {
  ID: string
  CoachKey: string
  CoachName: string
  Title: string
  Description: string
  AvatarFileName: string
  PromptFileName: string
  IsActive: boolean
  CreatedBy: number
  CreatedDttm: string
  Prompt: string
}

interface GetCoachesResponse {
  success: boolean
  data: CoachItem[]
}

const getCoaches = async () => {
  const res = await apiClient.get<GetCoachesResponse>("/admin/coach")

  return res.data
}

export function getCoachesOptions() {
  return queryOptions({
    queryKey: ["COACHES"],
    queryFn: getCoaches,
  })
}

export interface SaveCoachPayload {
  id?: string
  name: string
  title: string
  description: string
  prompt: string
  avatarUrl: string
  is_active: boolean
}

const saveCoach = async (
  payload: SaveCoachPayload
): Promise<{
  success: boolean
  message: string
}> => {
  const formData = new FormData()

  formData.append("name", payload.name)
  formData.append("title", payload.title)
  formData.append("description", payload.description)
  formData.append("prompt", payload.prompt)
  formData.append("is_active", String(payload.is_active))

  if (payload.id) {
    formData.append("id", payload.id)
  }

  const avatar = await urlToFile(payload.avatarUrl, "avatar.png")

  if (avatar) {
    formData.append("avatar", avatar)
  }

  const res = await apiClient.post<{
    success: boolean
    message: string
  }>("/admin/coach", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useSaveCoach = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveCoach,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["COACHES"],
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

export interface DeleteCoachPayload {
  id: string
}

const deleteCoach = async (
  payload: DeleteCoachPayload
): Promise<{
  success: boolean
  message: string
}> => {
  const res = await apiClient.delete<{
    success: boolean
    message: string
  }>(`/admin/coach?id=${payload.id}`)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useDeleteCoach = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCoach,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["COACHES"],
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
