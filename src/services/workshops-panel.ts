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

interface DeleteWorkshopPayload {
  id: string
}

const deleteWorkshop = async (payload: DeleteWorkshopPayload) => {
  const res = await apiClient.delete<{
    success: boolean
    message: string
  }>(`/admin/workshop/delete/${payload.id}`)

  if (!res.data.success) throw new Error(res.data.message)

  return res.data
}

export const useDeleteWorkshop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DeleteWorkshopPayload) => deleteWorkshop(payload),
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

export interface WorkshopById {
  ID: string
  Name: string // title
  Desc: string // subtitle
  AdminID: number | null // assigned admin
  WorkshopCode: string
  BrandName: string // brand
  WorkshopContext: string // context
  GuidelineFileName: string // brand guidelines content
  logoFileName: string // logo url
  PrimaryColor: string // primary color hex code
  SecondaryColor: string // secondary color hex code
  PortraitFileName: string // portrait background url
  LandscapeFileName: string // landscape background url
  HeadingFontFileName: string // heading font url
  BodyFontFileName: string // body font url
  CreatedBy: number
  CreatedDttm: string
  CreateDate: string
  ModifiedBy: null | string
  ModifiedDttm: string
  status: WorkshopStatus | null
  ReportFileName: null | string
  IsProtected: boolean // is teams protected with passcode
  teams: {
    ID: string
    WorkshopID: string
    TeamName: string
    TeamCode: string | null // optional team passcode (4 digits)
    TeamColorCode: string // team color hex code
    Description: string
    ThumbnailFileName: string
    CreatedDttm: string
  }[]
  categories: {
    ID: string
    WorkshopID: string
    Name: string // title
    Context: string
    CreatedDttm: string
  }[] // pillars
  coaches: {
    ID: string
    WorkshopID: string
    CoachID: number
    Title: string
    Description: string
    CoachName: string
    CoachKey: string
    AvatarFileName: string // coach avatar url
    PromptFileName: string
    IsActive: boolean
    CreatedDttm: string
    Prompt: string
  }[]
  walkThrough: {
    ID: string
    Title: string
    Description: string
    DisplayOrder: number
    IsActive: boolean
    CreatedDttm: string
    WorkshopID: string
  }[]
}

interface GetWorkshopByIdResponse {
  success: boolean
  message: string
  data: WorkshopById
}

const getWorkshopById = async (id: string) => {
  const res = await apiClient.get<GetWorkshopByIdResponse>(
    `/admin/workshop/${id}`
  )

  return res.data
}

export function getWorkshopByIdOptions(id: string) {
  return queryOptions({
    queryKey: ["WORKSHOP_ID", id],
    queryFn: () => getWorkshopById(id),
  })
}
