import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ColorPickerField, isHexColor } from "@/components/color-picker-field"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"
import type { CoachItem } from "@/services/coaches"
import type { User } from "@/services/users"
import type { Walkthrough } from "@/services/walkthroughs"
import type { WorkshopById } from "@/services/workshops-panel"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Link } from "@tanstack/react-router"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  FileIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { COACH_PRESET_AVATARS } from "@/lib/constants"

type Upload = File | string | null
type ThemeTab = "colors" | "assets"
type VotingScope = "workshop" | "pillar"

type Pillar = { id: string; title: string; context: string }
type WalkthroughMessage = { id: string; title: string; description: string }
type Team = {
  id: string
  name: string
  color: string
  thumbnail: Upload
  description: string
  passcode: string
}
type Coach = {
  id: string
  key: string
  name: string
  title: string
  description: string
  backgroundColor: string
  primaryTextColor: string
  secondaryTextColor: string
  avatar: string
  enabled: boolean
}

export type WorkshopFormValue = {
  title: string
  assignee: string
  brand: string
  subtitle: string
  context: string
  guidelines: string
  headerBackgroundColor: string
  headerTextColor: string
  pageBackgroundColor: string
  primaryTextColor: string
  secondaryTextColor: string
  primaryButtonBackgroundColor: string
  primaryButtonTextColor: string
  secondaryButtonBackgroundColor: string
  secondaryButtonActiveBackgroundColor: string
  secondaryButtonTextColor: string
  secondaryButtonBorderColor: string
  primaryCardBackgroundColor: string
  primaryCardBorderColor: string
  primaryCardBorderRadius: string
  primaryCardBorderWidth: string
  secondaryCardBackgroundColor: string
  secondaryCardBorderRadius: string
  secondaryCardTextColor: string
  tickerLiveBackgroundColor: string
  tickerLiveTextColor: string
  tickerBackgroundColor: string
  tickerTextColor: string
  logo: Upload
  pageBackgroundImage: Upload
  primaryFont: Upload
  secondaryFont: Upload
  pillars: Pillar[]
  teams: Team[]
  walkthroughMessages: WalkthroughMessage[]
  usePasscode: boolean
  coaches: Coach[]
  winningIdeaCount: string
  votingScope: VotingScope
  votingLimit: string | null
}

const steps = [
  { title: "Identity", description: "Set the workshop foundation" },
  { title: "Theme", description: "Shape the visual direction" },
  { title: "Pillars", description: "Define the areas of focus" },
  { title: "Teams", description: "Set up participant groups" },
  { title: "Walkthrough", description: "Guide participants through the flow" },
  { title: "Coaches", description: "Configure workshop coaches" },
  { title: "Settings", description: "Configure voting and outcomes" },
]

const workshopFieldSteps: Partial<Record<keyof WorkshopFormValue, number>> = {
  title: 0,
  assignee: 0,
  brand: 0,
  subtitle: 0,
  context: 0,
  guidelines: 0,
  headerBackgroundColor: 1,
  headerTextColor: 1,
  pageBackgroundColor: 1,
  primaryTextColor: 1,
  secondaryTextColor: 1,
  primaryButtonBackgroundColor: 1,
  primaryButtonTextColor: 1,
  secondaryButtonBackgroundColor: 1,
  secondaryButtonActiveBackgroundColor: 1,
  secondaryButtonTextColor: 1,
  secondaryButtonBorderColor: 1,
  primaryCardBackgroundColor: 1,
  primaryCardBorderColor: 1,
  primaryCardBorderRadius: 1,
  primaryCardBorderWidth: 1,
  secondaryCardBackgroundColor: 1,
  secondaryCardBorderRadius: 1,
  secondaryCardTextColor: 1,
  tickerLiveBackgroundColor: 1,
  tickerLiveTextColor: 1,
  tickerBackgroundColor: 1,
  tickerTextColor: 1,
  logo: 1,
  pageBackgroundImage: 1,
  primaryFont: 1,
  secondaryFont: 1,
  usePasscode: 3,
  winningIdeaCount: 6,
  votingScope: 6,
  votingLimit: 6,
}

const DEFAULT_COACH_COLORS = {
  background: "#FFFFFF",
  primaryText: "#111111",
  secondaryText: "#6B7280",
} as const

const initialWorkshop: WorkshopFormValue = {
  title: "",
  assignee: "",
  brand: "",
  subtitle: "",
  context: "",
  guidelines: "",
  headerBackgroundColor: "#111111",
  headerTextColor: "#FFFFFF",
  pageBackgroundColor: "#FFFFFF",
  primaryTextColor: "#111111",
  secondaryTextColor: "#6B7280",
  primaryButtonBackgroundColor: "#111111",
  primaryButtonTextColor: "#FFFFFF",
  secondaryButtonBackgroundColor: "#FFFFFF",
  secondaryButtonActiveBackgroundColor: "#D9FF00",
  secondaryButtonTextColor: "#111111",
  secondaryButtonBorderColor: "#111111",
  primaryCardBackgroundColor: "#FFFFFF",
  primaryCardBorderColor: "#E5E7EB",
  primaryCardBorderRadius: "8",
  primaryCardBorderWidth: "1",
  secondaryCardBackgroundColor: "#F3F4F6",
  secondaryCardBorderRadius: "8",
  secondaryCardTextColor: "#111111",
  tickerLiveBackgroundColor: "#DC2626",
  tickerLiveTextColor: "#FFFFFF",
  tickerBackgroundColor: "#111111",
  tickerTextColor: "#FFFFFF",
  logo: null,
  pageBackgroundImage: null,
  primaryFont: null,
  secondaryFont: null,
  pillars: [{ id: "pillar-initial", title: "", context: "" }],
  teams: [
    {
      id: "team-initial",
      name: "",
      color: "#D9FF00",
      thumbnail: null,
      description: "",
      passcode: "",
    },
  ],
  walkthroughMessages: [],
  usePasscode: false,
  coaches: [],
  winningIdeaCount: "1",
  votingScope: "workshop",
  votingLimit: null,
}

function getInitialWalkthroughMessages(
  walkthroughs: Walkthrough[]
): WalkthroughMessage[] {
  const messages = [...walkthroughs]
    .filter((walkthrough) => walkthrough.IsActive)
    .sort(
      (first, second) =>
        first.DisplayOrder - second.DisplayOrder ||
        first.Title.localeCompare(second.Title)
    )
    .map((walkthrough) => ({
      id: walkthrough.ID,
      title: walkthrough.Title,
      description: walkthrough.Description,
    }))

  return messages.length
    ? messages
    : [{ id: "walkthrough-initial", title: "", description: "" }]
}

export function createNewWorkshopFormValue(
  coaches: CoachItem[],
  walkthroughs: Walkthrough[]
): WorkshopFormValue {
  return {
    ...initialWorkshop,
    walkthroughMessages: getInitialWalkthroughMessages(walkthroughs),
    coaches: coaches
      .filter((coach) => coach.IsActive)
      .map((coach) => ({
        id: coach.ID,
        key: coach.CoachKey,
        name: coach.CoachName,
        title: coach.Title,
        description: coach.Description,
        backgroundColor: getCoachColor(
          coach.BGColor,
          DEFAULT_COACH_COLORS.background
        ),
        primaryTextColor: getCoachColor(
          coach.PrimaryTxtColor,
          DEFAULT_COACH_COLORS.primaryText
        ),
        secondaryTextColor: getCoachColor(
          coach.SecondaryTxtColor,
          DEFAULT_COACH_COLORS.secondaryText
        ),
        avatar: coach.AvatarFileName,
        enabled: true,
      })),
  }
}

