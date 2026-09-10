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
  }>(`/admin/workshop/${payload.id}`)

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
    BGColor: string
    PrimaryTxtColor: string
    SecondaryTxtColor: string
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

type WorkshopAction = "add" | "update" | "delete"

interface AddUpdateWorkshopPayload {
  id?: string
  name: string // title
  admin_id: string | null // assigned admin
  brand_name: string
  description: string // subtitle
  context: string
  guidelines: string

  header_bg_color: string
  header_txt_color: string
  page_bg_color: string
  txt_primary_color: string
  txt_secondary_color: string
  btn_primary_bg_color: string
  btn_primary_txt_color: string
  btn_secondary_bg_color: string
  btn_secondary_active_bg_color: string
  btn_secondary_txt_color: string
  btn_secondary_border_color: string
  card_primary_bg_color: string
  card_primary_border_color: string
  card_primary_border_radius: number
  card_primary_border_width: number
  card_secondary_bg_color: string
  card_secondary_border_radius: number
  card_secondary_txt_color: string
  ticker_live_bg_color: string
  ticker_live_txt_color: string
  ticker_bg_color: string
  ticker_txt_color: string

  logo_filename: File | null
  page_bg_image: File | null
  font_primary: File | null
  font_secondary: File | null

  avatar_files: File[] // coach avatars
  team_thumbnails: File[] // team thumbnails

  is_changed: boolean

  teams: {
    id: string | null
    teamName: string
    description: string
    teamCode: string | null
    teamColorCode: string
    thumbnailFileName: string | null
    thumbnailFileIndex: number | null
    action: WorkshopAction
  }[]
  categories: {
    id: string | null
    name: string // pillar title
    context: string
    action: WorkshopAction
  }[]
  walkThrough: {
    id: string | null
    title: string
    description: string
    displayOrder: number
    action: WorkshopAction
  }[]
  coach: {
    coachID: string
    coachName: string
    coachKey: string
    title: string
    description: string
    bGColor: string
    primaryTxtColor: string
    secondaryTxtColor: string
    avatarFileName: string | null
    avatarFileIndex: number | null
    isActive: boolean
    action: WorkshopAction
  }[]
}

interface AddUpdateWorkshopResponse {
  success: boolean
  message: string
}

const AddUpdateWorkshop = async (payload: AddUpdateWorkshopPayload) => {
  const formData = new FormData()

  if (payload.id) formData.append("id", payload.id)

  formData.append("name", payload.name)
  formData.append("brand_name", payload.brand_name)
  if (payload.admin_id) {
    formData.append("admin_id", payload.admin_id)
  }
  formData.append("context", payload.context)
  formData.append("description", payload.description)
  formData.append("guidelines", payload.guidelines)

  formData.append("header_bg_color", payload.header_bg_color)
  formData.append("header_txt_color", payload.header_txt_color)
  formData.append("page_bg_color", payload.page_bg_color)
  formData.append("txt_primary_color", payload.txt_primary_color)
  formData.append("txt_secondary_color", payload.txt_secondary_color)
  formData.append("btn_primary_bg_color", payload.btn_primary_bg_color)
  formData.append("btn_primary_txt_color", payload.btn_primary_txt_color)
  formData.append("btn_secondary_bg_color", payload.btn_secondary_bg_color)
  formData.append(
    "btn_secondary_active_bg_color",
    payload.btn_secondary_active_bg_color
  )
  formData.append("btn_secondary_txt_color", payload.btn_secondary_txt_color)
  formData.append(
    "btn_secondary_border_color",
    payload.btn_secondary_border_color
  )
  formData.append("card_primary_bg_color", payload.card_primary_bg_color)
  formData.append(
    "card_primary_border_color",
    payload.card_primary_border_color
  )
  formData.append(
    "card_primary_border_radius",
    String(payload.card_primary_border_radius)
  )
  formData.append(
    "card_primary_border_width",
    String(payload.card_primary_border_width)
  )
  formData.append("card_secondary_bg_color", payload.card_secondary_bg_color)
  formData.append(
    "card_secondary_border_radius",
    String(payload.card_secondary_border_radius)
  )
  formData.append("card_secondary_txt_color", payload.card_secondary_txt_color)
  formData.append("ticker_live_bg_color", payload.ticker_live_bg_color)
  formData.append("ticker_live_txt_color", payload.ticker_live_txt_color)
  formData.append("ticker_bg_color", payload.ticker_bg_color)
  formData.append("ticker_txt_color", payload.ticker_txt_color)

  if (payload.page_bg_image)
    formData.append("page_bg_image", payload.page_bg_image)
  if (payload.font_primary)
    formData.append("font_primary", payload.font_primary)
  if (payload.font_secondary)
    formData.append("font_secondary", payload.font_secondary)

  if (payload.logo_filename)
    formData.append("logo_filename", payload.logo_filename)

  payload.avatar_files.forEach((file) => {
    formData.append("avatar_files", file)
  })

  payload.team_thumbnails.forEach((file) => {
    formData.append("team_thumbnails", file)
  })

  formData.append("teams", JSON.stringify(payload.teams))
  formData.append("categories", JSON.stringify(payload.categories))
  formData.append("coach", JSON.stringify(payload.coach))
  formData.append("welcome", JSON.stringify(payload.walkThrough))

  formData.append("is_changed", String(payload.is_changed))

  const res = await apiClient.post<AddUpdateWorkshopResponse>(
    "/admin/workshop",
    formData
  )

  return res.data
}

export const useAddUpdateWorkshop = () => {
  return useMutation({
    mutationFn: (payload: AddUpdateWorkshopPayload) =>
      AddUpdateWorkshop(payload),
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}
