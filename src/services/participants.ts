import apiClient from "@/lib/api-client"
import type { WorkshopLifecycleStatus } from "@/lib/workshop-lifecycle"
import { queryOptions } from "@tanstack/react-query"
import type { VotingScope } from "./workshops-panel"

export interface ParticipantWorkshopCoach {
  ID: number
  CoachName: string
  CoachKey: string
  AvatarFileName: string
  PromptFileName: string
  Title: string
  Description: string
  PrimaryTxtColor: string
  SecondaryTxtColor: string
}

export interface ParticipantWorkshopCategory {
  ID: number
  Name: string
  Context: string
}

export interface ParticipantWorkshopTeam {
  ID: number
  TeamName: string
  TeamColorCode: string
  TeamCode: null | string
  ThumbnailFileName: string
}

export interface ParticipantWorkshop {
  ID: string
  Name: string
  WorkshopContext: string
  Desc: string
  logoFileName: string
  page_bg_image: string | null
  GuidelineFileName: string
  shortUrl: string | null
  votingLimit: number | null
  votingScope: VotingScope
  winningIdeaCount: number
  IsProtected: boolean
  font_primary_name: string | null
  font_secondary_name: string | null
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
  card_primary_border_radius: string
  card_primary_border_width: string
  card_secondary_bg_color: string
  card_secondary_border_radius: string
  card_secondary_txt_color: string
  ticker_live_bg_color: string
  ticker_live_txt_color: string
  ticker_bg_color: string
  ticker_txt_color: string
  TeamSelect: string
  IdeationPage: string
  ShortlistedIdeaPage: string
  StatsBoard: string
  VotingPage: string
  userID: string
  teamID: number | null
  status: WorkshopLifecycleStatus
  teams: ParticipantWorkshopTeam[]
  category: ParticipantWorkshopCategory[]
  coaches: ParticipantWorkshopCoach[]
}

interface GetParticipantWorkshopResponse {
  success: boolean
  data: ParticipantWorkshop
}

interface GetParticipantWorkshopParams {
  code: string
  visitor_id: string
}

const getParticipantWorkshop = async (params: GetParticipantWorkshopParams) => {
  const res = await apiClient.get<GetParticipantWorkshopResponse>(
    `/api/participant/workshop`,
    {
      params,
    }
  )

  return res.data
}

export function getParticipantWorkshopOptions(
  params: GetParticipantWorkshopParams
) {
  return queryOptions({
    queryKey: ["PARTICIPANT_WORKSHOP", params],
    queryFn: () => getParticipantWorkshop(params),
  })
}

export interface ParticipantIdea {
  ID: number
  TeamName: string
  Category: string
  Desc: string
  imageFileName: string
  flgSelf: boolean
  flgTeam: boolean
}

interface GetParticipantIdeasResponse {
  success: boolean
  data: ParticipantIdea[]
}

interface GetParticipantIdeasParams {
  visitor_id: string
  workshop_code: string
  category_id: number | null
  team_id: number | null
}

const getParticipantIdeas = async (params: GetParticipantIdeasParams) => {
  const res = await apiClient.get<GetParticipantIdeasResponse>(
    "/api/participant/idea",
    {
      params,
    }
  )
  return res.data
}

export function getParticipantIdeasOptions(params: GetParticipantIdeasParams) {
  return queryOptions({
    queryKey: ["PARTICIPANT_IDEAS", params],
    queryFn: () => getParticipantIdeas(params),
  })
}
