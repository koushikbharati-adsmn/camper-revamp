import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"

export interface CoachItem {
  ID: string
  CoachKey: string
  CoachName: string
  CoachTitle: string
  CoachDescription: string
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
