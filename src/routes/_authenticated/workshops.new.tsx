import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"
import { getCoachesOptions } from "@/services/coaches"
import { getUsersOptions, type User } from "@/services/users"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { HexColorPicker } from "react-colorful"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  FileIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

export const Route = createFileRoute("/_authenticated/workshops/new")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(
        getUsersOptions({ is_active: true, role: "Admin" })
      ),
      context.queryClient.query(getCoachesOptions()),
    ]),
  component: RouteComponent,
})

type Upload = File | null
type ThemeTab = "colors" | "assets" | "fonts"

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
  name: string
  title: string
  description: string
  avatar: string
  enabled: boolean
}

type Workshop = {
  title: string
  assignee: string
  brand: string
  subtitle: string
  context: string
  guidelines: string
  primaryColor: string
  secondaryColor: string
  logo: Upload
  portrait: Upload
  landscape: Upload
  headingFont: Upload
  bodyFont: Upload
  pillars: Pillar[]
  teams: Team[]
  walkthroughMessages: WalkthroughMessage[]
  usePasscode: boolean
  coaches: Coach[]
}

const steps = [
  { title: "Identity", description: "Set the workshop foundation" },
  { title: "Theme", description: "Shape the visual direction" },
  { title: "Pillars", description: "Define the areas of focus" },
  { title: "Teams", description: "Set up participant groups" },
  { title: "Walkthrough", description: "Guide participants through the flow" },
  { title: "Coaches", description: "Configure workshop coaches" },
]

const presetAvatars = [
  "https://storage.googleapis.com/dev-ogilvy-base-camp-storage/global-coach/listener.png",
  "https://storage.googleapis.com/dev-ogilvy-base-camp-storage/global-coach/provocateur.png",
  "https://storage.googleapis.com/dev-ogilvy-base-camp-storage/global-coach/sharpener.png",
  "https://storage.googleapis.com/dev-ogilvy-base-camp-storage/global-coach/tastemaker.png",
]

const inputClassName = "h-11 text-base sm:h-10 sm:text-sm md:text-sm"
const textareaClassName = "min-h-28 resize-y text-base sm:text-sm md:text-sm"

const workshopFieldSteps: Partial<Record<keyof Workshop, number>> = {
  title: 0,
  assignee: 0,
  brand: 0,
  subtitle: 0,
  context: 0,
  guidelines: 0,
  primaryColor: 1,
  secondaryColor: 1,
  logo: 1,
  portrait: 1,
  landscape: 1,
  headingFont: 1,
  bodyFont: 1,
  usePasscode: 3,
}

const initialWorkshop: Workshop = {
  title: "",
  assignee: "",
  brand: "",
  subtitle: "",
  context: "",
  guidelines: "",
  primaryColor: "#111111",
  secondaryColor: "#D9FF00",
  logo: null,
  portrait: null,
  landscape: null,
  headingFont: null,
  bodyFont: null,
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
  walkthroughMessages: [
    { id: "walkthrough-initial", title: "", description: "" },
  ],
  usePasscode: false,
  coaches: [],
}

function getStepErrors(step: number, workshop: Workshop) {
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
    if (!isHexColor(workshop.primaryColor))
      nextErrors.primaryColor = "Enter a valid hex color."
    if (!isHexColor(workshop.secondaryColor))
      nextErrors.secondaryColor = "Enter a valid hex color."
    for (const [field, label] of [
      ["logo", "Logo"],
      ["portrait", "Background portrait"],
      ["landscape", "Background landscape"],
    ] as const) {
      if (!workshop[field]) nextErrors[field] = `${label} is required.`
      else if (!isImageUpload(workshop[field]))
        nextErrors[field] = `${label} must be an image file.`
    }
    for (const [field, label] of [
      ["headingFont", "Heading font"],
      ["bodyFont", "Body font"],
    ] as const) {
      if (!workshop[field]) nextErrors[field] = `${label} is required.`
      else if (!isFontUpload(workshop[field]))
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
    })

  return nextErrors
}

function getThemeTabForErrors(errors: Record<string, string>): ThemeTab {
  if (errors.primaryColor || errors.secondaryColor) return "colors"
  if (errors.logo || errors.portrait || errors.landscape) return "assets"
  return "fonts"
}

