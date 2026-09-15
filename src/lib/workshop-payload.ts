import type { WorkshopFormValue } from "@/components/workshop-form"
import type {
  AddUpdateWorkshopPayload,
  WorkshopById,
} from "@/services/workshops-panel"
import { urlToFile } from "./utils"

type WorkshopBasePayload = Omit<
  AddUpdateWorkshopPayload,
  | "id"
  | "teams"
  | "categories"
  | "walkThrough"
  | "coach"
  | "avatar_files"
  | "team_thumbnails"
  | "placeholder_img_files"
  | "placeholder_img"
>

function uploadFile(upload: File | string | null) {
  return upload instanceof File ? upload : null
}

function buildBasePayload(workshop: WorkshopFormValue): WorkshopBasePayload {
  return {
    name: workshop.title.trim(),
    admin_id: workshop.assignee || null,
    brand_name: workshop.brand.trim(),
    description: workshop.subtitle.trim(),
    context: workshop.context.trim(),
    guidelines: workshop.guidelines.trim(),
    header_bg_color: workshop.headerBackgroundColor.trim().toUpperCase(),
    header_txt_color: workshop.headerTextColor.trim().toUpperCase(),
    page_bg_color: workshop.pageBackgroundColor.trim().toUpperCase(),
    txt_primary_color: workshop.primaryTextColor.trim().toUpperCase(),
    txt_secondary_color: workshop.secondaryTextColor.trim().toUpperCase(),
    btn_primary_bg_color: workshop.primaryButtonBackgroundColor
      .trim()
      .toUpperCase(),
    btn_primary_txt_color: workshop.primaryButtonTextColor.trim().toUpperCase(),
    btn_secondary_bg_color: workshop.secondaryButtonBackgroundColor
      .trim()
      .toUpperCase(),
    btn_secondary_active_bg_color: workshop.secondaryButtonActiveBackgroundColor
      .trim()
      .toUpperCase(),
    btn_secondary_txt_color: workshop.secondaryButtonTextColor
      .trim()
      .toUpperCase(),
    btn_secondary_border_color: workshop.secondaryButtonBorderColor
      .trim()
      .toUpperCase(),
    card_primary_bg_color: workshop.primaryCardBackgroundColor
      .trim()
      .toUpperCase(),
    card_primary_border_color: workshop.primaryCardBorderColor
      .trim()
      .toUpperCase(),
    card_primary_border_radius: Number(workshop.primaryCardBorderRadius),
    card_primary_border_width: Number(workshop.primaryCardBorderWidth),
    card_secondary_bg_color: workshop.secondaryCardBackgroundColor
      .trim()
      .toUpperCase(),
    card_secondary_border_radius: Number(workshop.secondaryCardBorderRadius),
    card_secondary_txt_color: workshop.secondaryCardTextColor
      .trim()
      .toUpperCase(),
    ticker_live_bg_color: workshop.tickerLiveBackgroundColor
      .trim()
      .toUpperCase(),
    ticker_live_txt_color: workshop.tickerLiveTextColor.trim().toUpperCase(),
    ticker_bg_color: workshop.tickerBackgroundColor.trim().toUpperCase(),
    ticker_txt_color: workshop.tickerTextColor.trim().toUpperCase(),
    logo_filename: uploadFile(workshop.logo),
    page_bg_image: uploadFile(workshop.pageBackgroundImage),
    font_primary: uploadFile(workshop.primaryFont),
    font_secondary: uploadFile(workshop.secondaryFont),
    is_changed: true,
    is_protected: workshop.usePasscode,
    winning_idea_count: Number(workshop.winningIdeaCount),
    voting_scope: workshop.votingScope,
    voting_limit:
      workshop.votingLimit === null ? null : Number(workshop.votingLimit),
    team_select: workshop.teamSelect.trim() || null,
    ideation_page: workshop.ideationPage.trim() || null,
    shortlisted_idea_page: workshop.shortlistedIdeaPage.trim() || null,
    stats_board: workshop.statsBoard.trim() || null,
    voting_page: workshop.votingPage.trim() || null,
  }
}

