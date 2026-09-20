import apiClient from "@/lib/api-client"
import { socket } from "@/lib/socket"
import type { WorkshopLifecycleStatus } from "@/lib/workshop-lifecycle"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
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
  walkThrough: ParticipantWorkshopWalkthrough[]
}

interface GetParticipantWorkshopResponse {
  success: boolean
  data: ParticipantWorkshop
}

export interface GetParticipantWorkshopParams {
  code: string
  visitor_id: string
}

export const participantWorkshopKeys = {
  all: ["PARTICIPANT_WORKSHOP"] as const,

  detail: (params: GetParticipantWorkshopParams) =>
    [...participantWorkshopKeys.all, params] as const,
}

const getParticipantWorkshop = async (params: GetParticipantWorkshopParams) => {
  const res = await apiClient.get<GetParticipantWorkshopResponse>(
    "/api/participant/workshop",
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
    queryKey: participantWorkshopKeys.detail(params),
    queryFn: () => getParticipantWorkshop(params),
  })
}

export interface ParticipantIdea {
  ID: number
  TeamID: number
  TeamName: string
  CategoryID: number
  CategoryName: string
  Desc: string
  title: string | null
  Context: string | null
  imageFileName: string
  TotalVote: number
  flgSelf: boolean
  flgTeam: boolean
  flgCoach: boolean
  CreatedDttm: string
}

export interface SocketIdea {
  roomId: string
  ideaId: number
  teamId: number
  teamName: string
  categoryId: number
  categoryName: string
  desc: string
  title: string | null
  context: string | null
}

export interface IdeaUpsertSocketPayload {
  roomId: string
  idea: SocketIdea
}

interface GetParticipantIdeasResponse {
  success: boolean
  data: ParticipantIdea[]
}

export interface GetParticipantIdeasParams {
  visitor_id: string
  workshop_code: string
  category_id: number | null
  team_id: number | null
  is_shortlisted: boolean | null
  is_coached: boolean | null
}

export const participantIdeaKeys = {
  all: ["PARTICIPANT_IDEAS"] as const,

  list: (params: GetParticipantIdeasParams) =>
    [...participantIdeaKeys.all, params] as const,
}

export const participantIdeaMutationKeys = {
  shortlist: ["PARTICIPANT_IDEA_SHORTLIST"] as const,
  generateImage: ["PARTICIPANT_IDEA_GENERATE_IMAGE"] as const,
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
    queryKey: participantIdeaKeys.list(params),
    queryFn: () => getParticipantIdeas(params),
  })
}

