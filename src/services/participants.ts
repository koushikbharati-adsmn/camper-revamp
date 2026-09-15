import apiClient from "@/lib/api-client"
import type { WorkshopLifecycleStatus } from "@/lib/workshop-lifecycle"
import { queryOptions, useMutation } from "@tanstack/react-query"
import type { VotingScope } from "./workshops-panel"
import { toast } from "@/components/ui/toast"

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
  Description: string
  TeamColorCode: string
  TeamCode: null | string
  ThumbnailFileName: string
}

export interface ParticipantWorkshopWalkthrough {
  ID: string
  Title: string
  Description: string
  DisplayOrder: number
}

export interface ParticipantWorkshop {
  ID: string
  Name: string
  WorkshopContext: string
  Desc: string
  logoFileName: string // logo url
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
  walkThrough: ParticipantWorkshopWalkthrough[]
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
  imageFileName: string // image url
  flgSelf: boolean // self idea or not
  flgTeam: boolean // shortlisted or not
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
  is_shortlisted: boolean | null
  is_coached: boolean | null // isSharpened
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

interface SaveIdeaPayload {
  idea_id?: number
  visitor_id: string
  workshop_code: string
  team_id: number
  category_id: number
  desc: string
  title: string
}

interface SaveIdeaResponse {
  success: boolean
  message: string
  data: {
    idea_id: number
  }
}

const saveIdea = async (payload: SaveIdeaPayload) => {
  const res = await apiClient.post<SaveIdeaResponse>(
    "/api/participant/idea",
    payload
  )

  return res.data
}

export const useSaveIdea = () => {
  return useMutation({
    mutationFn: (payload: SaveIdeaPayload) => saveIdea(payload),
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

interface ShortlistIdeaPayload {
  workshop_code: string
  idea_id: number
  flag: boolean
}

interface ShortlistIdeaResponse {
  success: boolean
  message: string
}

const shortlistIdea = async (payload: ShortlistIdeaPayload) => {
  const res = await apiClient.post<ShortlistIdeaResponse>(
    "/api/participant/idea/shortlist",
    payload
  )
  return res.data
}

export const useShortlistIdea = () => {
  return useMutation({
    mutationFn: (payload: ShortlistIdeaPayload) => shortlistIdea(payload),
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

interface GenerateIdeaImagePayload {
  workshop_code: string
  pillar_context: string
  workshop_context: string
  user_idea: string
  branding_guidelines: string
}

interface GenerateIdeaImageResponse {
  success: boolean
  data: {
    status: string
    image: string
    ref_id: string
    workshop_code: string
  }
}

const generateIdeaImage = async (payload: GenerateIdeaImagePayload) => {
  const res = await apiClient.post<GenerateIdeaImageResponse>(
    "/ai/generate",
    payload
  )
  return res.data
}

export const useGenerateIdeaImage = () => {
  return useMutation({
    mutationFn: (payload: GenerateIdeaImagePayload) =>
      generateIdeaImage(payload),
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}
