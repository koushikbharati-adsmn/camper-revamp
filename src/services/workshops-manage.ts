import { toast } from "@/components/ui/toast"
import apiClient from "@/lib/api-client"
import type {
  WorkshopLifecycleStatus,
  WorkshopStatus,
} from "@/lib/workshop-lifecycle"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

export interface ManageWorkshop {
  ID: string
  workshopName: string // workshop name
  Desc: string // workshop description
  logoFileName: string // workshop logo url
  totalTeam: number // total number of teams
  TotalIdea: number // total number of submitted ideas
  totalCategory: number // total number of pillars
  status: WorkshopLifecycleStatus
  teams: {
    ID: number
    TeamName: string
  }[]
  categories: {
    ID: number
    Category: string
  }[]
}

export interface GetManageWorkshopResponse {
  success: boolean
  message?: string
  data: ManageWorkshop
}

const getManageWorkshop = async (code: string) => {
  const res = await apiClient.get<GetManageWorkshopResponse>(
    "/admin/run/workshop",
    {
      params: { code },
    }
  )

  if (!res.data.success) {
    throw new Error(res.data.message ?? "Unable to load the workshop")
  }

  return res.data
}

export function getManageWorkshopOptions(code: string) {
  return queryOptions({
    queryKey: ["MANAGE_WORKSHOP", code],
    queryFn: () => getManageWorkshop(code),
  })
}

export interface ManageIdea {
  ID: number
  WorkshopID: number
  TeamID: number
  TeamName: string
  CategoryID: number // pillar id
  CategoryName: string // pillar name
  title: string | null // idea title
  Desc: string // idea description
  imageFileName: string | null // idea thumbnail url
  CreatedDttm: string
  TotalVote: number // total number of votes received
  flgTeam: boolean // shortlisted flag
  flgCoach: boolean // coached flag
}

export interface GetManageIdeasResponse {
  success: boolean
  message?: string
  data: ManageIdea[]
}

export interface GetManageIdeasParams {
  code: string
  team_id: number | null
  category_id: number | null
}

const getManageIdeas = async (params: GetManageIdeasParams) => {
  const res = await apiClient.get<GetManageIdeasResponse>("/admin/run/ideas", {
    params: { ...params, shortlist: "none" },
  })

  if (!res.data.success) {
    throw new Error(res.data.message ?? "Unable to load workshop ideas")
  }

  return res.data
}

export function getManageIdeasOptions(params: GetManageIdeasParams) {
  return queryOptions({
    queryKey: ["MANAGE_IDEAS", params],
    queryFn: () => getManageIdeas(params),
  })
}

interface UpdateWorkshopStatusPayload {
  code: string
  status: WorkshopStatus
}

const updateWorkshopStatus = async (payload: UpdateWorkshopStatusPayload) => {
  const res = await apiClient.post<{
    success: boolean
    message: string
  }>("/admin/run/status", payload)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useUpdateWorkshopStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateWorkshopStatusPayload) =>
      updateWorkshopStatus(payload),
    onSuccess: (_response, payload) => {
      queryClient.setQueryData<GetManageWorkshopResponse>(
        ["MANAGE_WORKSHOP", payload.code],
        (current) =>
          current
            ? {
                ...current,
                data: { ...current.data, status: payload.status },
              }
            : current
      )

      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["MANAGE_WORKSHOP", payload.code],
        }),
        queryClient.invalidateQueries({ queryKey: ["WORKSHOPS"] }),
      ])
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

interface ExportPptPayload {
  workshop_code: string
}

interface ExportPptResponse {
  success: boolean
  message: string
  data: {
    url: string
  }
}

const exportPpt = async (payload: ExportPptPayload) => {
  const res = await apiClient.post<ExportPptResponse>("/admin/run/ppt", payload)

  if (!res.data.success || !res.data.data?.url) {
    throw new Error(res.data.message || "Unable to export the workshop report")
  }

  return res.data
}

export const useExportPpt = () => {
  return useMutation({
    mutationFn: (payload: ExportPptPayload) => exportPpt(payload),
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}