export interface SaveIdeaPayload {
  idea_id?: number
  visitor_id: string
  workshop_code: string
  team_id: number
  category_id: number
  desc: string
  title: string | null
  context: string | null
  flgCoach?: boolean
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
    mutationFn: saveIdea,
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

export interface ShortlistIdeaPayload {
  workshop_code: string
  idea_id: number
  flag: boolean
  idea: ParticipantIdea
}

export type IdeaShortlistSocketPayload = {
  roomId: string
  isShortlisted: boolean
  idea: ParticipantIdea
}

interface ShortlistIdeaResponse {
  success: boolean
  message: string
}

const shortlistIdea = async (payload: ShortlistIdeaPayload) => {
  const res = await apiClient.post<ShortlistIdeaResponse>(
    "/api/participant/idea/shortlist",
    {
      workshop_code: payload.workshop_code,
      idea_id: payload.idea_id,
      flag: payload.flag,
    }
  )

  return res.data
}

export const useShortlistIdea = () => {
  return useMutation({
    mutationKey: participantIdeaMutationKeys.shortlist,
    mutationFn: shortlistIdea,

    onSuccess: (_response, { workshop_code, flag, idea }) => {
      socket.emit("update_idea_shortlist", {
        roomId: workshop_code,
        isShortlisted: flag,
        idea: {
          ...idea,
          flgTeam: flag,
        },
      } satisfies IdeaShortlistSocketPayload)
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

export interface GenerateIdeaImagePayload {
  idea_id: number
  workshop_code: string
  pillar_context: string
  workshop_context: string
  user_idea: string
  brand_guidelines: string
}

export interface IdeaImageSocketPayload {
  roomId: string
  ideaId: number
  imageUrl: string
}

interface GenerateIdeaImageResponse {
  success: boolean
  data: {
    image: string
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
    mutationKey: participantIdeaMutationKeys.generateImage,
    mutationFn: generateIdeaImage,

    onSuccess: (response, { workshop_code, idea_id }) => {
      socket.emit("idea_image_generated", {
        roomId: workshop_code,
        ideaId: idea_id,
        imageUrl: response.data.image,
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

export interface ScoutIdeaPayload {
  workshop_code: string
  pillar_title: string
  user_ideas: string[]
}

interface ScoutIdeaResponse {
  success: boolean
  data: {
    status: string
    text: string[]
  }
}

const scoutIdea = async (payload: ScoutIdeaPayload) => {
  const res = await apiClient.post<ScoutIdeaResponse>("/ai/scout", payload)

  return res.data
}

export const useScoutIdea = () => {
  return useMutation({
    mutationFn: scoutIdea,

    onError: (error) => {
      toast.add({
        type: "error",
        title: "Oops! Something went wrong",
        description: error.message,
      })
    },
  })
}

interface GetParticipantVoteIdeasResponse {
  success: boolean
  data: ParticipantIdea[]
}

export interface GetParticipantVoteIdeasParams {
  visitor_id: string
  workshop_code: string
  category_id: number | null
  team_id: number | null
}

export const participantVoteIdeaKeys = {
  all: ["PARTICIPANT_VOTE_IDEAS"] as const,

  list: (params: GetParticipantVoteIdeasParams) =>
    [...participantVoteIdeaKeys.all, params] as const,
}

const getParticipantVoteIdeas = async (
  params: GetParticipantVoteIdeasParams
) => {
  const res = await apiClient.get<GetParticipantVoteIdeasResponse>(
    "/api/participant/idea/vote",
    {
      params,
    }
  )

  return res.data
}

export function getParticipantVoteIdeasOptions(
  params: GetParticipantVoteIdeasParams
) {
  return queryOptions({
    queryKey: participantVoteIdeaKeys.list(params),
    queryFn: () => getParticipantVoteIdeas(params),
  })
}

export interface VoteIdeaPayload {
  workshop_code: string
  visitor_id: string
  idea_id: number
  action: "add" | "remove"
}

export interface IdeaVoteSocketPayload {
  roomId: string
  visitorId: string
  ideaId: number
  isVoted: boolean
}

interface VoteIdeaResponse {
  success: boolean
  message: string
}

const voteIdea = async (payload: VoteIdeaPayload) => {
  const res = await apiClient.post<VoteIdeaResponse>(
    "/api/participant/idea/vote",
    payload
  )
  return res.data
}

export const useVoteIdea = () => {
  return useMutation({
    mutationFn: (payload: VoteIdeaPayload) => voteIdea(payload),

    onSuccess: (_response, payload) => {
      socket.emit("update_idea_vote", {
        roomId: payload.workshop_code,
        visitorId: payload.visitor_id,
        ideaId: payload.idea_id,
        isVoted: payload.action === "add",
      } satisfies IdeaVoteSocketPayload)
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

interface SelectTeamPayload {
  visitor_id: string
  workshop_code: string
  team_id: number
  team_code?: string
}

interface SelectTeamResponse {
  success: boolean
  message: string
}

const selectTeam = async (payload: SelectTeamPayload) => {
  const res = await apiClient.post<SelectTeamResponse>(
    "/api/participant/team/select",
    payload
  )

  return res.data
}

export const useSelectTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SelectTeamPayload) => selectTeam(payload),
    onSuccess: (_response, payload) => {
      queryClient.setQueryData<GetParticipantWorkshopResponse>(
        participantWorkshopKeys.detail({
          code: payload.workshop_code,
          visitor_id: payload.visitor_id,
        }),
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  teamID: payload.team_id,
                },
              }
            : current
      )
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
