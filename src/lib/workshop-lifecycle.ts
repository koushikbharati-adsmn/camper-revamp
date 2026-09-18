export type WorkshopStatus = "Ideate" | "Vote" | "Reveal" | "Completed"
export type WorkshopLifecycleStatus = WorkshopStatus | null

export type WorkshopPhase = {
  status: WorkshopLifecycleStatus
  label: string
  description: string
  message: string
  badgeClassName: string
}

export const WORKSHOP_PHASES: readonly WorkshopPhase[] = [
  {
    status: null,
    label: "Not Started",
    description: "Workshop is configured and ready to begin",
    message: "The workshop is ready to start.",
    badgeClassName:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  },
  {
    status: "Ideate",
    label: "Ideation",
    description: "Participants submit and shortlist ideas",
    message: "Participants can submit and shortlist ideas.",
    badgeClassName:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    status: "Vote",
    label: "Voting",
    description: "Participants vote on shortlisted ideas",
    message: "Participants can vote on shortlisted ideas.",
    badgeClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    status: "Reveal",
    label: "Reveal",
    description: "Voting results are revealed to participants",
    message: "Voting results are being revealed.",
    badgeClassName:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  {
    status: "Completed",
    label: "Completed",
    description: "Workshop has ended",
    message: "The workshop is completed.",
    badgeClassName:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
]

export function getWorkshopPhase(status: WorkshopLifecycleStatus) {
  return (
    WORKSHOP_PHASES.find((phase) => phase.status === status) ??
    WORKSHOP_PHASES[0]
  )
}

export function getWorkshopPhaseIndex(status: WorkshopLifecycleStatus) {
  return WORKSHOP_PHASES.findIndex((phase) => phase.status === status)
}

export function canTransitionWorkshop(
  currentStatus: WorkshopLifecycleStatus,
  targetStatus: WorkshopStatus
) {
  const currentIndex = getWorkshopPhaseIndex(currentStatus)
  const targetIndex = getWorkshopPhaseIndex(targetStatus)

  return targetIndex === currentIndex + 1
}
