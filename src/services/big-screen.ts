import apiClient from "@/lib/api-client"
import { queryOptions } from "@tanstack/react-query"
import type { WorkshopStatus } from "@/lib/workshop-lifecycle"

export interface WorkshopScreenTeam {
  ID: string
  WorkshopID: string
  TeamName: string
  TeamColorCode: string | null
  ThumbnailFileName: string | null
}

export interface WorkshopScreenCategory {
  ID: string
  WorkshopID: string
  Name: string
  Context: string | null
}

export interface WorkshopScreen {
  ID: string
  Name: string
  Desc: string | null
  WorkshopCode: string
  logoFileName: string | null
  page_bg_image: string | null
  font_primary_name: string | null
  font_secondary_name: string | null
  shortUrl: string | null
  status?: WorkshopStatus | null
  teams: WorkshopScreenTeam[]
  categories: WorkshopScreenCategory[]
}

export interface IdeaScreen {
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
  // Vote count, returned once the workshop is completed.
  TotalVote?: number
  Votes?: number
  CreatedDttm?: string
}

export interface GetIdeasScreenResponse {
  success: boolean
  data: IdeaScreen[]
}

export interface GetIdeasScreenParams {
  workshop_code: string
  category_id?: string | null
  team_id?: string | null
}

export interface GetResultsScreenParams {
  code: string
  category_id?: string | null
  team_id?: string | null
}

// Row shape returned by usp_big_getTopResult (column aliases keep the
// casing used in the procedure). title/flgCoach/CreatedDttm are optional
// because the procedure doesn't select them yet.
export interface ResultScreenIdea {
  ID: number
  teamName: string | null
  Category: string | null
  Desc: string
  totalVote: number
  imageFileName: string | null
  title?: string | null
  flgCoach?: boolean
  CreatedDttm?: string
}

// GET /api/big/results — `data` is the winning ideas list, with image URLs
// resolved.
export interface GetResultsScreenResponse {
  success: boolean
  data: ResultScreenIdea[]
}

export interface GetWorkshopScreenResponse {
  success: boolean
  data: WorkshopScreen
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

export const ideaScreenKeys = {
  all: ["BIG_SCREEN_IDEAS"] as const,

  list: (params: GetIdeasScreenParams) =>
    [...ideaScreenKeys.all, params] as const,
}

// Temporary backwards-compatible alias. Remove after updating any older imports.
export const ideScreenKeys = ideaScreenKeys

export const workshopScreenKeys = {
  all: ["BIG_SCREEN_WORKSHOP"] as const,

  detail: (code: string) => [...workshopScreenKeys.all, code] as const,
}

export const resultScreenKeys = {
  all: ["BIG_SCREEN_RESULTS"] as const,

  list: (params: GetResultsScreenParams) =>
    [...resultScreenKeys.all, params] as const,
}

export const dashboardKeys = {
  all: ["BIG_SCREEN_DASHBOARD"] as const,

  detail: (code: string) => [...dashboardKeys.all, code] as const,
}

const getIdeasScreen = async (
  params: GetIdeasScreenParams
): Promise<GetIdeasScreenResponse> => {
  const res = await apiClient.get<GetIdeasScreenResponse>("/api/big/idea", {
    params,
  })

  return res.data
}

export const getIdeasScreenOptions = (params: GetIdeasScreenParams) =>
  queryOptions({
    queryKey: ideaScreenKeys.list(params),
    queryFn: () => getIdeasScreen(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

const getResultsScreen = async (
  params: GetResultsScreenParams
): Promise<GetResultsScreenResponse> => {
  const res = await apiClient.get<GetResultsScreenResponse>(
    "/api/big/results",
    { params }
  )

  return res.data
}

export const getResultsScreenOptions = (params: GetResultsScreenParams) =>
  queryOptions({
    queryKey: resultScreenKeys.list(params),
    queryFn: () => getResultsScreen(params),
  })

const getWorkshopScreen = async (
  code: string
): Promise<GetWorkshopScreenResponse> => {
  const res = await apiClient.get<GetWorkshopScreenResponse>(
    "/api/big/workshop",
    {
      params: { code },
    }
  )

  return res.data
}

export const getWorkshopScreenOptions = (code: string) =>
  queryOptions({
    queryKey: workshopScreenKeys.detail(code),
    queryFn: () => getWorkshopScreen(code),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

export type ActivityType = "added" | "shortlisted" | "sharpened"

export interface WorkshopActivity {
  ID: number
  TeamName: string
  TeamColorCode?: string | null
  Message: string
  CreatedDttm: string
  Type: ActivityType
}

export interface GetActivitiesParams {
  code: string
  type: ActivityType | null
}

interface GetActivitiesResponse {
  success: boolean
  data: WorkshopActivity[]
}

export const activityKeys = {
  all: ["ACTIVITIES"] as const,

  list: (params: GetActivitiesParams) => [...activityKeys.all, params] as const,
}

const getActivities = async (params: GetActivitiesParams) => {
  const res = await apiClient.get<GetActivitiesResponse>(
    "/api/workshop/activity",
    {
      params,
    }
  )

  return res.data
}

export const getActivitiesOptions = (params: GetActivitiesParams) =>
  queryOptions({
    queryKey: activityKeys.list(params),
    queryFn: () => getActivities(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