function RouteComponent() {
  const { data: users } = useSuspenseQuery({
    ...getUsersOptions({ is_active: true, role: "Admin" }),
    select: (data) => data.data,
  })
  const { data: coaches } = useSuspenseQuery({
    ...getCoachesOptions(),
    select: (data) => data.data,
  })
  const [workshop, setWorkshop] = useState<Workshop>(() => ({
    ...initialWorkshop,
    coaches: coaches
      .filter((coach) => coach.IsActive)
      .map((coach) => ({
        id: coach.ID,
        name: coach.CoachName,
        title: coach.Title,
        description: coach.Description,
        avatar: coach.AvatarFileName,
        enabled: true,
      })),
  }))
  const [activeStep, setActiveStep] = useState(0)
  const [highestReached, setHighestReached] = useState(0)
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

  const update = <K extends keyof Workshop>(field: K, value: Workshop[K]) => {
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

    console.log("New workshop", workshop)
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
            Create a new workshop
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Set the workshop foundation, visual system, participant groups,
            walkthrough, and coaching team.
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

          <form onSubmit={submit} noValidate className="min-w-0">
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
                  onClick={next}
                >
                  Continue
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 sm:flex-none">
                  <CheckIcon />
                  Create workshop
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
        aria-label="Workshop creation steps"
        className="border-b border-border bg-muted/25 @min-[56rem]/wizard:hidden"
      >
        <ol className="grid grid-cols-6">
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
      aria-label="Workshop creation steps"
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
  workshop: Workshop,
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void,
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>,
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
  return (
    <CoachesStep
      workshop={workshop}
      setWorkshop={setWorkshop}
      errors={errors}
      onFieldChange={(errorKey) => markFieldChanged(5, errorKey)}
    />
  )
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function isImageUpload(file: File) {
  return (
    file.type.startsWith("image/") ||
    /\.(avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i.test(file.name)
  )
}

function isFontUpload(file: File) {
  return /\.(otf|ttf|woff2?)$/i.test(file.name)
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
  workshop: Workshop
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void
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
              className={inputClassName}
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
                className={cn("w-full", inputClassName)}
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
              className={inputClassName}
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
              className={inputClassName}
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
              className={textareaClassName}
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
              className={textareaClassName}
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

function ThemeStep({
  workshop,
  update,
  errors,
  activeTab,
  onTabChange,
}: {
  workshop: Workshop
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void
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
        className="mb-6 grid w-full grid-cols-3 border-b border-border group-data-horizontal/tabs:h-10!"
      >
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="fonts">fonts</TabsTrigger>
      </TabsList>

      <TabsContent value="colors">
        <section aria-labelledby="theme-colors-heading">
          <FormSectionHeader
            id="theme-colors-heading"
            title="Brand colors"
            description="Set the core palette used throughout the workshop."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorPickerField
              id="workshop-primary-color"
              errorKey="primaryColor"
              label="Primary color"
              value={workshop.primaryColor}
              onChange={(value) => update("primaryColor", value)}
              error={errors.primaryColor}
            />
            <ColorPickerField
              id="workshop-secondary-color"
              errorKey="secondaryColor"
              label="Secondary color"
              value={workshop.secondaryColor}
              onChange={(value) => update("secondaryColor", value)}
              error={errors.secondaryColor}
            />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="assets">
        <section aria-labelledby="theme-assets-heading">
          <FormSectionHeader
            id="theme-assets-heading"
            title="Workshop artwork"
            description="Upload the logo and background treatments participants will see."
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5">
            <FileField
              id="workshop-logo"
              errorKey="logo"
              label="Logo"
              description="Image file; transparent artwork works best."
              value={workshop.logo}
              onChange={(file) => update("logo", file)}
              error={errors.logo}
            />
            <FileField
              id="workshop-portrait"
              errorKey="portrait"
              label="Background portrait"
              description="Image file for portrait-oriented screens."
              value={workshop.portrait}
              onChange={(file) => update("portrait", file)}
              error={errors.portrait}
            />
            <FileField
              id="workshop-landscape"
              errorKey="landscape"
              label="Background landscape"
              description="Image file for landscape-oriented screens."
              value={workshop.landscape}
              onChange={(file) => update("landscape", file)}
              error={errors.landscape}
            />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="fonts">
        <section aria-labelledby="theme-fonts-heading">
          <FormSectionHeader
            id="theme-fonts-heading"
            title="Workshop type"
            description="Provide separate display and reading fonts for the workshop interface."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FileField
              id="workshop-heading-font"
              errorKey="headingFont"
              label="Heading font"
              description="WOFF, WOFF2, TTF, or OTF."
              value={workshop.headingFont}
              onChange={(file) => update("headingFont", file)}
              error={errors.headingFont}
              accept=".woff,.woff2,.ttf,.otf"
              preview="file"
            />
            <FileField
              id="workshop-body-font"
              errorKey="bodyFont"
              label="Body font"
              description="WOFF, WOFF2, TTF, or OTF."
              value={workshop.bodyFont}
              onChange={(file) => update("bodyFont", file)}
              error={errors.bodyFont}
              accept=".woff,.woff2,.ttf,.otf"
              preview="file"
            />
          </div>
        </section>
      </TabsContent>
    </Tabs>
  )
}

function ColorPickerField({
  id,
  errorKey,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  errorKey: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)

  const commitHex = (input: string) => {
    const normalized = input.trim().startsWith("#")
      ? input.trim()
      : `#${input.trim()}`
    onChange(isHexColor(normalized) ? normalized.toUpperCase() : input)
  }

  const handlePickerChange = (nextValue: string) => {
    onChange(nextValue.toUpperCase())
  }

  const pickerColor = isHexColor(value) ? value : "#000000"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Field data-invalid={!!error} data-error-key={errorKey}>
        <FieldLabel htmlFor={`${id}-hex`}>{label}</FieldLabel>
        <div className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)] border border-input focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 sm:h-10">
          <PopoverTrigger
            aria-label={`Choose ${label.toLowerCase()}`}
            className="border-r border-input outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-ring"
            style={{ backgroundColor: pickerColor }}
          />
          <Input
            id={`${id}-hex`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={(event) => commitHex(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitHex(event.currentTarget.value)
              }
            }}
            aria-invalid={!!error}
            aria-required="true"
            aria-describedby={error ? `${id}-error` : undefined}
            data-error-control
            className="h-full border-0 px-3 text-base uppercase shadow-none focus-visible:ring-0 sm:text-sm md:text-sm"
          />
        </div>
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </Field>
      <PopoverContent
        sideOffset={8}
        aria-label={`${label} picker`}
        className="w-fit border border-border bg-popover p-3 text-popover-foreground shadow-md"
      >
        <div className="color-picker-layout">
          <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
        </div>
      </PopoverContent>
    </Popover>
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
        aria-required="true"
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="relative flex min-h-24 items-center gap-3 border border-input p-3 pr-12">
          <div className="flex size-16 shrink-0 items-center justify-center bg-muted p-1">
            {preview === "image" ? (
              <FilePreview
                key={`${value.name}-${value.lastModified}-${value.size}`}
                file={value}
              />
            ) : (
              <FileIcon className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" title={value.name}>
              {value.name}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {(value.size / 1024).toFixed(0)} KB
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

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
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
  workshop: Workshop
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
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
                      className={inputClassName}
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
                      className={textareaClassName}
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
  workshop: Workshop
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
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
                      className={inputClassName}
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
                      className={textareaClassName}
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
  workshop: Workshop
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
  errors: Record<string, string>
  onFieldChange: (errorKey?: string | string[]) => void
}) {
  const pendingFocusId = useRef<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

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

      <div className="grid gap-4">
        {workshop.walkthroughMessages.map((message, index) => {
          const titleKey = `walkthrough-${message.id}-title`
          const descriptionKey = `walkthrough-${message.id}-description`

          return (
            <fieldset key={message.id}>
              <legend className="sr-only">
                Walkthrough message {index + 1}
              </legend>
              <Card size="sm" className="gap-0 py-0">
                <CardHeader className="border-b border-border py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center bg-primary text-[11px] font-semibold text-primary-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <CardTitle>
                        <h3 className="truncate">
                          {message.title || `Message ${index + 1}`}
                        </h3>
                      </CardTitle>
                      <CardDescription>Walkthrough message</CardDescription>
                    </div>
                  </div>
                  {workshop.walkthroughMessages.length > 1 && (
                    <CardAction>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="size-10 sm:size-8"
                        aria-label={`Remove ${message.title || `message ${index + 1}`}`}
                        onClick={() => removeMessage(message.id)}
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
                    <FieldLabel htmlFor={`${message.id}-title`}>
                      Title
                    </FieldLabel>
                    <Input
                      id={`${message.id}-title`}
                      ref={(node) => {
                        if (!node || pendingFocusId.current !== message.id)
                          return
                        pendingFocusId.current = null
                        node.focus()
                      }}
                      value={message.title}
                      onChange={(event) =>
                        change(message.id, "title", event.target.value)
                      }
                      placeholder="e.g. Choose your team"
                      aria-invalid={!!errors[titleKey]}
                      aria-required="true"
                      aria-describedby={
                        errors[titleKey]
                          ? `${message.id}-title-error`
                          : undefined
                      }
                      data-error-control
                      className={inputClassName}
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
                        change(message.id, "description", event.target.value)
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
                      className={textareaClassName}
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
          )
        })}
      </div>

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

function CoachesStep({
  workshop,
  setWorkshop,
  errors,
  onFieldChange,
}: {
  workshop: Workshop
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
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
                      ])
                    }
                  />
                </CardAction>
              </CardHeader>

              <CardContent className="grid gap-5 py-4">
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
                    className={inputClassName}
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
                    className={inputClassName}
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
                    className={textareaClassName}
                  />
                  {errors[descriptionKey] && (
                    <FieldError id={`${coach.id}-description-error`}>
                      {errors[descriptionKey]}
                    </FieldError>
                  )}
                </Field>

                <fieldset disabled={!coach.enabled}>
                  <legend className="mb-2 text-xs font-medium">
                    Choose avatar
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {presetAvatars.map((avatar, avatarIndex) => (
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
