import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { createFileRoute, Link } from "@tanstack/react-router"
import { HexAlphaColorPicker } from "react-colorful"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  FileIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

export const Route = createFileRoute("/app/workshops/new")({
  component: RouteComponent,
})

type Upload = File | null
type ColorValue = { hex: string; alpha: number }
type ThemeTab = "colors" | "assets" | "fonts"

type Pillar = { id: string; title: string; context: string }
type Team = {
  id: string
  name: string
  color: ColorValue
  thumbnail: Upload
  description: string
  passcode: string
}
type Coach = { id: string; name: string; avatar: string; enabled: boolean }

type Workshop = {
  title: string
  assignee: string
  brand: string
  subtitle: string
  context: string
  guidelines: string
  primaryColor: ColorValue
  secondaryColor: ColorValue
  logo: Upload
  portrait: Upload
  landscape: Upload
  headingFont: Upload
  bodyFont: Upload
  pillars: Pillar[]
  teams: Team[]
  usePasscode: boolean
  coaches: Coach[]
}

const steps = [
  { title: "Identity", description: "Set the workshop foundation" },
  { title: "Theme", description: "Shape the visual direction" },
  { title: "Pillars", description: "Define the areas of focus" },
  { title: "Teams", description: "Set up participant groups" },
  { title: "Coaches", description: "Configure workshop coaches" },
]

const dummyUsers = [
  "Koushik Bharati",
  "Alex Morgan",
  "Jordan Lee",
  "Sam Taylor",
]
const dummyAvatars = [
  "https://i.pravatar.cc/160?img=12",
  "https://i.pravatar.cc/160?img=32",
  "https://i.pravatar.cc/160?img=47",
  "https://i.pravatar.cc/160?img=56",
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
  primaryColor: { hex: "#111111", alpha: 100 },
  secondaryColor: { hex: "#d9ff00", alpha: 100 },
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
      color: { hex: "#d9ff00", alpha: 100 },
      thumbnail: null,
      description: "",
      passcode: "",
    },
  ],
  usePasscode: false,
  coaches: ["Maya", "Chris", "Robin", "Taylor"].map((name, index) => ({
    id: `coach-${index + 1}`,
    name,
    avatar: dummyAvatars[index],
    enabled: true,
  })),
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
    if (!isHexColor(workshop.primaryColor.hex))
      nextErrors.primaryColor = "Enter a valid hex color."
    if (!isHexColor(workshop.secondaryColor.hex))
      nextErrors.secondaryColor = "Enter a valid hex color."
    for (const [field, label] of [
      ["logo", "Logo"],
      ["portrait", "Background portrait"],
      ["landscape", "Background landscape"],
      ["headingFont", "Heading font"],
      ["bodyFont", "Body font"],
    ] as const) {
      if (!workshop[field]) nextErrors[field] = `${label} is required.`
    }
  }

  if (step === 2) {
    if (!workshop.pillars.length)
      nextErrors.pillars = "Add at least one pillar."
    workshop.pillars.forEach((pillar) => {
      if (!pillar.title.trim())
        nextErrors[`pillar-${pillar.id}-title`] = "Title is required."
      if (!pillar.context.trim())
        nextErrors[`pillar-${pillar.id}-context`] = "Context is required."
    })
  }

  if (step === 3) {
    if (!workshop.teams.length) nextErrors.teams = "Add at least one team."
    workshop.teams.forEach((team) => {
      if (!team.name.trim())
        nextErrors[`team-${team.id}-name`] = "Name is required."
      if (!team.description.trim())
        nextErrors[`team-${team.id}-description`] = "Description is required."
      if (!team.thumbnail)
        nextErrors[`team-${team.id}-thumbnail`] = "Thumbnail is required."
      if (!isHexColor(team.color.hex))
        nextErrors[`team-${team.id}-color`] = "Enter a valid hex color."
      if (workshop.usePasscode && !/^\d{4}$/.test(team.passcode))
        nextErrors[`team-${team.id}-passcode`] = "Enter exactly four digits."
    })
  }

  if (step === 4)
    workshop.coaches.forEach((coach) => {
      if (coach.enabled && !coach.name.trim())
        nextErrors[`coach-${coach.id}-name`] = "Name is required."
    })

  return nextErrors
}