async function mapCoaches(
  workshop: WorkshopFormValue,
  avatarFiles: File[],
  action: "add" | "update",
  original?: WorkshopById
): Promise<AddUpdateWorkshopPayload["coach"]> {
  return Promise.all(
    workshop.coaches.map(async (coach) => {
      let avatarFileIndex: number | null = null
      let avatarFileName: string | null = null

      if (action === "add") {
        if (coach.avatar) {
          const avatarFile = await urlToFile(coach.avatar)

          avatarFileIndex = avatarFiles.push(avatarFile) - 1
        }
      } else {
        const originalCoach = original?.coaches.find(
          (item) => String(item.CoachID) === String(coach.id)
        )

        const avatarChanged =
          !!coach.avatar && coach.avatar !== originalCoach?.AvatarFileName

        if (avatarChanged) {
          const avatarFile = await urlToFile(coach.avatar)

          avatarFileIndex = avatarFiles.push(avatarFile) - 1
        } else {
          avatarFileName = originalCoach?.AvatarFileName || null
        }
      }

      return {
        coachID: coach.id,
        coachName: coach.name.trim(),
        coachKey: coach.key,
        title: coach.title.trim(),
        description: coach.description.trim(),
        bGColor: coach.backgroundColor.trim().toUpperCase(),
        primaryTxtColor: coach.primaryTextColor.trim().toUpperCase(),
        secondaryTxtColor: coach.secondaryTextColor.trim().toUpperCase(),

        avatarFileName,
        avatarFileIndex,

        isActive: coach.enabled,
        action,
      }
    })
  )
}

function mapTeamThumbnail(
  thumbnail: File | string | null,
  teamThumbnails: File[]
) {
  if (thumbnail instanceof File) {
    return {
      thumbnailFileName: null,
      thumbnailFileIndex: teamThumbnails.push(thumbnail) - 1,
    }
  }

  return {
    thumbnailFileName: typeof thumbnail === "string" ? thumbnail : null,
    thumbnailFileIndex: null,
  }
}

export async function createWorkshopPayload(
  workshop: WorkshopFormValue
): Promise<AddUpdateWorkshopPayload> {
  const avatarFiles: File[] = []
  const teamThumbnails: File[] = []
  const placeholderImgFiles: File[] = []

  const coaches = await mapCoaches(workshop, avatarFiles, "add")

  return {
    ...buildBasePayload(workshop),
    avatar_files: avatarFiles,
    team_thumbnails: teamThumbnails,
    placeholder_img_files: placeholderImgFiles,
    teams: workshop.teams.map((team) => {
      const { thumbnailFileName, thumbnailFileIndex } = mapTeamThumbnail(
        team.thumbnail,
        teamThumbnails
      )

      return {
        id: null,
        teamName: team.name.trim(),
        description: team.description.trim(),
        teamCode: workshop.usePasscode ? team.passcode.trim() : null,
        teamColorCode: team.color.trim().toUpperCase(),
        thumbnailFileName,
        thumbnailFileIndex,
        action: "add",
      }
    }),
    categories: workshop.pillars.map((pillar) => ({
      id: null,
      name: pillar.title.trim(),
      context: pillar.context.trim(),
      action: "add",
    })),
    walkThrough: workshop.walkthroughMessages.map((message, index) => ({
      id: null,
      title: message.title.trim(),
      description: message.description.trim(),
      displayOrder: index + 1,
      action: "add",
    })),
    coach: coaches,
    placeholder_img: workshop.placeholderImages.map((image) => ({
      id: null,
      fileName: image.fileName,
      placeholderFileIndex: image.file
        ? placeholderImgFiles.push(image.file) - 1
        : null,
      action: "add",
    })),
  }
}