export function createEditWorkshopFormValue(
  workshop: WorkshopById
): WorkshopFormValue {
  return {
    title: workshop.Name,
    assignee: workshop.AdminID == null ? "" : String(workshop.AdminID),
    brand: workshop.BrandName,
    subtitle: workshop.Desc,
    context: workshop.WorkshopContext,
    guidelines: workshop.GuidelineFileName,
    headerBackgroundColor:
      workshop.HeaderBGColor ?? initialWorkshop.headerBackgroundColor,
    headerTextColor: workshop.HeaderTxtColor ?? initialWorkshop.headerTextColor,
    pageBackgroundColor:
      workshop.PageBGColor ?? initialWorkshop.pageBackgroundColor,
    primaryTextColor:
      workshop.TxtPrimaryColor ?? initialWorkshop.primaryTextColor,
    secondaryTextColor:
      workshop.TxtSecondaryColor ?? initialWorkshop.secondaryTextColor,
    primaryButtonBackgroundColor:
      workshop.BtnPrimaryBGColor ??
      initialWorkshop.primaryButtonBackgroundColor,
    primaryButtonTextColor:
      workshop.BtnPrimaryTxtColor ?? initialWorkshop.primaryButtonTextColor,
    secondaryButtonBackgroundColor:
      workshop.BtnSecondaryBGColor ??
      initialWorkshop.secondaryButtonBackgroundColor,
    secondaryButtonActiveBackgroundColor:
      workshop.BtnSecondaryActiveBGColor ??
      initialWorkshop.secondaryButtonActiveBackgroundColor,
    secondaryButtonTextColor:
      workshop.BtnSecondaryTxtColor ?? initialWorkshop.secondaryButtonTextColor,
    secondaryButtonBorderColor:
      workshop.BtnSecondaryBorderColor ??
      initialWorkshop.secondaryButtonBorderColor,
    primaryCardBackgroundColor:
      workshop.CardPrimaryBGColor ?? initialWorkshop.primaryCardBackgroundColor,
    primaryCardBorderColor:
      workshop.CardPrimaryBorderColor ?? initialWorkshop.primaryCardBorderColor,
    primaryCardBorderRadius: String(
      workshop.CardPrimaryBorderRadius ??
        initialWorkshop.primaryCardBorderRadius
    ),
    primaryCardBorderWidth: String(
      workshop.CardPrimaryBorderWidth ?? initialWorkshop.primaryCardBorderWidth
    ),
    secondaryCardBackgroundColor:
      workshop.CardSecondaryBGColor ??
      initialWorkshop.secondaryCardBackgroundColor,
    secondaryCardBorderRadius: String(
      workshop.CardSecondaryBorderRadius ??
        initialWorkshop.secondaryCardBorderRadius
    ),
    secondaryCardTextColor:
      workshop.CardSecondaryTxtColor ?? initialWorkshop.secondaryCardTextColor,
    tickerLiveBackgroundColor:
      workshop.TickerLiveBGColor ?? initialWorkshop.tickerLiveBackgroundColor,
    tickerLiveTextColor:
      workshop.TickerLiveTxtColor ?? initialWorkshop.tickerLiveTextColor,
    tickerBackgroundColor:
      workshop.TickerBGColor ?? initialWorkshop.tickerBackgroundColor,
    tickerTextColor: workshop.TickerTxtColor ?? initialWorkshop.tickerTextColor,
    logo: workshop.logoFileName || null,
    pageBackgroundImage:
      workshop.LandscapeFileName || workshop.PortraitFileName || null,
    primaryFont: workshop.HeadingFontFileName || null,
    secondaryFont: workshop.BodyFontFileName || null,
    pillars: workshop.categories.map((category) => ({
      id: category.ID,
      title: category.Name,
      context: category.Context,
    })),
    teams: workshop.teams.map((team) => ({
      id: team.ID,
      name: team.TeamName,
      color: team.TeamColorCode,
      thumbnail: team.ThumbnailFileName || null,
      description: team.Description,
      passcode: team.TeamCode ?? "",
    })),
    walkthroughMessages: [...workshop.walkThrough]
      .sort(
        (first, second) =>
          first.DisplayOrder - second.DisplayOrder ||
          first.Title.localeCompare(second.Title)
      )
      .map((message) => ({
        id: message.ID,
        title: message.Title,
        description: message.Description,
      })),
    usePasscode: workshop.IsProtected,
    coaches: workshop.coaches.map((coach) => ({
      id: String(coach.CoachID),
      key: coach.CoachKey,
      name: coach.CoachName,
      title: coach.Title,
      description: coach.Description,
      backgroundColor: getCoachColor(
        coach.BGColor,
        DEFAULT_COACH_COLORS.background
      ),
      primaryTextColor: getCoachColor(
        coach.PrimaryTxtColor,
        DEFAULT_COACH_COLORS.primaryText
      ),
      secondaryTextColor: getCoachColor(
        coach.SecondaryTxtColor,
        DEFAULT_COACH_COLORS.secondaryText
      ),
      avatar: coach.AvatarFileName,
      enabled: coach.IsActive,
    })),
    winningIdeaCount: String(workshop.WinningIdeaCount ?? 1),
    votingScope: workshop.VotingScope === "pillar" ? "pillar" : "workshop",
    votingLimit:
      workshop.VotingLimit == null ? null : String(workshop.VotingLimit),
  }
}

function getStepErrors(step: number, workshop: WorkshopFormValue) {
  const nextErrors: Record<string, string> = {}

  if (step === 0) {
    for (const [field, label] of [
      ["title", "Title"],
      ["assignee", "Assignee"],
      ["brand", "Brand"],
      ["subtitle", "Subtitle"],
      ["context", "Workshop context"],
      ["guidelines", "Brand guidelines"],
    ] as const) {
      if (!workshop[field].trim()) nextErrors[field] = `${label} is required.`
    }
  }

  if (step === 1) {
    for (const field of [
      "headerBackgroundColor",
      "headerTextColor",
      "pageBackgroundColor",
      "primaryTextColor",
      "secondaryTextColor",
      "primaryButtonBackgroundColor",
      "primaryButtonTextColor",
      "secondaryButtonBackgroundColor",
      "secondaryButtonActiveBackgroundColor",
      "secondaryButtonTextColor",
      "secondaryButtonBorderColor",
      "primaryCardBackgroundColor",
      "primaryCardBorderColor",
      "secondaryCardBackgroundColor",
      "secondaryCardTextColor",
      "tickerLiveBackgroundColor",
      "tickerLiveTextColor",
      "tickerBackgroundColor",
      "tickerTextColor",
    ] as const) {
      if (workshop[field] && !isHexColor(workshop[field]))
        nextErrors[field] = "Enter a valid hex color."
    }
    for (const field of [
      "primaryCardBorderRadius",
      "primaryCardBorderWidth",
      "secondaryCardBorderRadius",
    ] as const) {
      if (workshop[field] && !isNonNegativeNumber(workshop[field]))
        nextErrors[field] = "Enter a non-negative number."
    }
    for (const [field, label] of [
      ["logo", "Logo"],
      ["pageBackgroundImage", "Page background image"],
    ] as const) {
      if (workshop[field] && !isImageUpload(workshop[field]))
        nextErrors[field] = `${label} must be an image file.`
    }
    for (const [field, label] of [
      ["primaryFont", "Primary font"],
      ["secondaryFont", "Secondary font"],
    ] as const) {
      if (workshop[field] && !isFontUpload(workshop[field]))
        nextErrors[field] = `${label} must be a WOFF, WOFF2, TTF, or OTF file.`
    }
  }

  if (step === 2) {
    workshop.pillars.forEach((pillar) => {
      if (!pillar.title.trim())
        nextErrors[`pillar-${pillar.id}-title`] = "Title is required."
      if (!pillar.context.trim())
        nextErrors[`pillar-${pillar.id}-context`] = "Context is required."
    })
  }

  if (step === 3) {
    workshop.teams.forEach((team) => {
      if (!team.name.trim())
        nextErrors[`team-${team.id}-name`] = "Name is required."
      if (!team.description.trim())
        nextErrors[`team-${team.id}-description`] = "Description is required."
      if (!team.thumbnail)
        nextErrors[`team-${team.id}-thumbnail`] = "Thumbnail is required."
      else if (!isImageUpload(team.thumbnail))
        nextErrors[`team-${team.id}-thumbnail`] =
          "Thumbnail must be an image file."
      if (!isHexColor(team.color))
        nextErrors[`team-${team.id}-color`] = "Enter a valid hex color."
      if (workshop.usePasscode && !/^\d{4}$/.test(team.passcode))
        nextErrors[`team-${team.id}-passcode`] = "Enter exactly four digits."
    })

    if (workshop.usePasscode) {
      const pinCounts = workshop.teams.reduce<Record<string, number>>(
        (counts, team) => {
          if (/^\d{4}$/.test(team.passcode))
            counts[team.passcode] = (counts[team.passcode] ?? 0) + 1
          return counts
        },
        {}
      )

      workshop.teams.forEach((team) => {
        if ((pinCounts[team.passcode] ?? 0) > 1)
          nextErrors[`team-${team.id}-passcode`] =
            "Choose a PIN that is not assigned to another team."
      })
    }
  }

  if (step === 4) {
    workshop.walkthroughMessages.forEach((message) => {
      if (!message.title.trim())
        nextErrors[`walkthrough-${message.id}-title`] = "Title is required."
      if (!message.description.trim())
        nextErrors[`walkthrough-${message.id}-description`] =
          "Description is required."
    })
  }

  if (step === 5)
    workshop.coaches.forEach((coach) => {
      if (!coach.enabled) return

      for (const [field, label] of [
        ["name", "Name"],
        ["title", "Title"],
        ["description", "Description"],
      ] as const) {
        if (!coach[field].trim())
          nextErrors[`coach-${coach.id}-${field}`] = `${label} is required.`
      }

      for (const field of [
        "backgroundColor",
        "primaryTextColor",
        "secondaryTextColor",
      ] as const) {
        if (!isHexColor(coach[field]))
          nextErrors[`coach-${coach.id}-${field}`] = "Enter a valid hex color."
      }
    })

  if (step === 6) {
    if (!isPositiveInteger(workshop.winningIdeaCount))
      nextErrors.winningIdeaCount = "Enter a whole number of at least one."

    if (!(["workshop", "pillar"] as const).includes(workshop.votingScope))
      nextErrors.votingScope = "Select a voting scope."

    if (
      workshop.votingLimit !== null &&
      !isPositiveInteger(workshop.votingLimit)
    )
      nextErrors.votingLimit = "Enter a whole number of at least one."
  }

  return nextErrors
}

function getThemeTabForErrors(errors: Record<string, string>): ThemeTab {
  if (
    errors.logo ||
    errors.pageBackgroundImage ||
    errors.primaryFont ||
    errors.secondaryFont
  )
    return "assets"
  return "colors"
}