function getThemeTabForErrors(errors: Record<string, string>): ThemeTab {
  if (errors.primaryColor || errors.secondaryColor) return "colors"
  if (errors.logo || errors.portrait || errors.landscape) return "assets"
  return "fonts"
}

function RouteComponent() {
  const [workshop, setWorkshop] = useState(initialWorkshop)
  const [activeStep, setActiveStep] = useState(0)
  const [highestReached, setHighestReached] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeThemeTab, setActiveThemeTab] = useState<ThemeTab>("colors")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorFocusKey, setErrorFocusKey] = useState<string | null>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const hasNavigated = useRef(false)

  useEffect(() => {
    if (!hasNavigated.current) {
      hasNavigated.current = true
      return
    }
    stepHeadingRef.current?.focus({ preventScroll: true })
  }, [activeStep])

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

  const markFieldChanged = (step: number, errorKey?: string) => {
    setCompletedSteps((current) => current.filter((item) => item !== step))
    setErrors((current) => {
      if (!errorKey) return {}
      if (!(errorKey in current)) return current
      const nextErrors = { ...current }
      delete nextErrors[errorKey]
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
    setActiveStep(step)
  }

  const next = () => {
    if (!validateStep(activeStep)) return
    const nextStep = Math.min(activeStep + 1, steps.length - 1)
    setHighestReached((current) => Math.max(current, nextStep))
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
    <div className="@container/wizard mx-auto w-full max-w-6xl pb-4">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-3 -ml-2 text-muted-foreground"
            render={<Link to="/app/workshops" />}
          >
            <ArrowLeftIcon />
            Back to workshops
          </Button>
          <p className="mb-1 text-xs font-medium tracking-[0.16em] text-primary uppercase">
            Workshop builder
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Create a new workshop
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Set the workshop foundation, visual system, participant groups, and
            coaching team.
          </p>
        </div>
        <Badge variant="outline" className="h-6 self-start sm:self-auto">
          5-step setup
        </Badge>
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
                <span className="size-1 bg-primary" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">
                  All fields in this step are required unless noted
                </span>
              </div>
              <h2
                ref={stepHeadingRef}
                tabIndex={-1}
                className="text-xl font-semibold tracking-tight outline-none"
              >
                {steps[activeStep].title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {steps[activeStep].description}
              </p>

              {errorCount > 0 && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Fix {errorCount} {errorCount === 1 ? "field" : "fields"} to
                    continue. The first issue has been focused.
                  </p>
                </div>
              )}
            </header>

            <div className="min-h-[30rem] px-5 py-6 sm:px-7 sm:py-8">
              {renderStep(
                activeStep,
                workshop,
                update,
                setWorkshop,
                errors,
                activeThemeTab,
                setActiveThemeTab,
                markFieldChanged
              )}
            </div>

            <div className="sticky bottom-0 z-20 flex gap-3 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-sm supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-between sm:px-7">
              <Button
                type="button"
                variant="outline"
                disabled={activeStep === 0}
                onClick={() => goToStep(activeStep - 1)}
                className="h-11 flex-1 sm:h-10 sm:min-w-28 sm:flex-none"
              >
                <ArrowLeftIcon />
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  type="button"
                  className="h-11 flex-1 sm:h-10 sm:min-w-40 sm:flex-none"
                  onClick={next}
                >
                  Continue
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-11 flex-1 sm:h-10 sm:min-w-40 sm:flex-none"
                >
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
        <ol className="grid grid-cols-5">
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
        <ol className="relative space-y-1 before:absolute before:top-5 before:bottom-5 before:left-[15px] before:w-px before:bg-border">
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
                    "group flex w-full items-start gap-3 px-1 py-2 text-left text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-45",
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
                    <span className="mt-0.5 block text-xs/relaxed font-normal opacity-75">
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
  markFieldChanged: (step: number, errorKey?: string) => void
) {
  if (step === 0)
    return <IdentityStep workshop={workshop} update={update} errors={errors} />
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
  return (
    <CoachesStep
      workshop={workshop}
      setWorkshop={setWorkshop}
      errors={errors}
      onFieldChange={(errorKey) => markFieldChanged(4, errorKey)}
    />
  )
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function createItemId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

function toPickerColor(value: ColorValue) {
  const alpha = Math.round((value.alpha / 100) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${value.hex}${alpha}`
}

function fromPickerColor(value: string): ColorValue {
  return {
    hex: value.slice(0, 7).toUpperCase(),
    alpha: Math.round((parseInt(value.slice(7, 9), 16) / 255) * 100),
  }
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
}: {
  workshop: Workshop
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void
  errors: Record<string, string>
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
                {dummyUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
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
  const colorErrorCount =
    Number(!!errors.primaryColor) + Number(!!errors.secondaryColor)
  const assetErrorCount =
    Number(!!errors.logo) +
    Number(!!errors.portrait) +
    Number(!!errors.landscape)
  const fontErrorCount =
    Number(!!errors.headingFont) + Number(!!errors.bodyFont)
  const colorsComplete =
    isHexColor(workshop.primaryColor.hex) &&
    isHexColor(workshop.secondaryColor.hex)
  const assetsComplete = !!(
    workshop.logo &&
    workshop.portrait &&
    workshop.landscape
  )
  const fontsComplete = !!(workshop.headingFont && workshop.bodyFont)

  return (
    <div className="space-y-6">
      <section
        aria-label="Live workshop theme preview"
        className="grid overflow-hidden border border-border sm:grid-cols-[minmax(0,1fr)_13rem]"
      >
        <div
          className="flex min-h-36 flex-col justify-between p-5 transition-colors"
          style={{
            backgroundColor: isHexColor(workshop.primaryColor.hex)
              ? toPickerColor(workshop.primaryColor)
              : "var(--muted)",
            color: isHexColor(workshop.secondaryColor.hex)
              ? toPickerColor(workshop.secondaryColor)
              : "var(--foreground)",
          }}
        >
          <div className="flex min-h-8 items-start justify-between gap-4">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase">
              {workshop.brand || "Your brand"}
            </p>
            {workshop.logo && (
              <div className="flex size-10 items-center justify-center border border-current/20 bg-white/90 p-1">
                <FilePreview
                  key={`${workshop.logo.name}-${workshop.logo.lastModified}-${workshop.logo.size}`}
                  file={workshop.logo}
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight sm:text-xl">
              {workshop.title || "Workshop title"}
            </p>
            <p className="mt-1 max-w-md text-xs opacity-80">
              {workshop.subtitle ||
                "Your supporting workshop line appears here."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-border bg-background sm:grid-cols-1 sm:border-t-0 sm:border-l">
          {[
            ["Primary", workshop.primaryColor],
            ["Secondary", workshop.secondaryColor],
          ].map(([label, color]) => {
            const value = color as ColorValue
            return (
              <div
                key={label as string}
                className="flex items-center gap-3 border-r border-border p-3 last:border-r-0 sm:border-r-0 sm:border-b sm:last:border-b-0"
              >
                <span
                  className="size-7 shrink-0 border border-foreground/15"
                  style={{
                    backgroundColor: isHexColor(value.hex)
                      ? toPickerColor(value)
                      : "transparent",
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {label as string}
                  </span>
                  <span className="block truncate text-xs font-medium uppercase">
                    {value.hex}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as ThemeTab)}
      >
        <TabsList
          variant="line"
          aria-label="Theme sections"
          className="mb-6 grid h-auto w-full grid-cols-3 border-b border-border p-0"
        >
          <TabsTrigger value="colors" className="h-10">
            <ThemeTabLabel
              label="Colors"
              complete={colorsComplete}
              errorCount={colorErrorCount}
            />
          </TabsTrigger>
          <TabsTrigger value="assets" className="h-10">
            <ThemeTabLabel
              label="Assets"
              complete={assetsComplete}
              errorCount={assetErrorCount}
            />
          </TabsTrigger>
          <TabsTrigger value="fonts" className="h-10">
            <ThemeTabLabel
              label="Fonts"
              complete={fontsComplete}
              errorCount={fontErrorCount}
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <section aria-labelledby="theme-colors-heading">
            <FormSectionHeader
              id="theme-colors-heading"
              title="Brand colors"
              description="Set the core palette and transparency used throughout the workshop."
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
    </div>
  )
}

function ThemeTabLabel({
  label,
  complete,
  errorCount,
}: {
  label: string
  complete: boolean
  errorCount: number
}) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {errorCount > 0 ? (
        <span className="flex size-4 items-center justify-center bg-destructive text-[10px] font-semibold text-white">
          {errorCount}
          <span className="sr-only"> errors</span>
        </span>
      ) : complete ? (
        <CheckIcon className="size-3.5 text-primary" aria-label="Complete" />
      ) : null}
    </span>
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
  value: ColorValue
  onChange: (value: ColorValue) => void
  error?: string
}) {
  const [draftHex, setDraftHex] = useState(value.hex)
  const [open, setOpen] = useState(false)
  const [touched, setTouched] = useState(false)

  const updateHex = (hex: string) => {
    onChange({ ...value, hex })
    setDraftHex(hex)
  }

  const commitHex = (input: string) => {
    const normalized = input.trim().startsWith("#")
      ? input.trim()
      : `#${input.trim()}`
    updateHex(isHexColor(normalized) ? normalized.toUpperCase() : input)
  }

  const handlePickerChange = (nextValue: string) => {
    const nextColor = fromPickerColor(nextValue)
    onChange(nextColor)
    setDraftHex(nextColor.hex)
  }

  const normalizedDraft = draftHex.trim().startsWith("#")
    ? draftHex.trim()
    : `#${draftHex.trim()}`
  const displayedError =
    error ??
    (touched && !isHexColor(normalizedDraft)
      ? "Use a six-digit hex value."
      : undefined)
  const pickerColor = isHexColor(value.hex)
    ? value
    : { hex: "#000000", alpha: value.alpha }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Field data-invalid={!!displayedError} data-error-key={errorKey}>
        <FieldLabel htmlFor={`${id}-hex`}>{label}</FieldLabel>
        <div className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)_4.75rem] border border-input focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 sm:h-10">
          <PopoverTrigger
            aria-label={`Choose ${label.toLowerCase()}`}
            className="relative overflow-hidden border-r border-input outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-ring"
            style={{
              backgroundColor: "var(--muted)",
              backgroundImage:
                "linear-gradient(45deg, color-mix(in oklch, var(--foreground) 10%, transparent) 25%, transparent 25%), linear-gradient(-45deg, color-mix(in oklch, var(--foreground) 10%, transparent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, color-mix(in oklch, var(--foreground) 10%, transparent) 75%), linear-gradient(-45deg, transparent 75%, color-mix(in oklch, var(--foreground) 10%, transparent) 75%)",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              backgroundSize: "8px 8px",
            }}
          >
            <span
              className="absolute inset-0"
              style={{
                backgroundColor: isHexColor(value.hex)
                  ? value.hex
                  : "transparent",
                opacity: value.alpha / 100,
              }}
            />
          </PopoverTrigger>
          <Input
            id={`${id}-hex`}
            value={draftHex}
            onChange={(event) => {
              setDraftHex(event.target.value)
              onChange({ ...value, hex: event.target.value })
            }}
            onBlur={(event) => {
              setTouched(true)
              commitHex(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                setTouched(true)
                commitHex(event.currentTarget.value)
              }
            }}
            aria-invalid={!!displayedError}
            aria-required="true"
            aria-describedby={displayedError ? `${id}-error` : undefined}
            data-error-control
            className="h-full border-0 px-3 text-base uppercase shadow-none focus-visible:ring-0 sm:text-sm md:text-sm"
          />
          <div className="flex min-w-0 items-center border-l border-input">
            <Input
              type="number"
              min={0}
              max={100}
              value={value.alpha}
              onChange={(event) => {
                const alpha = Number(event.target.value)
                if (Number.isNaN(alpha)) return
                onChange({ ...value, alpha: Math.min(100, Math.max(0, alpha)) })
              }}
              aria-label={`${label} opacity percentage`}
              className="h-full min-w-0 border-0 px-2 text-right text-base shadow-none focus-visible:ring-0 sm:text-sm md:text-sm"
            />
            <span className="pr-2 text-xs text-muted-foreground">%</span>
          </div>
        </div>
        {displayedError && (
          <FieldError id={`${id}-error`}>{displayedError}</FieldError>
        )}
      </Field>
      <PopoverContent
        sideOffset={8}
        aria-label={`${label} picker`}
        className="w-fit border border-border bg-popover p-3 text-popover-foreground shadow-md"
      >
        <div className="color-picker-layout">
          <HexAlphaColorPicker
            color={toPickerColor(pickerColor)}
            onChange={handlePickerChange}
          />
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
        accept={accept}
        aria-invalid={!!error}
        aria-required="true"
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="flex min-h-24 items-center gap-3 border border-input p-3">
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
            <div className="mt-2 flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-error-control
                onClick={selectFile}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${label.toLowerCase()}`}
                onClick={removeFile}
              >
                <XIcon />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          data-error-control
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
  onFieldChange: (errorKey?: string) => void
}) {
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!pendingFocusId) return
    document.getElementById(`${pendingFocusId}-title`)?.focus()
    setPendingFocusId(null)
  }, [pendingFocusId, workshop.pillars])

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
    setWorkshop((current) => ({
      ...current,
      pillars: [...current.pillars, { id, title: "", context: "" }],
    }))
    onFieldChange()
    setPendingFocusId(id)
  }

  const removePillar = (id: string) => {
    setWorkshop((current) => ({
      ...current,
      pillars: current.pillars.filter((pillar) => pillar.id !== id),
    }))
    onFieldChange()
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
      {errors.pillars && <FieldError>{errors.pillars}</FieldError>}
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
  onFieldChange: (errorKey?: string) => void
}) {
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!pendingFocusId) return
    document.getElementById(`${pendingFocusId}-name`)?.focus()
    setPendingFocusId(null)
  }, [pendingFocusId, workshop.teams])

  const change = (
    id: string,
    field: keyof Omit<Team, "id">,
    value: string | Upload | ColorValue
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
    setWorkshop((current) => ({
      ...current,
      teams: [
        ...current.teams,
        {
          id,
          name: "",
          color: { hex: "#d9ff00", alpha: 100 },
          thumbnail: null,
          description: "",
          passcode: "",
        },
      ],
    }))
    onFieldChange()
    setPendingFocusId(id)
  }

  const removeTeam = (id: string) => {
    setWorkshop((current) => ({
      ...current,
      teams: current.teams.filter((team) => team.id !== id),
    }))
    onFieldChange()
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
            aria-describedby="team-passcode-description"
          />
        </label>
      </div>

      {errors.teams && <FieldError>{errors.teams}</FieldError>}
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
                        backgroundColor: isHexColor(team.color.hex)
                          ? toPickerColor(team.color)
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
                        pattern="[0-9]*"
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

function CoachesStep({
  workshop,
  setWorkshop,
  errors,
  onFieldChange,
}: {
  workshop: Workshop
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
  errors: Record<string, string>
  onFieldChange: (errorKey?: string) => void
}) {
  const changeCoach = (
    id: string,
    changes: Partial<Coach>,
    errorKey?: string
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
                  <img
                    src={coach.avatar}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <CardTitle>
                      <h3 className="truncate">Coach {index + 1}</h3>
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
                    onCheckedChange={(enabled) =>
                      changeCoach(coach.id, { enabled }, nameKey)
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
                  <FieldLabel htmlFor={`${coach.id}-name`}>
                    Coach name
                  </FieldLabel>
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

                <fieldset disabled={!coach.enabled}>
                  <legend className="mb-2 text-xs font-medium">
                    Choose avatar
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {dummyAvatars.map((avatar, avatarIndex) => (
                      <button
                        type="button"
                        key={avatar}
                        aria-pressed={coach.avatar === avatar}
                        aria-label={`Use avatar ${avatarIndex + 1} for ${coach.name || `coach ${index + 1}`}`}
                        onClick={() => changeCoach(coach.id, { avatar })}
                        className={cn(
                          "size-10 rounded-full border-2 border-transparent p-0.5 transition-all outline-none hover:opacity-80 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                          coach.avatar === avatar && "border-primary"
                        )}
                      >
                        <img
                          src={avatar}
                          alt=""
                          className="size-full rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <section
        aria-labelledby="workshop-summary-heading"
        className="border border-border bg-muted/25"
      >
        <div className="border-b border-border px-4 py-3">
          <h3 id="workshop-summary-heading" className="text-sm font-semibold">
            Ready to review
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Creating the workshop will use the configuration from all five
            steps.
          </p>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-border">
          {[
            ["Pillars", workshop.pillars.length],
            ["Teams", workshop.teams.length],
            ["Coaches", enabledCoaches],
          ].map(([label, count]) => (
            <div key={label} className="px-3 py-4 text-center">
              <dd className="text-lg font-semibold">{count}</dd>
              <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