export async function updateWorkshopPayload(
  workshop: WorkshopFormValue,
  original: WorkshopById
): Promise<AddUpdateWorkshopPayload> {
  const avatarFiles: File[] = []
  const teamThumbnails: File[] = []
  const placeholderImgFiles: File[] = []

  const coaches = await mapCoaches(workshop, avatarFiles, "update", original)

  const originalTeams = new Map(original.teams.map((team) => [team.ID, team]))
  const originalCategories = new Map(
    original.categories.map((category) => [category.ID, category])
  )
  const originalWalkthrough = new Map(
    original.walkThrough.map((message) => [message.ID, message])
  )
  const originalPlaceholderImages = new Map(
    original.placeholder.map((image) => [image.ID, image])
  )

  const teams: AddUpdateWorkshopPayload["teams"] = workshop.teams.map(
    (team) => {
      const isExisting = originalTeams.has(team.id)

      const { thumbnailFileName, thumbnailFileIndex } = mapTeamThumbnail(
        team.thumbnail,
        teamThumbnails
      )

      if (isExisting) originalTeams.delete(team.id)

      return {
        id: isExisting ? team.id : null,
        teamName: team.name.trim(),
        description: team.description.trim(),
        teamCode: workshop.usePasscode ? team.passcode.trim() : null,
        teamColorCode: team.color.trim().toUpperCase(),
        thumbnailFileName,
        thumbnailFileIndex,
        action: isExisting ? "update" : "add",
      }
    }
  )

  for (const team of originalTeams.values()) {
    teams.push({
      id: team.ID,
      teamName: team.TeamName,
      description: team.Description,
      teamCode: team.TeamCode,
      teamColorCode: team.TeamColorCode,
      thumbnailFileName: team.ThumbnailFileName || null,
      thumbnailFileIndex: null,
      action: "delete",
    })
  }

  const categories: AddUpdateWorkshopPayload["categories"] =
    workshop.pillars.map((pillar) => {
      const isExisting = originalCategories.has(pillar.id)
      if (isExisting) originalCategories.delete(pillar.id)

      return {
        id: isExisting ? pillar.id : null,
        name: pillar.title.trim(),
        context: pillar.context.trim(),
        action: isExisting ? "update" : "add",
      }
    })

  for (const category of originalCategories.values()) {
    categories.push({
      id: category.ID,
      name: category.Name,
      context: category.Context,
      action: "delete",
    })
  }

  const walkThrough: AddUpdateWorkshopPayload["walkThrough"] =
    workshop.walkthroughMessages.map((message, index) => {
      const isExisting = originalWalkthrough.has(message.id)
      if (isExisting) originalWalkthrough.delete(message.id)

      return {
        id: isExisting ? message.id : null,
        title: message.title.trim(),
        description: message.description.trim(),
        displayOrder: index + 1,
        action: isExisting ? "update" : "add",
      }
    })

  for (const message of originalWalkthrough.values()) {
    walkThrough.push({
      id: message.ID,
      title: message.Title,
      description: message.Description,
      displayOrder: message.DisplayOrder,
      action: "delete",
    })
  }

  const placeholderImg: AddUpdateWorkshopPayload["placeholder_img"] =
    workshop.placeholderImages.map((image) => {
      if (image.id && originalPlaceholderImages.has(image.id)) {
        originalPlaceholderImages.delete(image.id)

        return {
          id: image.id,
          fileName: image.fileName,
          placeholderFileIndex: null,
          action: "update",
        }
      }

      return {
        id: null,
        fileName: image.fileName,
        placeholderFileIndex: image.file
          ? placeholderImgFiles.push(image.file) - 1
          : null,
        action: "add",
      }
    })

  for (const image of originalPlaceholderImages.values()) {
    placeholderImg.push({
      id: image.ID,
      fileName: image.fileName,
      placeholderFileIndex: null,
      action: "delete",
    })
  }

  return {
    ...buildBasePayload(workshop),
    id: original.ID,
    avatar_files: avatarFiles,
    team_thumbnails: teamThumbnails,
    placeholder_img_files: placeholderImgFiles,
    teams,
    categories,
    walkThrough,
    coach: coaches,
    placeholder_img: placeholderImg,
  }
}
