import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"

// ---------------------------------------------
// TYPES
// ---------------------------------------------

export interface WorkshopTeam {
  ID: string
  WorkshopID: string
  TeamName: string
  TeamColorCode: string | null
  ThumbnailFileName: string | null
}

export interface WorkshopCategory {
  ID: string
  WorkshopID: string
  Name: string
  Context: string | null
}

export interface Workshop {
  ID: string
  Name: string
  Desc: string | null
  WorkshopCode: string
  logoFileName: string | null
  page_bg_image: string | null
  font_primary_name: string | null
  font_secondary_name: string | null
  teams: WorkshopTeam[]
  categories: WorkshopCategory[]
}

export interface Idea {
  ID: number
  TeamName: string
  Category: string
  Desc: string
  title: string | null
  imageFileName: string | null
  flgSelf: boolean
  flgScout: boolean
  flgTeam: boolean | null
  flgAdmin: boolean | null
  flgCoach: boolean // isSharpened
  Votes?: number
  CreatedDttm?: string
}

export interface GetIdeasResponse {
  success: boolean
  data: Idea[]
}

export interface GetIdeasParams {
  workshop_code: string
  // The encrypted team/category ID from Workshop["teams"]/["categories"],
  // as returned by getWorkshopOptions — the API decrypts it server-side.
  category_id?: string | null
  team_id?: string | null
}

export interface GetWorkshopResponse {
  success: boolean
  data: Workshop
}

export interface DashboardOverall {
  Draft: number
  Shortlisted: number
  Sharpened: number
  TotalIdeas: number
}

export interface DashboardTeamStat {
  TeamID: number
  TeamName: string
  Drafts: number
  Shortlisted: number
  Sharpened: number
  TotalIdeas: number
}

export interface GetDashboardResponse {
  success: boolean
  data: {
    overall: DashboardOverall
    teams: DashboardTeamStat[]
  }
}

// ---------------------------------------------
// QUERY KEYS
// ---------------------------------------------

export const ideaKeys = {
  all: ["BIG_SCREEN_IDEAS"] as const,

  list: (params: GetIdeasParams) => ["BIG_SCREEN_IDEAS", params] as const,
}

export const workshopKeys = {
  detail: (code: string) => ["BIG_SCREEN_WORKSHOP", code] as const,
}

export const dashboardKeys = {
  detail: (code: string) => ["BIG_SCREEN_DASHBOARD", code] as const,
}

// ---------------------------------------------
// GET IDEAS
// ---------------------------------------------

const getIdeas = async (params: GetIdeasParams): Promise<GetIdeasResponse> => {
  const res = await apiClient.get<GetIdeasResponse>("/api/big/idea", {
    params,
  })

  return res.data
}

export const getIdeasOptions = (params: GetIdeasParams) =>
  queryOptions({
    queryKey: ideaKeys.list(params),
    queryFn: () => getIdeas(params),
  })

// ---------------------------------------------
// GET WORKSHOP
// ---------------------------------------------

const getWorkshop = async (code: string): Promise<GetWorkshopResponse> => {
  const res = await apiClient.get<GetWorkshopResponse>("/api/big/workshop", {
    params: { code },
  })

  return res.data
}

export const getWorkshopOptions = (code: string) =>
  queryOptions({
    queryKey: workshopKeys.detail(code),
    queryFn: () => getWorkshop(code),
  })

// ---------------------------------------------
// GET DASHBOARD
// ---------------------------------------------

const getDashboard = async (code: string): Promise<GetDashboardResponse> => {
  const res = await apiClient.get<GetDashboardResponse>("/api/big/dashboard", {
    params: { code },
  })

  return res.data
}

export const getDashboardOptions = (code: string) =>
  queryOptions({
    queryKey: dashboardKeys.detail(code),
    queryFn: () => getDashboard(code),
  })
