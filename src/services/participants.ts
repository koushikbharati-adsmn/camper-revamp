import apiClient from "@/lib/api-client"
import { socket } from "@/lib/socket"
import type { WorkshopLifecycleStatus } from "@/lib/workshop-lifecycle"
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
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
  Category: string
  Desc: string
  title: string | null
  Context: string | null
  imageFileName: string
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
}

export type IdeaShortlistSocketPayload = {
  roomId: string
  ideaId: number
  isShortlisted: boolean
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

const getWorkshopIdeaQueries = (
  queryClient: QueryClient,
  workshopCode: string
) =>
  queryClient.getQueriesData<GetParticipantIdeasResponse>({
    queryKey: participantIdeaKeys.all,
    predicate: ({ queryKey }) => {
      const params = queryKey[1] as GetParticipantIdeasParams | undefined

      return params?.workshop_code === workshopCode
    },
  })

export const updateParticipantIdeaShortlistCache = (
  queryClient: QueryClient,
  { roomId, ideaId, isShortlisted }: IdeaShortlistSocketPayload
) => {
  getWorkshopIdeaQueries(queryClient, roomId).forEach(([queryKey]) => {
    const params = queryKey[1] as GetParticipantIdeasParams

    queryClient.setQueryData<GetParticipantIdeasResponse>(
      queryKey,
      (current) => {
        if (!current?.data.some((idea) => idea.ID === ideaId)) return current

        return {
          ...current,
          data:
            params.is_shortlisted === true && !isShortlisted
              ? current.data.filter((idea) => idea.ID !== ideaId)
              : current.data.map((idea) =>
                  idea.ID === ideaId
                    ? { ...idea, flgTeam: isShortlisted }
                    : idea
                ),
        }
      }
    )
  })
}

type ShortlistIdeaSnapshot = {
  queryKey: QueryKey
  idea: ParticipantIdea
  index: number
}

export const useShortlistIdea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: shortlistIdea,

    onMutate: async ({ workshop_code, idea_id, flag }) => {
      await queryClient.cancelQueries({
        queryKey: participantIdeaKeys.all,
        predicate: ({ queryKey }) => {
          const params = queryKey[1] as GetParticipantIdeasParams | undefined

          return params?.workshop_code === workshop_code
        },
      })

      const snapshots = getWorkshopIdeaQueries(queryClient, workshop_code)
        .map(([queryKey, current]): ShortlistIdeaSnapshot | null => {
          const index = current?.data.findIndex((idea) => idea.ID === idea_id)

          if (index === undefined || index < 0 || !current) return null

          return {
            queryKey,
            idea: current.data[index],
            index,
          }
        })
        .filter(
          (snapshot): snapshot is ShortlistIdeaSnapshot => snapshot !== null
        )

      updateParticipantIdeaShortlistCache(queryClient, {
        roomId: workshop_code,
        ideaId: idea_id,
        isShortlisted: flag,
      })

      return { snapshots }
    },

    onSuccess: (_response, { workshop_code, idea_id, flag }) => {
      socket.emit("update_idea_shortlist", {
        roomId: workshop_code,
        ideaId: idea_id,
        isShortlisted: flag,
      } satisfies IdeaShortlistSocketPayload)
    },

    onError: (error, _payload, context) => {
      context?.snapshots.forEach(({ queryKey, idea, index }) => {
        queryClient.setQueryData<GetParticipantIdeasResponse>(
          queryKey,
          (current) => {
            if (!current) return current

            const currentIndex = current.data.findIndex(
              (currentIdea) => currentIdea.ID === idea.ID
            )

            if (currentIndex >= 0) {
              return {
                ...current,
                data: current.data.map((currentIdea) =>
                  currentIdea.ID === idea.ID
                    ? { ...currentIdea, flgTeam: idea.flgTeam }
                    : currentIdea
                ),
              }
            }

            const data = [...current.data]
            data.splice(Math.min(index, data.length), 0, idea)

            return { ...current, data }
          }
        )
      })

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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateIdeaImage,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: participantIdeaKeys.all,
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