export function WorkshopForm({
  mode,
  initialValue,
  users,
  onSubmit,
  isSubmitting = false,
}: {
  mode: "create" | "edit"
  initialValue: WorkshopFormValue
  users: User[]
  onSubmit: (workshop: WorkshopFormValue) => void
  isSubmitting?: boolean
}) {
  const [workshop, setWorkshop] = useState<WorkshopFormValue>(initialValue)
  const [activeStep, setActiveStep] = useState(0)
  const [highestReached, setHighestReached] = useState(
    mode === "edit" ? steps.length - 1 : 0
  )
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeThemeTab, setActiveThemeTab] = useState<ThemeTab>("colors")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorFocusKey, setErrorFocusKey] = useState<string | null>(null)
  const shouldFocusStepHeading = useRef(false)

  useEffect(() => {
    if (!errorFocusKey) return

    const frame = window.requestAnimationFrame(() => {
      const field = Array.from(
        document.querySelectorAll<HTMLElement>("[data-error-key]")
      ).find((element) => element.dataset.errorKey === errorFocusKey)
      const control =
        field?.querySelector<HTMLElement>("[data-error-control]") ??
        field?.querySelector<HTMLElement>(
          "input:not([type=hidden]), textarea, button, [role=combobox]"
        )

      if (!control) return
      control.focus()
      field?.scrollIntoView({ behavior: "smooth", block: "center" })
      setErrorFocusKey(null)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeStep, activeThemeTab, errorFocusKey, errors])

  const markFieldChanged = (step: number, errorKey?: string | string[]) => {
    const errorKeys = errorKey
      ? Array.isArray(errorKey)
        ? errorKey
        : [errorKey]
      : []

    setCompletedSteps((current) => current.filter((item) => item !== step))
    if (errorKeys.length)
      setErrorFocusKey((current) =>
        current && errorKeys.includes(current) ? null : current
      )
    setErrors((current) => {
      if (!errorKeys.some((key) => key in current)) return current
      const nextErrors = { ...current }
      errorKeys.forEach((key) => delete nextErrors[key])
      return nextErrors
    })
  }

  const update = <K extends keyof WorkshopFormValue>(
    field: K,
    value: WorkshopFormValue[K]
  ) => {
    setWorkshop((current) => ({ ...current, [field]: value }))
    markFieldChanged(workshopFieldSteps[field] ?? activeStep, String(field))

    if (field === "usePasscode" && value === false)
      setErrors((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([key]) => !key.endsWith("-passcode"))
        )
      )
  }

  const showValidationErrors = (
    step: number,
    nextErrors: Record<string, string>
  ) => {
    setErrors(nextErrors)
    setCompletedSteps((current) => current.filter((item) => item !== step))
    if (step === 1) setActiveThemeTab(getThemeTabForErrors(nextErrors))
    setErrorFocusKey(Object.keys(nextErrors)[0] ?? null)
  }

  const validateStep = (step: number) => {
    const nextErrors = getStepErrors(step, workshop)
    if (Object.keys(nextErrors).length) {
      showValidationErrors(step, nextErrors)
      return false
    }

    setErrors({})
    setCompletedSteps((current) =>
      current.includes(step) ? current : [...current, step]
    )
    return true
  }

  const goToStep = (step: number) => {
    if (step > highestReached) return
    setErrors({})
    setErrorFocusKey(null)
    shouldFocusStepHeading.current = step !== activeStep
    setActiveStep(step)
  }

  const next = () => {
    if (!validateStep(activeStep)) return
    const nextStep = Math.min(activeStep + 1, steps.length - 1)
    setHighestReached((current) => Math.max(current, nextStep))
    shouldFocusStepHeading.current = nextStep !== activeStep
    setActiveStep(nextStep)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    if (activeStep < steps.length - 1) {
      next()
      return
    }

    const validSteps: number[] = []
    let firstInvalid:
      { step: number; errors: Record<string, string> } | undefined

    steps.forEach((_, step) => {
      const stepErrors = getStepErrors(step, workshop)
      if (Object.keys(stepErrors).length) {
        firstInvalid ??= { step, errors: stepErrors }
      } else {
        validSteps.push(step)
      }
    })

    setCompletedSteps(validSteps)
    if (firstInvalid) {
      setActiveStep(firstInvalid.step)
      showValidationErrors(firstInvalid.step, firstInvalid.errors)
      return
    }

    onSubmit(workshop)
  }

  const errorCount = Object.keys(errors).length

  return (
    <div className="@container/wizard w-full">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/workshops"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "mb-3 -ml-2 text-muted-foreground"
            )}
          >
            <ArrowLeftIcon />
            Back to workshops
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {mode === "create" ? "Create a new workshop" : "Edit workshop"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mode === "create"
              ? "Set the workshop foundation, visual system, participant groups, walkthrough, coaching team, and voting settings."
              : "Update the workshop foundation, visual system, participant groups, walkthrough, coaching team, and voting settings."}
          </p>
        </div>
        <Button>
          Preview Workshop
          <ArrowUpRightIcon />
        </Button>
      </header>

      <section
        aria-label="Workshop setup"
        className="overflow-clip border border-border bg-card shadow-xs"
      >
        <StepNavigation
          compact
          activeStep={activeStep}
          highestReached={highestReached}
          completedSteps={completedSteps}
          errorStep={errorCount ? activeStep : null}
          onStepChange={goToStep}
        />

        <div className="grid @min-[56rem]/wizard:grid-cols-[14rem_minmax(0,1fr)]">
          <StepNavigation
            activeStep={activeStep}
            highestReached={highestReached}
            completedSteps={completedSteps}
            errorStep={errorCount ? activeStep : null}
            onStepChange={goToStep}
          />

          <form
            onSubmit={submit}
            noValidate
            className="min-w-0"
            aria-busy={isSubmitting}
          >
            <header className="border-b border-border px-5 py-5 sm:px-7 sm:py-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Step {String(activeStep + 1).padStart(2, "0")} /{" "}
                  {String(steps.length).padStart(2, "0")}
                </span>
              </div>
              <h2
                key={activeStep}
                ref={(node) => {
                  if (!node || !shouldFocusStepHeading.current) return
                  shouldFocusStepHeading.current = false
                  node.focus({ preventScroll: true })
                }}
                tabIndex={-1}
                className="text-xl font-semibold tracking-tight outline-none"
              >
                {steps[activeStep].title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {steps[activeStep].description}
              </p>
            </header>

            <div className="min-h-120 px-5 py-6 sm:px-7 sm:py-8">
              {renderStep(
                activeStep,
                workshop,
                update,
                setWorkshop,
                errors,
                activeThemeTab,
                setActiveThemeTab,
                markFieldChanged,
                users
              )}
            </div>

            <div className="sticky -bottom-4 z-20 flex gap-3 border-t border-border bg-background/80 px-5 py-4 backdrop-blur-sm supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-between sm:px-7">
              <Button
                type="button"
                variant="outline"
                disabled={activeStep === 0}
                onClick={() => goToStep(activeStep - 1)}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeftIcon />
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  type="button"
                  className="flex-1 sm:flex-none"
                  onClick={(event) => {
                    event.preventDefault()
                    next()
                  }}
                >
                  Continue
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner /> : <CheckIcon />}
                  {isSubmitting
                    ? mode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : mode === "create"
                      ? "Create workshop"
                      : "Save changes"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function StepNavigation({
  compact = false,
  activeStep,
  highestReached,
  completedSteps,
  errorStep,
  onStepChange,
}: {
  compact?: boolean
  activeStep: number
  highestReached: number
  completedSteps: number[]
  errorStep: number | null
  onStepChange: (step: number) => void
}) {
  if (compact)
    return (
      <nav
        aria-label="Workshop setup steps"
        className="border-b border-border bg-muted/25 @min-[56rem]/wizard:hidden"
      >
        <ol className="grid grid-cols-7">
          {steps.map((step, index) => {
            const isActive = index === activeStep
            const isComplete = completedSteps.includes(index)
            const isAvailable = index <= highestReached
            const hasError = errorStep === index

            return (
              <li key={step.title} className="min-w-0">
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${index + 1}. ${step.title}${
                    isComplete ? ", complete" : ""
                  }${hasError ? ", has errors" : ""}`}
                  disabled={!isAvailable}
                  onClick={() => onStepChange(index)}
                  className={cn(
                    "relative flex h-16 w-full min-w-0 flex-col items-center justify-center gap-1 border-r border-border px-1 text-[11px] font-medium text-muted-foreground transition-colors last:border-r-0 disabled:cursor-not-allowed disabled:opacity-45",
                    isActive && "bg-background text-foreground",
                    isAvailable && !isActive && "hover:bg-muted/60",
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent",
                    isActive && "after:bg-primary",
                    hasError && "text-destructive after:bg-destructive"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center border border-border bg-background text-[10px]",
                      isComplete &&
                        "border-primary bg-primary text-primary-foreground",
                      isActive && !hasError && "border-primary text-primary",
                      hasError && "border-destructive bg-destructive text-white"
                    )}
                  >
                    {hasError ? "!" : isComplete ? <CheckIcon /> : index + 1}
                  </span>
                  <span className="hidden truncate @min-[30rem]/wizard:block">
                    {step.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    )

  return (
    <nav
      aria-label="Workshop setup steps"
      className="relative hidden border-r border-border bg-muted/25 p-5 @min-[56rem]/wizard:block"
    >
      <div className="sticky top-4">
        <p className="mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Setup progress
        </p>
        <ol className="relative space-y-1 before:absolute before:top-5 before:bottom-5 before:left-4.5 before:w-px before:bg-border">
          {steps.map((step, index) => {
            const isActive = index === activeStep
            const isComplete = completedSteps.includes(index)
            const isAvailable = index <= highestReached
            const hasError = errorStep === index

            return (
              <li key={step.title} className="relative">
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${index + 1}. ${step.title}${
                    isComplete ? ", complete" : ""
                  }${hasError ? ", has errors" : ""}`}
                  disabled={!isAvailable}
                  onClick={() => onStepChange(index)}
                  className={cn(
                    "group flex w-full items-start gap-3 px-1 py-2 text-left text-muted-foreground transition-colors disabled:cursor-not-allowed",
                    isAvailable && "hover:text-foreground",
                    isActive && "text-foreground",
                    hasError && "text-destructive"
                  )}
                >
                  <span
                    className={cn(
                      "z-10 flex size-7 shrink-0 items-center justify-center border border-border bg-background text-[10px] font-semibold",
                      isComplete &&
                        "border-primary bg-primary text-primary-foreground",
                      isActive &&
                        !hasError &&
                        "border-primary ring-1 ring-primary",
                      hasError && "border-destructive bg-destructive text-white"
                    )}
                  >
                    {hasError ? "!" : isComplete ? <CheckIcon /> : index + 1}
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-xs font-semibold">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal opacity-75">
                      {step.description}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

function renderStep(
  step: number,
  workshop: WorkshopFormValue,
  update: <K extends keyof WorkshopFormValue>(
    field: K,
    value: WorkshopFormValue[K]
  ) => void,
  setWorkshop: React.Dispatch<React.SetStateAction<WorkshopFormValue>>,
  errors: Record<string, string>,
  activeThemeTab: ThemeTab,
  setActiveThemeTab: React.Dispatch<React.SetStateAction<ThemeTab>>,
  markFieldChanged: (step: number, errorKey?: string | string[]) => void,
  users: User[]
) {
  if (step === 0)
    return (
      <IdentityStep
        workshop={workshop}
        update={update}
        errors={errors}
        users={users}
      />
    )
  if (step === 1)
    return (
      <ThemeStep
        workshop={workshop}
        update={update}
        errors={errors}
        activeTab={activeThemeTab}
        onTabChange={setActiveThemeTab}
      />
    )
  if (step === 2)
    return (
      <PillarsStep
        workshop={workshop}
        setWorkshop={setWorkshop}
        errors={errors}
        onFieldChange={(errorKey) => markFieldChanged(2, errorKey)}
      />
    )
  if (step === 3)
    return (
      <TeamsStep
        workshop={workshop}
        update={update}
        setWorkshop={setWorkshop}
        errors={errors}
        onFieldChange={(errorKey) => markFieldChanged(3, errorKey)}
      />
    )
  if (step === 4)
    return (
      <WalkthroughStep
        workshop={workshop}
        setWorkshop={setWorkshop}
        errors={errors}
        onFieldChange={(errorKey) => markFieldChanged(4, errorKey)}
      />
    )
  if (step === 5)
    return (
      <CoachesStep
        workshop={workshop}
        setWorkshop={setWorkshop}
        errors={errors}
        onFieldChange={(errorKey) => markFieldChanged(5, errorKey)}
      />
    )
  return <SettingsStep workshop={workshop} update={update} errors={errors} />
}

function isNonNegativeNumber(value: string) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

function isPositiveInteger(value: string) {
  const number = Number(value)
  return /^\d+$/.test(value) && Number.isSafeInteger(number) && number >= 1
}

function getCoachColor(value: string | null | undefined, fallback: string) {
  return value && isHexColor(value) ? value.toUpperCase() : fallback
}

function isImageUpload(file: Exclude<Upload, null>) {
  if (typeof file === "string") return true

  return (
    file.type.startsWith("image/") ||
    /\.(avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i.test(file.name)
  )
}

function isFontUpload(file: Exclude<Upload, null>) {
  if (typeof file === "string") return true

  return /\.(otf|ttf|woff2?)$/i.test(file.name)
}

function getUploadName(upload: Exclude<Upload, null>) {
  if (upload instanceof File) return upload.name

  return upload.split("/").pop()?.split("?")[0] || "Existing file"
}

function createItemId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

function FormSectionHeader({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) {
  return (
    <div className="mb-4 border-b border-border pb-3">
      <h3 id={id} className="text-sm font-semibold">
        {title}
      </h3>
      <p className="mt-0.5 text-xs/relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function IdentityStep({
  workshop,
  update,
  errors,
  users,
}: {
  workshop: WorkshopFormValue
  update: <K extends keyof WorkshopFormValue>(
    field: K,
    value: WorkshopFormValue[K]
  ) => void
  errors: Record<string, string>
  users: User[]
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="identity-details-heading">
        <FormSectionHeader
          id="identity-details-heading"
          title="Workshop details"
          description="Give the session a clear identity and assign an owner."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.title} data-error-key="title">
            <FieldLabel htmlFor="workshop-title">Title</FieldLabel>
            <Input
              id="workshop-title"
              value={workshop.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Refresh the moment"
              aria-invalid={!!errors.title}
              aria-required="true"
              aria-describedby={
                errors.title ? "workshop-title-error" : undefined
              }
              data-error-control
            />
            {errors.title && (
              <FieldError id="workshop-title-error">{errors.title}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.assignee} data-error-key="assignee">
            <FieldLabel htmlFor="workshop-assignee">Assignee</FieldLabel>
            <Select
              value={workshop.assignee}
              onValueChange={(value) => update("assignee", value ?? "")}
              items={users.map((user) => ({
                value: String(user.UserID),
                label: user.Name,
              }))}
            >
              <SelectTrigger
                id="workshop-assignee"
                aria-invalid={!!errors.assignee}
                aria-required="true"
                aria-describedby={
                  errors.assignee ? "workshop-assignee-error" : undefined
                }
                data-error-control
              >
                <SelectValue placeholder="Select an assignee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.UserID} value={String(user.UserID)}>
                    {user.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignee && (
              <FieldError id="workshop-assignee-error">
                {errors.assignee}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.brand} data-error-key="brand">
            <FieldLabel htmlFor="workshop-brand">Brand</FieldLabel>
            <Input
              id="workshop-brand"
              value={workshop.brand}
              onChange={(event) => update("brand", event.target.value)}
              placeholder="Brand name"
              aria-invalid={!!errors.brand}
              aria-required="true"
              aria-describedby={
                errors.brand ? "workshop-brand-error" : undefined
              }
              data-error-control
            />
            {errors.brand && (
              <FieldError id="workshop-brand-error">{errors.brand}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.subtitle} data-error-key="subtitle">
            <FieldLabel htmlFor="workshop-subtitle">Subtitle</FieldLabel>
            <Input
              id="workshop-subtitle"
              value={workshop.subtitle}
              onChange={(event) => update("subtitle", event.target.value)}
              placeholder="A short supporting line"
              aria-invalid={!!errors.subtitle}
              aria-required="true"
              aria-describedby={
                errors.subtitle ? "workshop-subtitle-error" : undefined
              }
              data-error-control
            />
            {errors.subtitle && (
              <FieldError id="workshop-subtitle-error">
                {errors.subtitle}
              </FieldError>
            )}
          </Field>
        </div>
      </section>

      <section aria-labelledby="identity-brief-heading">
        <FormSectionHeader
          id="identity-brief-heading"
          title="Workshop brief"
          description="Give participants the context and guardrails they need."
        />
        <div className="grid gap-5">
          <Field data-invalid={!!errors.context} data-error-key="context">
            <FieldLabel htmlFor="workshop-context">Workshop context</FieldLabel>
            <Textarea
              id="workshop-context"
              value={workshop.context}
              onChange={(event) => update("context", event.target.value)}
              placeholder="What should participants know before they begin?"
              aria-invalid={!!errors.context}
              aria-required="true"
              aria-describedby={
                errors.context ? "workshop-context-error" : undefined
              }
              data-error-control
              className="max-h-72 min-h-28 resize-none text-base sm:text-sm md:text-sm"
            />
            {errors.context && (
              <FieldError id="workshop-context-error">
                {errors.context}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.guidelines} data-error-key="guidelines">
            <FieldLabel htmlFor="workshop-guidelines">
              Brand guidelines
            </FieldLabel>
            <Textarea
              id="workshop-guidelines"
              value={workshop.guidelines}
              onChange={(event) => update("guidelines", event.target.value)}
              placeholder="Tone, do's and don'ts, or visual guidance"
              aria-invalid={!!errors.guidelines}
              aria-required="true"
              aria-describedby={
                errors.guidelines ? "workshop-guidelines-error" : undefined
              }
              data-error-control
              className="max-h-72 min-h-28 resize-none text-base sm:text-sm md:text-sm"
            />
            {errors.guidelines && (
              <FieldError id="workshop-guidelines-error">
                {errors.guidelines}
              </FieldError>
            )}
          </Field>
        </div>
      </section>
    </div>
  )
}

const themeColorSections = [
  {
    id: "header",
    title: "Header",
    description: "Style the header shown across workshop screens.",
    fields: [
      {
        field: "headerBackgroundColor",
        label: "Background color",
        description: "Used behind the workshop header and its navigation.",
      },
      {
        field: "headerTextColor",
        label: "Text color",
        description: "Used for titles and controls displayed in the header.",
      },
    ],
  },
  {
    id: "background",
    title: "Background",
    description: "Set the base color behind workshop content.",
    fields: [
      {
        field: "pageBackgroundColor",
        label: "Page background color",
        description: "Used as the main page background and image fallback.",
      },
    ],
  },
  {
    id: "text",
    title: "Text",
    description: "Define the main text hierarchy throughout the workshop.",
    fields: [
      {
        field: "primaryTextColor",
        label: "Primary text color",
        description: "Used for headings and high-emphasis body content.",
      },
      {
        field: "secondaryTextColor",
        label: "Secondary text color",
        description: "Used for supporting copy, captions, and metadata.",
      },
    ],
  },
  {
    id: "primary-button",
    title: "Primary Button",
    description: "Style the main calls to action.",
    fields: [
      {
        field: "primaryButtonBackgroundColor",
        label: "Background color",
        description: "Used behind primary action labels.",
      },
      {
        field: "primaryButtonTextColor",
        label: "Text color",
        description: "Used for text and icons on primary actions.",
      },
    ],
  },
  {
    id: "secondary-button",
    title: "Secondary Button",
    description: "Style secondary actions, dropdowns, and tabs.",
    fields: [
      {
        field: "secondaryButtonBackgroundColor",
        label: "Background color",
        description: "Used for the default secondary control background.",
      },
      {
        field: "secondaryButtonActiveBackgroundColor",
        label: "Active background color",
        description: "Used when a secondary control or tab is selected.",
      },
      {
        field: "secondaryButtonTextColor",
        label: "Text color",
        description: "Used for labels and icons in secondary controls.",
      },
      {
        field: "secondaryButtonBorderColor",
        label: "Border color",
        description: "Used around secondary controls, dropdowns, and tabs.",
      },
    ],
  },
  {
    id: "primary-card",
    title: "Primary Card",
    description: "Style the cards used for primary workshop content.",
    fields: [
      {
        field: "primaryCardBackgroundColor",
        label: "Background color",
        description: "Used behind content in primary cards.",
      },
      {
        field: "primaryCardBorderColor",
        label: "Border color",
        description: "Used for outlines around primary cards.",
      },
      {
        field: "primaryCardBorderRadius",
        label: "Border radius",
        description: "Controls primary card corner rounding in pixels.",
        kind: "number",
      },
      {
        field: "primaryCardBorderWidth",
        label: "Border width",
        description: "Controls primary card outline thickness in pixels.",
        kind: "number",
      },
    ],
  },
  {
    id: "secondary-card",
    title: "Secondary Card",
    description: "Style cards used on Bigscreen and Newsroom views.",
    fields: [
      {
        field: "secondaryCardBackgroundColor",
        label: "Background color",
        description: "Used behind content in secondary cards.",
      },
      {
        field: "secondaryCardBorderRadius",
        label: "Border radius",
        description: "Controls secondary card corner rounding in pixels.",
        kind: "number",
      },
      {
        field: "secondaryCardTextColor",
        label: "Text color",
        description: "Used for text displayed inside secondary cards.",
      },
    ],
  },
  {
    id: "ticker",
    title: "Ticker",
    description: "Style live labels and scrolling ticker content.",
    fields: [
      {
        field: "tickerLiveBackgroundColor",
        label: "LIVE background color",
        description: "Used behind the LIVE status label.",
      },
      {
        field: "tickerLiveTextColor",
        label: "LIVE text color",
        description: "Used for text inside the LIVE status label.",
      },
      {
        field: "tickerBackgroundColor",
        label: "Ticker background color",
        description: "Used behind the scrolling ticker content.",
      },
      {
        field: "tickerTextColor",
        label: "Ticker text color",
        description: "Used for scrolling ticker text.",
      },
    ],
  },
] as const

function ThemeStep({
  workshop,
  update,
  errors,
  activeTab,
  onTabChange,
}: {
  workshop: WorkshopFormValue
  update: <K extends keyof WorkshopFormValue>(
    field: K,
    value: WorkshopFormValue[K]
  ) => void
  errors: Record<string, string>
  activeTab: ThemeTab
  onTabChange: React.Dispatch<React.SetStateAction<ThemeTab>>
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as ThemeTab)}
    >
      <TabsList
        variant="line"
        aria-label="Theme sections"
        className="mb-6 grid w-full grid-cols-2 border-b border-border group-data-horizontal/tabs:h-10!"
      >
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
      </TabsList>

      <TabsContent value="colors">
        <div className="space-y-8">
          {themeColorSections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`theme-${section.id}-heading`}
            >
              <FormSectionHeader
                id={`theme-${section.id}-heading`}
                title={section.title}
                description={section.description}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {section.fields.map((item) =>
                  "kind" in item && item.kind === "number" ? (
                    <DimensionField
                      key={item.field}
                      id={`workshop-${item.field}`}
                      errorKey={item.field}
                      label={item.label}
                      description={item.description}
                      value={workshop[item.field]}
                      onChange={(value) => update(item.field, value)}
                      error={errors[item.field]}
                    />
                  ) : (
                    <ColorPickerField
                      key={item.field}
                      id={`workshop-${item.field}`}
                      errorKey={item.field}
                      label={item.label}
                      description={item.description}
                      value={workshop[item.field]}
                      onChange={(value) => update(item.field, value)}
                      error={errors[item.field]}
                      required={false}
                    />
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assets">
        <div className="space-y-8">
          <section aria-labelledby="theme-fonts-heading">
            <FormSectionHeader
              id="theme-fonts-heading"
              title="Fonts"
              description="Upload the typefaces used for display and supporting content."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FileField
                id="workshop-primary-font"
                errorKey="primaryFont"
                label="Primary font"
                description="Used for headings and prominent interface text. WOFF, WOFF2, TTF, or OTF."
                value={workshop.primaryFont}
                onChange={(file) => update("primaryFont", file)}
                error={errors.primaryFont}
                accept=".woff,.woff2,.ttf,.otf"
                preview="file"
                required={false}
              />
              <FileField
                id="workshop-secondary-font"
                errorKey="secondaryFont"
                label="Secondary font"
                description="Used for body copy and supporting interface text. WOFF, WOFF2, TTF, or OTF."
                value={workshop.secondaryFont}
                onChange={(file) => update("secondaryFont", file)}
                error={errors.secondaryFont}
                accept=".woff,.woff2,.ttf,.otf"
                preview="file"
                required={false}
              />
            </div>
          </section>

          <section aria-labelledby="theme-artwork-heading">
            <FormSectionHeader
              id="theme-artwork-heading"
              title="Artwork"
              description="Upload the brand and background imagery participants will see."
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5">
              <FileField
                id="workshop-logo"
                errorKey="logo"
                label="Logo"
                description="Shown in branded workshop areas; transparent artwork works best."
                value={workshop.logo}
                onChange={(file) => update("logo", file)}
                error={errors.logo}
                required={false}
              />
              <FileField
                id="workshop-page-background-image"
                errorKey="pageBackgroundImage"
                label="Page background image"
                description="Displayed behind workshop page content when provided."
                value={workshop.pageBackgroundImage}
                onChange={(file) => update("pageBackgroundImage", file)}
                error={errors.pageBackgroundImage}
                required={false}
              />
            </div>
          </section>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function DimensionField({
  id,
  errorKey,
  label,
  description,
  value,
  onChange,
  error,
}: {
  id: string
  errorKey: string
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const describedBy = `${id}-description${error ? ` ${id}-error` : ""}`

  return (
    <Field data-invalid={!!error} data-error-key={errorKey}>
      <div className="space-y-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          data-error-control
          className="pr-10"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          px
        </span>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )
}

function FileField({
  id,
  errorKey,
  label,
  description,
  value,
  onChange,
  error,
  accept = "image/*",
  preview = "image",
  required = true,
}: {
  id: string
  errorKey: string
  label: string
  description: string
  value: Upload
  onChange: (file: Upload) => void
  error?: string
  accept?: string
  preview?: "image" | "file"
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const removeFile = () => {
    if (inputRef.current) inputRef.current.value = ""
    onChange(null)
  }

  const selectFile = () => {
    if (!inputRef.current) return
    inputRef.current.value = ""
    inputRef.current.click()
  }

  const describedBy = `${id}-description${error ? ` ${id}-error` : ""}`

  return (
    <Field data-invalid={!!error} data-error-key={errorKey}>
      <div className="space-y-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      </div>
      <input
        id={id}
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept={accept}
        aria-invalid={!!error}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="relative flex min-h-24 items-center gap-3 border border-input p-3 pr-12">
          <div className="flex size-16 shrink-0 items-center justify-center bg-muted p-1">
            {preview === "image" ? (
              <FilePreview
                key={
                  value instanceof File
                    ? `${value.name}-${value.lastModified}-${value.size}`
                    : value
                }
                file={value}
              />
            ) : (
              <FileIcon className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs font-medium"
              title={getUploadName(value)}
            >
              {getUploadName(value)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {value instanceof File
                ? `${(value.size / 1024).toFixed(0)} KB`
                : "Existing file"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={removeFile}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          data-error-control
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-24 w-full flex-col gap-2 border-dashed text-muted-foreground hover:text-foreground"
          onClick={selectFile}
        >
          <UploadIcon />
          <span>Choose {label.toLowerCase()}</span>
        </Button>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )
}

function FilePreview({ file }: { file: Exclude<Upload, null> }) {
  const [url, setUrl] = useState<string | null>(
    typeof file === "string" ? file : null
  )

  useEffect(() => {
    if (typeof file === "string") return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") setUrl(reader.result)
    }
    reader.readAsDataURL(file)

    return () => {
      reader.abort()
      reader.onload = null
    }
  }, [file])

  return (
    <img src={url ?? undefined} alt="" className="size-full object-contain" />
  )
}

function PillarsStep({
  workshop,
  setWorkshop,
  errors,
  onFieldChange,
}: {
  workshop: WorkshopFormValue
  setWorkshop: React.Dispatch<React.SetStateAction<WorkshopFormValue>>
  errors: Record<string, string>
  onFieldChange: (errorKey?: string | string[]) => void
}) {
  const pendingFocusId = useRef<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const change = (id: string, field: "title" | "context", value: string) => {
    setWorkshop((current) => ({
      ...current,
      pillars: current.pillars.map((pillar) =>
        pillar.id === id ? { ...pillar, [field]: value } : pillar
      ),
    }))
    onFieldChange(`pillar-${id}-${field}`)
  }

  const addPillar = () => {
    const id = createItemId("pillar")
    pendingFocusId.current = id
    setWorkshop((current) => ({
      ...current,
      pillars: [...current.pillars, { id, title: "", context: "" }],
    }))
    onFieldChange()
  }

  const removePillar = (id: string) => {
    setWorkshop((current) => ({
      ...current,
      pillars: current.pillars.filter((pillar) => pillar.id !== id),
    }))
    onFieldChange([`pillar-${id}-title`, `pillar-${id}-context`])
    window.requestAnimationFrame(() => addButtonRef.current?.focus())
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold">Areas of focus</h3>
          <p className="mt-0.5 text-xs/relaxed text-muted-foreground">
            Break the workshop challenge into clear creative territories.
          </p>
        </div>
        <Badge variant="secondary">
          {workshop.pillars.length}{" "}
          {workshop.pillars.length === 1 ? "pillar" : "pillars"}
        </Badge>
      </div>
      <div className="grid gap-4">
        {workshop.pillars.map((pillar, index) => {
          const titleKey = `pillar-${pillar.id}-title`
          const contextKey = `pillar-${pillar.id}-context`

          return (
            <fieldset key={pillar.id}>
              <legend className="sr-only">Pillar {index + 1}</legend>
              <Card size="sm" className="gap-0 py-0">
                <CardHeader className="border-b border-border py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center bg-primary text-[11px] font-semibold text-primary-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <CardTitle>
                        <h3 className="truncate">
                          {pillar.title || `Pillar ${index + 1}`}
                        </h3>
                      </CardTitle>
                      <CardDescription>Creative territory</CardDescription>
                    </div>
                  </div>
                  {workshop.pillars.length > 1 && (
                    <CardAction>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="size-10 sm:size-8"
                        aria-label={`Remove ${pillar.title || `pillar ${index + 1}`}`}
                        onClick={() => removePillar(pillar.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="grid gap-5 py-4">
                  <Field
                    data-invalid={!!errors[titleKey]}
                    data-error-key={titleKey}
                  >
                    <FieldLabel htmlFor={`${pillar.id}-title`}>
                      Title
                    </FieldLabel>
                    <Input
                      id={`${pillar.id}-title`}
                      ref={(node) => {
                        if (!node || pendingFocusId.current !== pillar.id)
                          return
                        pendingFocusId.current = null
                        node.focus()
                      }}
                      value={pillar.title}
                      onChange={(event) =>
                        change(pillar.id, "title", event.target.value)
                      }
                      placeholder="e.g. Moments of connection"
                      aria-invalid={!!errors[titleKey]}
                      aria-required="true"
                      aria-describedby={
                        errors[titleKey]
                          ? `${pillar.id}-title-error`
                          : undefined
                      }
                      data-error-control
                    />
                    {errors[titleKey] && (
                      <FieldError id={`${pillar.id}-title-error`}>
                        {errors[titleKey]}
                      </FieldError>
                    )}
                  </Field>
                  <Field
                    data-invalid={!!errors[contextKey]}
                    data-error-key={contextKey}
                  >
                    <FieldLabel htmlFor={`${pillar.id}-context`}>
                      Context
                    </FieldLabel>
                    <Textarea
                      id={`${pillar.id}-context`}
                      value={pillar.context}
                      onChange={(event) =>
                        change(pillar.id, "context", event.target.value)
                      }
                      placeholder="Describe what teams should explore in this territory."
                      aria-invalid={!!errors[contextKey]}
                      aria-required="true"
                      aria-describedby={
                        errors[contextKey]
                          ? `${pillar.id}-context-error`
                          : undefined
                      }
                      data-error-control
                      className="max-h-72 min-h-28 resize-none text-base sm:text-sm md:text-sm"
                    />
                    {errors[contextKey] && (
                      <FieldError id={`${pillar.id}-context-error`}>
                        {errors[contextKey]}
                      </FieldError>
                    )}
                  </Field>
                </CardContent>
              </Card>
            </fieldset>
          )
        })}
      </div>
      <Button
        ref={addButtonRef}
        type="button"
        variant="outline"
        className="h-11 w-full border-dashed sm:h-10"
        onClick={addPillar}
      >
        <PlusIcon /> Add pillar
      </Button>
    </div>
  )
}

function TeamsStep({
  workshop,
  update,
  setWorkshop,
  errors,
  onFieldChange,
}: {
  workshop: WorkshopFormValue
  update: <K extends keyof WorkshopFormValue>(
    field: K,
    value: WorkshopFormValue[K]
  ) => void
  setWorkshop: React.Dispatch<React.SetStateAction<WorkshopFormValue>>
  errors: Record<string, string>
  onFieldChange: (errorKey?: string | string[]) => void
}) {
  const pendingFocusId = useRef<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const change = (
    id: string,
    field: keyof Omit<Team, "id">,
    value: string | Upload
  ) => {
    setWorkshop((current) => ({
      ...current,
      teams: current.teams.map((team) =>
        team.id === id ? { ...team, [field]: value } : team
      ),
    }))
    onFieldChange(`team-${id}-${field}`)
  }

  const addTeam = () => {
    const id = createItemId("team")
    pendingFocusId.current = id
    setWorkshop((current) => ({
      ...current,
      teams: [
        ...current.teams,
        {
          id,
          name: "",
          color: "#D9FF00",
          thumbnail: null,
          description: "",
          passcode: "",
        },
      ],
    }))
    onFieldChange()
  }

  const removeTeam = (id: string) => {
    setWorkshop((current) => ({
      ...current,
      teams: current.teams.filter((team) => team.id !== id),
    }))
    onFieldChange([
      `team-${id}-name`,
      `team-${id}-color`,
      `team-${id}-thumbnail`,
      `team-${id}-description`,
      `team-${id}-passcode`,
    ])
    window.requestAnimationFrame(() => addButtonRef.current?.focus())
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Participant groups</h3>
          <p className="mt-0.5 text-xs/relaxed text-muted-foreground">
            Create the teams that will work together during the session.
          </p>
        </div>
        <Badge variant="secondary">
          {workshop.teams.length}{" "}
          {workshop.teams.length === 1 ? "team" : "teams"}
        </Badge>
      </div>

      <div className="border border-border bg-muted/25 p-4">
        <label
          htmlFor="team-passcode-protection"
          className="flex cursor-pointer items-center justify-between gap-5"
        >
          <span>
            <span className="block text-xs font-semibold">
              Unique team PINs
            </span>
            <span
              id="team-passcode-description"
              className="mt-0.5 block text-xs/relaxed text-muted-foreground"
            >
              Require a unique four-digit PIN for each team.
            </span>
          </span>
          <Switch
            id="team-passcode-protection"
            checked={workshop.usePasscode}
            onCheckedChange={(checked) => update("usePasscode", checked)}
            aria-label="Require unique team PINs"
            aria-describedby="team-passcode-description"
          />
        </label>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-4">
        {workshop.teams.map((team, index) => {
          const nameKey = `team-${team.id}-name`
          const colorKey = `team-${team.id}-color`
          const thumbnailKey = `team-${team.id}-thumbnail`
          const descriptionKey = `team-${team.id}-description`
          const passcodeKey = `team-${team.id}-passcode`

          return (
            <fieldset key={team.id} className="min-w-0">
              <legend className="sr-only">Team {index + 1}</legend>
              <Card size="sm" className="h-full gap-0 py-0">
                <CardHeader className="border-b border-border py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-7 shrink-0 border border-foreground/15"
                      style={{
                        backgroundColor: isHexColor(team.color)
                          ? team.color
                          : "var(--muted)",
                      }}
                    />
                    <div className="min-w-0">
                      <CardTitle>
                        <h3 className="truncate">
                          {team.name || `Team ${index + 1}`}
                        </h3>
                      </CardTitle>
                      <CardDescription>Participant group</CardDescription>
                    </div>
                  </div>
                  {workshop.teams.length > 1 && (
                    <CardAction>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="size-10 sm:size-8"
                        aria-label={`Remove ${team.name || `team ${index + 1}`}`}
                        onClick={() => removeTeam(team.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="grid gap-5 py-4">
                  <Field
                    data-invalid={!!errors[nameKey]}
                    data-error-key={nameKey}
                  >
                    <FieldLabel htmlFor={`${team.id}-name`}>Name</FieldLabel>
                    <Input
                      id={`${team.id}-name`}
                      ref={(node) => {
                        if (!node || pendingFocusId.current !== team.id) return
                        pendingFocusId.current = null
                        node.focus()
                      }}
                      value={team.name}
                      onChange={(event) =>
                        change(team.id, "name", event.target.value)
                      }
                      placeholder="e.g. Trailblazers"
                      aria-invalid={!!errors[nameKey]}
                      aria-required="true"
                      aria-describedby={
                        errors[nameKey] ? `${team.id}-name-error` : undefined
                      }
                      data-error-control
                    />
                    {errors[nameKey] && (
                      <FieldError id={`${team.id}-name-error`}>
                        {errors[nameKey]}
                      </FieldError>
                    )}
                  </Field>

                  <ColorPickerField
                    id={`${team.id}-color`}
                    errorKey={colorKey}
                    label="Team color"
                    value={team.color}
                    onChange={(value) => change(team.id, "color", value)}
                    error={errors[colorKey]}
                  />

                  <FileField
                    id={`${team.id}-thumbnail`}
                    errorKey={thumbnailKey}
                    label="Thumbnail"
                    description="Image used to identify this team."
                    value={team.thumbnail}
                    onChange={(file) => change(team.id, "thumbnail", file)}
                    error={errors[thumbnailKey]}
                  />

                  <Field
                    data-invalid={!!errors[descriptionKey]}
                    data-error-key={descriptionKey}
                  >
                    <FieldLabel htmlFor={`${team.id}-description`}>
                      Description
                    </FieldLabel>
                    <Textarea
                      id={`${team.id}-description`}
                      value={team.description}
                      onChange={(event) =>
                        change(team.id, "description", event.target.value)
                      }
                      placeholder="Describe this team's role or perspective."
                      aria-invalid={!!errors[descriptionKey]}
                      aria-required="true"
                      aria-describedby={
                        errors[descriptionKey]
                          ? `${team.id}-description-error`
                          : undefined
                      }
                      data-error-control
                      className="max-h-72 min-h-28 resize-none text-base sm:text-sm md:text-sm"
                    />
                    {errors[descriptionKey] && (
                      <FieldError id={`${team.id}-description-error`}>
                        {errors[descriptionKey]}
                      </FieldError>
                    )}
                  </Field>

                  {workshop.usePasscode && (
                    <Field
                      data-invalid={!!errors[passcodeKey]}
                      data-error-key={passcodeKey}
                    >
                      <FieldLabel htmlFor={`${team.id}-passcode`}>
                        Four-digit PIN
                      </FieldLabel>
                      <InputOTP
                        id={`${team.id}-passcode`}
                        maxLength={4}
                        inputMode="numeric"
                        pattern={REGEXP_ONLY_DIGITS}
                        value={team.passcode}
                        onChange={(value) => change(team.id, "passcode", value)}
                        aria-label={`PIN for ${team.name || `team ${index + 1}`}`}
                        aria-invalid={!!errors[passcodeKey]}
                        aria-required="true"
                        aria-describedby={
                          errors[passcodeKey]
                            ? `${team.id}-passcode-error`
                            : undefined
                        }
                        data-error-control
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3].map((slot) => (
                            <InputOTPSlot
                              key={slot}
                              index={slot}
                              className="size-11 text-base sm:size-9 sm:text-sm"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      {errors[passcodeKey] && (
                        <FieldError id={`${team.id}-passcode-error`}>
                          {errors[passcodeKey]}
                        </FieldError>
                      )}
                    </Field>
                  )}
                </CardContent>
              </Card>
            </fieldset>
          )
        })}
      </div>
      <Button
        ref={addButtonRef}
        type="button"
        variant="outline"
        className="h-11 w-full border-dashed sm:h-10"
        onClick={addTeam}
      >
        <PlusIcon /> Add team
      </Button>
    </div>
  )
}

function WalkthroughStep({
  workshop,
  setWorkshop,
  errors,
  onFieldChange,
}: {
  workshop: WorkshopFormValue
  setWorkshop: React.Dispatch<React.SetStateAction<WorkshopFormValue>>
  errors: Record<string, string>
  onFieldChange: (errorKey?: string | string[]) => void
}) {
  const pendingFocusId = useRef<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const change = (
    id: string,
    field: keyof Omit<WalkthroughMessage, "id">,
    value: string
  ) => {
    setWorkshop((current) => ({
      ...current,
      walkthroughMessages: current.walkthroughMessages.map((message) =>
        message.id === id ? { ...message, [field]: value } : message
      ),
    }))
    onFieldChange(`walkthrough-${id}-${field}`)
  }

  const addMessage = () => {
    const id = createItemId("walkthrough")
    pendingFocusId.current = id
    setWorkshop((current) => ({
      ...current,
      walkthroughMessages: [
        ...current.walkthroughMessages,
        { id, title: "", description: "" },
      ],
    }))
    onFieldChange()
  }

  const removeMessage = (id: string) => {
    setWorkshop((current) => ({
      ...current,
      walkthroughMessages: current.walkthroughMessages.filter(
        (message) => message.id !== id
      ),
    }))
    onFieldChange([`walkthrough-${id}-title`, `walkthrough-${id}-description`])
    window.requestAnimationFrame(() => addButtonRef.current?.focus())
  }

  const reorderMessages = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const previousIndex = workshop.walkthroughMessages.findIndex(
      (message) => message.id === String(active.id)
    )
    const nextIndex = workshop.walkthroughMessages.findIndex(
      (message) => message.id === String(over.id)
    )

    if (previousIndex < 0 || nextIndex < 0) return

    setWorkshop((current) => ({
      ...current,
      walkthroughMessages: arrayMove(
        current.walkthroughMessages,
        previousIndex,
        nextIndex
      ),
    }))
    onFieldChange()
  }

  const messageIds = workshop.walkthroughMessages.map((message) => message.id)
  const canReorder = workshop.walkthroughMessages.length > 1

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold">Participant walkthrough</h3>
          <p className="mt-0.5 text-xs/relaxed text-muted-foreground">
            Create the messages participants will see as they move through the
            workshop.
          </p>
        </div>
        <Badge variant="secondary">
          {workshop.walkthroughMessages.length}{" "}
          {workshop.walkthroughMessages.length === 1 ? "message" : "messages"}
        </Badge>
      </div>

      {canReorder && (
        <p
          id="workshop-walkthrough-reorder-instructions"
          className="text-xs text-muted-foreground"
        >
          Drag messages to change their workshop order. Keyboard users can press
          Space, then use the arrow keys.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToWindowEdges]}
        onDragEnd={reorderMessages}
      >
        <SortableContext
          items={messageIds}
          strategy={verticalListSortingStrategy}
        >
          <ol
            aria-label="Workshop walkthrough order"
            aria-describedby={
              canReorder
                ? "workshop-walkthrough-reorder-instructions"
                : undefined
            }
            className="grid gap-4"
          >
            {workshop.walkthroughMessages.map((message, index) => (
              <SortableWalkthroughMessage
                key={message.id}
                message={message}
                position={index + 1}
                canReorder={canReorder}
                errors={errors}
                onTitleRef={(node) => {
                  if (!node || pendingFocusId.current !== message.id) return
                  pendingFocusId.current = null
                  node.focus()
                }}
                onChange={(field, value) => change(message.id, field, value)}
                onRemove={() => removeMessage(message.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <Button
        ref={addButtonRef}
        type="button"
        variant="outline"
        className="h-11 w-full border-dashed sm:h-10"
        onClick={addMessage}
      >
        <PlusIcon /> Add message
      </Button>
    </div>
  )
}

function SortableWalkthroughMessage({
  message,
  position,
  canReorder,
  errors,
  onTitleRef,
  onChange,
  onRemove,
}: {
  message: WalkthroughMessage
  position: number
  canReorder: boolean
  errors: Record<string, string>
  onTitleRef: (node: HTMLInputElement | null) => void
  onChange: (field: keyof Omit<WalkthroughMessage, "id">, value: string) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id })
  const titleKey = `walkthrough-${message.id}-title`
  const descriptionKey = `walkthrough-${message.id}-description`

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "z-10")}
    >
      <fieldset>
        <legend className="sr-only">Walkthrough message {position}</legend>
        <Card
          size="sm"
          className={cn(
            "gap-0 py-0",
            isDragging && "bg-card opacity-90 shadow-lg ring-primary/40"
          )}
        >
          <CardHeader className="border-b border-border py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center bg-primary text-[11px] font-semibold text-primary-foreground">
                {String(position).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <CardTitle>
                  <h3 className="truncate">
                    {message.title || `Message ${position}`}
                  </h3>
                </CardTitle>
                <CardDescription>Walkthrough message</CardDescription>
              </div>
            </div>
            {canReorder && (
              <CardAction className="flex items-center gap-1">
                <Button
                  {...attributes}
                  {...listeners}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-10 cursor-grab touch-none text-muted-foreground active:cursor-grabbing sm:size-8"
                  aria-label={`Move ${message.title || `message ${position}`}. Current position ${position}.`}
                  aria-describedby="workshop-walkthrough-reorder-instructions"
                >
                  <GripVerticalIcon />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="size-10 sm:size-8"
                  aria-label={`Remove ${message.title || `message ${position}`}`}
                  onClick={onRemove}
                >
                  <Trash2Icon />
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="grid gap-5 py-4">
            <Field data-invalid={!!errors[titleKey]} data-error-key={titleKey}>
              <FieldLabel htmlFor={`${message.id}-title`}>Title</FieldLabel>
              <Input
                id={`${message.id}-title`}
                ref={onTitleRef}
                value={message.title}
                onChange={(event) => onChange("title", event.target.value)}
                placeholder="e.g. Choose your team"
                aria-invalid={!!errors[titleKey]}
                aria-required="true"
                aria-describedby={
                  errors[titleKey] ? `${message.id}-title-error` : undefined
                }
                data-error-control
              />
              {errors[titleKey] && (
                <FieldError id={`${message.id}-title-error`}>
                  {errors[titleKey]}
                </FieldError>
              )}
            </Field>

            <Field
              data-invalid={!!errors[descriptionKey]}
              data-error-key={descriptionKey}
            >
              <FieldLabel htmlFor={`${message.id}-description`}>
                Description
              </FieldLabel>
              <Textarea
                id={`${message.id}-description`}
                value={message.description}
                onChange={(event) =>
                  onChange("description", event.target.value)
                }
                placeholder="Explain what participants should do at this point."
                aria-invalid={!!errors[descriptionKey]}
                aria-required="true"
                aria-describedby={
                  errors[descriptionKey]
                    ? `${message.id}-description-error`
                    : undefined
                }
                data-error-control
                className="max-h-72 min-h-28 resize-none text-base sm:text-sm md:text-sm"
              />
              {errors[descriptionKey] && (
                <FieldError id={`${message.id}-description-error`}>
                  {errors[descriptionKey]}
                </FieldError>
              )}
            </Field>
          </CardContent>
        </Card>
      </fieldset>
    </li>
  )
}

function CoachesStep({
  workshop,
  setWorkshop,
  errors,
  onFieldChange,
}: {
  workshop: WorkshopFormValue
  setWorkshop: React.Dispatch<React.SetStateAction<WorkshopFormValue>>
  errors: Record<string, string>
  onFieldChange: (errorKey?: string | string[]) => void
}) {
  const changeCoach = (
    id: string,
    changes: Partial<Coach>,
    errorKey?: string | string[]
  ) => {
    setWorkshop((current) => ({
      ...current,
      coaches: current.coaches.map((coach) =>
        coach.id === id ? { ...coach, ...changes } : coach
      ),
    }))
    onFieldChange(errorKey)
  }

  const enabledCoaches = workshop.coaches.filter(
    (coach) => coach.enabled
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold">Coaching team</h3>
          <p className="mt-0.5 text-xs/relaxed text-muted-foreground">
            Choose who will guide participants through the workshop.
          </p>
        </div>
        <Badge variant="secondary">{enabledCoaches} included</Badge>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-4">
        {workshop.coaches.map((coach, index) => {
          const nameKey = `coach-${coach.id}-name`
          const titleKey = `coach-${coach.id}-title`
          const descriptionKey = `coach-${coach.id}-description`
          const backgroundColorKey = `coach-${coach.id}-backgroundColor`
          const primaryTextColorKey = `coach-${coach.id}-primaryTextColor`
          const secondaryTextColorKey = `coach-${coach.id}-secondaryTextColor`
          const previewBackgroundColor = getCoachColor(
            coach.backgroundColor,
            DEFAULT_COACH_COLORS.background
          )
          const previewPrimaryTextColor = getCoachColor(
            coach.primaryTextColor,
            DEFAULT_COACH_COLORS.primaryText
          )
          const previewSecondaryTextColor = getCoachColor(
            coach.secondaryTextColor,
            DEFAULT_COACH_COLORS.secondaryText
          )

          return (
            <Card
              key={coach.id}
              size="sm"
              className={cn(
                "gap-0 py-0 transition-opacity",
                !coach.enabled && "opacity-60"
              )}
            >
              <CardHeader className="border-b border-border py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage
                      src={coach.avatar}
                      alt={coach.name || `Coach ${index + 1}`}
                    />
                    <AvatarFallback>
                      {getInitials(coach.name || `Coach ${index + 1}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle>
                      <h3 className="truncate">
                        {coach.name || `Coach ${index + 1}`}
                      </h3>
                    </CardTitle>
                    <CardDescription>
                      {coach.enabled ? "Included" : "Excluded"}
                    </CardDescription>
                  </div>
                </div>
                <CardAction className="flex items-center gap-2">
                  <label
                    htmlFor={`${coach.id}-enabled`}
                    className="text-xs text-muted-foreground"
                  >
                    Include
                  </label>
                  <Switch
                    id={`${coach.id}-enabled`}
                    checked={coach.enabled}
                    aria-label={`Include ${coach.name || `coach ${index + 1}`}`}
                    onCheckedChange={(enabled) =>
                      changeCoach(coach.id, { enabled }, [
                        nameKey,
                        titleKey,
                        descriptionKey,
                        backgroundColorKey,
                        primaryTextColorKey,
                        secondaryTextColorKey,
                      ])
                    }
                  />
                </CardAction>
              </CardHeader>

              <CardContent className="grid gap-5 py-4">
                <div
                  aria-label={`Preview for ${coach.name || `coach ${index + 1}`}`}
                  className="flex min-w-0 items-start gap-3 border border-black/10 p-3"
                  style={{ backgroundColor: previewBackgroundColor }}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage
                      src={coach.avatar}
                      alt={coach.name || `Coach ${index + 1}`}
                    />
                    <AvatarFallback>
                      {getInitials(coach.name || `Coach ${index + 1}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: previewPrimaryTextColor }}
                    >
                      {coach.name || `Coach ${index + 1}`}
                    </p>
                    <p
                      className="truncate text-xs"
                      style={{ color: previewSecondaryTextColor }}
                    >
                      {coach.title || "Coach title"}
                    </p>
                    <p
                      className="mt-1 line-clamp-2 text-xs"
                      style={{ color: previewSecondaryTextColor }}
                    >
                      {coach.description || "Coach description"}
                    </p>
                  </div>
                </div>

                <Field
                  data-invalid={!!errors[nameKey]}
                  data-disabled={!coach.enabled}
                  data-error-key={nameKey}
                >
                  <FieldLabel htmlFor={`${coach.id}-name`}>Name</FieldLabel>
                  <Input
                    id={`${coach.id}-name`}
                    value={coach.name}
                    disabled={!coach.enabled}
                    onChange={(event) =>
                      changeCoach(
                        coach.id,
                        { name: event.target.value },
                        nameKey
                      )
                    }
                    aria-invalid={!!errors[nameKey]}
                    aria-required={coach.enabled}
                    aria-describedby={
                      errors[nameKey] ? `${coach.id}-name-error` : undefined
                    }
                    data-error-control
                  />
                  {errors[nameKey] && (
                    <FieldError id={`${coach.id}-name-error`}>
                      {errors[nameKey]}
                    </FieldError>
                  )}
                </Field>

                <Field
                  data-invalid={!!errors[titleKey]}
                  data-disabled={!coach.enabled}
                  data-error-key={titleKey}
                >
                  <FieldLabel htmlFor={`${coach.id}-title`}>Title</FieldLabel>
                  <Input
                    id={`${coach.id}-title`}
                    value={coach.title}
                    disabled={!coach.enabled}
                    onChange={(event) =>
                      changeCoach(
                        coach.id,
                        { title: event.target.value },
                        titleKey
                      )
                    }
                    placeholder="e.g. Creative director"
                    aria-invalid={!!errors[titleKey]}
                    aria-required={coach.enabled}
                    aria-describedby={
                      errors[titleKey] ? `${coach.id}-title-error` : undefined
                    }
                    data-error-control
                  />
                  {errors[titleKey] && (
                    <FieldError id={`${coach.id}-title-error`}>
                      {errors[titleKey]}
                    </FieldError>
                  )}
                </Field>

                <Field
                  data-invalid={!!errors[descriptionKey]}
                  data-disabled={!coach.enabled}
                  data-error-key={descriptionKey}
                >
                  <FieldLabel htmlFor={`${coach.id}-description`}>
                    Description
                  </FieldLabel>
                  <Textarea
                    id={`${coach.id}-description`}
                    value={coach.description}
                    disabled={!coach.enabled}
                    onChange={(event) =>
                      changeCoach(
                        coach.id,
                        { description: event.target.value },
                        descriptionKey
                      )
                    }
                    placeholder="Describe how this coach supports participants."
                    aria-invalid={!!errors[descriptionKey]}
                    aria-required={coach.enabled}
                    aria-describedby={
                      errors[descriptionKey]
                        ? `${coach.id}-description-error`
                        : undefined
                    }
                    data-error-control
                    className="max-h-72 min-h-28 resize-none text-base sm:text-sm md:text-sm"
                  />
                  {errors[descriptionKey] && (
                    <FieldError id={`${coach.id}-description-error`}>
                      {errors[descriptionKey]}
                    </FieldError>
                  )}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorPickerField
                    id={`${coach.id}-background-color`}
                    errorKey={backgroundColorKey}
                    label="Background color"
                    value={coach.backgroundColor}
                    disabled={!coach.enabled}
                    required={coach.enabled}
                    error={errors[backgroundColorKey]}
                    onChange={(backgroundColor) =>
                      changeCoach(
                        coach.id,
                        { backgroundColor },
                        backgroundColorKey
                      )
                    }
                  />
                  <ColorPickerField
                    id={`${coach.id}-primary-text-color`}
                    errorKey={primaryTextColorKey}
                    label="Primary text color"
                    value={coach.primaryTextColor}
                    disabled={!coach.enabled}
                    required={coach.enabled}
                    error={errors[primaryTextColorKey]}
                    onChange={(primaryTextColor) =>
                      changeCoach(
                        coach.id,
                        { primaryTextColor },
                        primaryTextColorKey
                      )
                    }
                  />
                  <ColorPickerField
                    id={`${coach.id}-secondary-text-color`}
                    errorKey={secondaryTextColorKey}
                    label="Secondary text color"
                    value={coach.secondaryTextColor}
                    disabled={!coach.enabled}
                    required={coach.enabled}
                    error={errors[secondaryTextColorKey]}
                    onChange={(secondaryTextColor) =>
                      changeCoach(
                        coach.id,
                        { secondaryTextColor },
                        secondaryTextColorKey
                      )
                    }
                  />
                </div>

                <fieldset disabled={!coach.enabled}>
                  <legend className="mb-2 text-xs font-medium">
                    Choose avatar
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {COACH_PRESET_AVATARS.map((avatar, avatarIndex) => (
                      <button
                        type="button"
                        key={avatar}
                        aria-pressed={coach.avatar === avatar}
                        aria-label={`Use avatar ${avatarIndex + 1} for ${
                          coach.name || `coach ${index + 1}`
                        }`}
                        onClick={() => changeCoach(coach.id, { avatar })}
                        className={cn(
                          "rounded-full border-2 border-transparent p-0.5 transition-all outline-none hover:opacity-80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                          coach.avatar === avatar && "border-primary"
                        )}
                      >
                        <Avatar className="size-9">
                          <AvatarImage
                            src={avatar}
                            alt={`Avatar ${avatarIndex + 1}`}
                          />
                          <AvatarFallback>{avatarIndex + 1}</AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function SettingsStep({
  workshop,
  update,
  errors,
}: {
  workshop: WorkshopFormValue
  update: <K extends keyof WorkshopFormValue>(
    field: K,
    value: WorkshopFormValue[K]
  ) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="settings-outcomes-heading">
        <FormSectionHeader
          id="settings-outcomes-heading"
          title="Workshop outcomes"
          description="Control how many ideas are selected when voting is complete."
        />
        <div className="max-w-md">
          <Field
            data-invalid={!!errors.winningIdeaCount}
            data-error-key="winningIdeaCount"
          >
            <div className="space-y-1">
              <FieldLabel htmlFor="workshop-winning-idea-count">
                Winning idea count
              </FieldLabel>
              <FieldDescription id="workshop-winning-idea-count-description">
                The number of ideas that can be selected as winners.
              </FieldDescription>
            </div>
            <Input
              id="workshop-winning-idea-count"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={workshop.winningIdeaCount}
              onChange={(event) =>
                update("winningIdeaCount", event.target.value)
              }
              aria-invalid={!!errors.winningIdeaCount}
              aria-required="true"
              aria-describedby={`workshop-winning-idea-count-description${
                errors.winningIdeaCount
                  ? " workshop-winning-idea-count-error"
                  : ""
              }`}
              data-error-control
            />
            {errors.winningIdeaCount && (
              <FieldError id="workshop-winning-idea-count-error">
                {errors.winningIdeaCount}
              </FieldError>
            )}
          </Field>
        </div>
      </section>

      <section aria-labelledby="settings-voting-heading">
        <FormSectionHeader
          id="settings-voting-heading"
          title="Voting"
          description="Choose where vote limits apply and optionally cap each participant's votes."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            data-invalid={!!errors.votingScope}
            data-error-key="votingScope"
          >
            <div className="space-y-1">
              <FieldLabel htmlFor="workshop-voting-scope">
                Voting scope
              </FieldLabel>
              <FieldDescription id="workshop-voting-scope-description">
                Apply each participant's limit across the workshop or separately
                to every pillar.
              </FieldDescription>
            </div>
            <Select
              value={workshop.votingScope}
              onValueChange={(value) =>
                update("votingScope", value as VotingScope)
              }
              items={[
                { value: "workshop", label: "Workshop-wise" },
                { value: "pillar", label: "Pillar-wise" },
              ]}
            >
              <SelectTrigger
                id="workshop-voting-scope"
                aria-invalid={!!errors.votingScope}
                aria-required="true"
                aria-describedby={`workshop-voting-scope-description${
                  errors.votingScope ? " workshop-voting-scope-error" : ""
                }`}
                data-error-control
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop-wise</SelectItem>
                <SelectItem value="pillar">Pillar-wise</SelectItem>
              </SelectContent>
            </Select>
            {errors.votingScope && (
              <FieldError id="workshop-voting-scope-error">
                {errors.votingScope}
              </FieldError>
            )}
          </Field>

          <Field
            data-invalid={!!errors.votingLimit}
            data-error-key="votingLimit"
          >
            <div className="space-y-1">
              <FieldLabel htmlFor="workshop-voting-limit">
                Voting limit
              </FieldLabel>
              <FieldDescription id="workshop-voting-limit-description">
                Leave blank to allow unlimited votes per participant.
              </FieldDescription>
            </div>
            <Input
              id="workshop-voting-limit"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={workshop.votingLimit ?? ""}
              placeholder="Unlimited"
              onChange={(event) =>
                update("votingLimit", event.target.value || null)
              }
              aria-invalid={!!errors.votingLimit}
              aria-describedby={`workshop-voting-limit-description${
                errors.votingLimit ? " workshop-voting-limit-error" : ""
              }`}
              data-error-control
            />
            {errors.votingLimit && (
              <FieldError id="workshop-voting-limit-error">
                {errors.votingLimit}
              </FieldError>
            )}
          </Field>
        </div>
      </section>
    </div>
  )
}
