import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"

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
