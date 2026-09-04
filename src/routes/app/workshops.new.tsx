import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createFileRoute } from "@tanstack/react-router"
import { HexAlphaColorPicker } from "react-colorful"
import {
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

type Pillar = { title: string; context: string }
type Team = {
  name: string
  color: ColorValue
  thumbnail: Upload
  description: string
  passcode: string
}
type Coach = { name: string; avatar: string; enabled: boolean }

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
  pillars: [{ title: "", context: "" }],
  teams: [
    {
      name: "",
      color: { hex: "#d9ff00", alpha: 100 },
      thumbnail: null,
      description: "",
      passcode: "",
    },
  ],
  usePasscode: false,
  coaches: ["Maya", "Chris", "Robin", "Taylor"].map((name, index) => ({
    name,
    avatar: dummyAvatars[index],
    enabled: true,
  })),
}

function RouteComponent() {
  const [workshop, setWorkshop] = useState(initialWorkshop)
  const [activeStep, setActiveStep] = useState(0)
  const [activeThemeTab, setActiveThemeTab] = useState<ThemeTab>("colors")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = <K extends keyof Workshop>(field: K, value: Workshop[K]) => {
    setWorkshop((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: "" }))
  }

  const validateStep = (step: number) => {
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

      if (nextErrors.primaryColor || nextErrors.secondaryColor)
        setActiveThemeTab("colors")
      else if (nextErrors.logo || nextErrors.portrait || nextErrors.landscape)
        setActiveThemeTab("assets")
      else if (nextErrors.headingFont || nextErrors.bodyFont)
        setActiveThemeTab("fonts")
    }
    if (step === 2) {
      if (!workshop.pillars.length)
        nextErrors.pillars = "Add at least one pillar."
      workshop.pillars.forEach((pillar, index) => {
        if (!pillar.title.trim())
          nextErrors[`pillar-${index}-title`] = "Title is required."
        if (!pillar.context.trim())
          nextErrors[`pillar-${index}-context`] = "Context is required."
      })
    }
    if (step === 3) {
      if (!workshop.teams.length) nextErrors.teams = "Add at least one team."
      workshop.teams.forEach((team, index) => {
        if (!team.name.trim())
          nextErrors[`team-${index}-name`] = "Name is required."
        if (!team.description.trim())
          nextErrors[`team-${index}-description`] = "Description is required."
        if (!team.thumbnail)
          nextErrors[`team-${index}-thumbnail`] = "Thumbnail is required."
        if (!isHexColor(team.color.hex))
          nextErrors[`team-${index}-color`] = "Enter a valid hex color."
      })
      if (workshop.usePasscode)
        workshop.teams.forEach((team, index) => {
          if (!/^\d{4}$/.test(team.passcode))
            nextErrors[`team-${index}-passcode`] = "Enter exactly four digits."
        })
    }
    if (step === 4)
      workshop.coaches.forEach((coach, index) => {
        if (!coach.name.trim())
          nextErrors[`coach-${index}`] = "Name is required."
      })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    if (validateStep(activeStep))
      setActiveStep((step) => Math.min(step + 1, steps.length - 1))
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (validateStep(activeStep)) console.log("New workshop", workshop)
  }

  return (
    <div className="w-full max-w-5xl">
      <header className="mb-8 shrink-0">
        <h1 className="text-2xl font-bold">New Workshop</h1>
        <p className="text-sm text-muted-foreground">
          Build a workshop by switching things on.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[220px_auto_minmax(0,1fr)]">
        <nav aria-label="Workshop creation steps">
          <ol className="relative space-y-2 before:absolute before:top-6 before:bottom-6 before:left-5 before:w-px before:bg-border">
            {steps.map((step, index) => {
              const isActive = index === activeStep
              const isComplete = index < activeStep
              const isAvailable = index <= activeStep

              return (
                <li key={step.title} className="relative">
                  <button
                    type="button"
                    aria-current={isActive ? "step" : undefined}
                    disabled={!isAvailable}
                    onClick={() => setActiveStep(index)}
                    className={`group flex w-full items-start gap-3 p-2 text-left transition-colors disabled:cursor-not-allowed ${
                      isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-[10px] font-medium drop-shadow-xs ${
                        isActive
                          ? "bg-primary text-primary-foreground ring-2 ring-primary"
                          : isComplete
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                      }`}
                    >
                      {isComplete ? (
                        <CheckIcon className="size-3" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-xs font-medium">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-[11px] opacity-75">
                        {step.description}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <Separator orientation="vertical" className="hidden h-full md:block" />

        <form onSubmit={submit} className="flex min-w-0 flex-col">
          <header className="shrink-0">
            <h2 className="font-semibold">
              Step {activeStep + 1}: {steps[activeStep].title}
            </h2>

            <p className="text-sm text-muted-foreground">
              {steps[activeStep].description}
            </p>
          </header>

          <div className="py-6 pr-2 pl-0.5">
            {renderStep(
              activeStep,
              workshop,
              update,
              setWorkshop,
              errors,
              activeThemeTab,
              setActiveThemeTab
            )}
          </div>

          <div className="flex shrink-0 justify-between gap-2 bg-background">
            <Button
              type="button"
              variant="outline"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((step) => step - 1)}
            >
              Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button type="button" className="min-w-40" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="submit" className="min-w-40">
                <CheckIcon />
                Create workshop
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function renderStep(
  step: number,
  workshop: Workshop,
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void,
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>,
  errors: Record<string, string>,
  activeThemeTab: ThemeTab,
  setActiveThemeTab: React.Dispatch<React.SetStateAction<ThemeTab>>
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
      />
    )
  if (step === 3)
    return (
      <TeamsStep
        workshop={workshop}
        update={update}
        setWorkshop={setWorkshop}
        errors={errors}
      />
    )
  return (
    <CoachesStep
      workshop={workshop}
      setWorkshop={setWorkshop}
      errors={errors}
    />
  )
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
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
    <div className="grid grid-cols-2 gap-5">
      <Field data-invalid={!!errors.title}>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={workshop.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Workshop title"
        />
        {errors.title && <FieldError>{errors.title}</FieldError>}
      </Field>
      <Field data-invalid={!!errors.assignee}>
        <FieldLabel>Assignee</FieldLabel>
        <Select
          value={workshop.assignee}
          onValueChange={(value) => update("assignee", value ?? "")}
        >
          <SelectTrigger className="w-full">
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
        {errors.assignee && <FieldError>{errors.assignee}</FieldError>}
      </Field>
      <Field data-invalid={!!errors.brand}>
        <FieldLabel>Brand</FieldLabel>
        <Input
          value={workshop.brand}
          onChange={(event) => update("brand", event.target.value)}
          placeholder="Brand name"
        />
        {errors.brand && <FieldError>{errors.brand}</FieldError>}
      </Field>
      <Field data-invalid={!!errors.subtitle}>
        <FieldLabel>Subtitle</FieldLabel>
        <Input
          value={workshop.subtitle}
          onChange={(event) => update("subtitle", event.target.value)}
          placeholder="A short supporting line"
        />
        {errors.subtitle && <FieldError>{errors.subtitle}</FieldError>}
      </Field>
      <Field data-invalid={!!errors.context}>
        <FieldLabel>Workshop context</FieldLabel>
        <Textarea
          value={workshop.context}
          onChange={(event) => update("context", event.target.value)}
          placeholder="What should participants know?"
        />
        {errors.context && <FieldError>{errors.context}</FieldError>}
      </Field>
      <Field data-invalid={!!errors.guidelines}>
        <FieldLabel>Brand guidelines</FieldLabel>
        <Textarea
          value={workshop.guidelines}
          onChange={(event) => update("guidelines", event.target.value)}
          placeholder="Tone, do's and don'ts, or visual guidance"
        />
        {errors.guidelines && <FieldError>{errors.guidelines}</FieldError>}
      </Field>
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
      <TabsList variant="line" className="mb-4">
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="fonts">Fonts</TabsTrigger>
      </TabsList>

      <TabsContent value="colors">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorPickerField
            label="Primary color"
            value={workshop.primaryColor}
            onChange={(value) => update("primaryColor", value)}
            error={errors.primaryColor}
          />
          <ColorPickerField
            label="Secondary color"
            value={workshop.secondaryColor}
            onChange={(value) => update("secondaryColor", value)}
            error={errors.secondaryColor}
          />
        </div>
      </TabsContent>

      <TabsContent value="assets">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FileField
            label="Logo"
            value={workshop.logo}
            onChange={(file) => update("logo", file)}
            error={errors.logo}
          />
          <FileField
            label="Background portrait"
            value={workshop.portrait}
            onChange={(file) => update("portrait", file)}
            error={errors.portrait}
          />
          <FileField
            label="Background landscape"
            value={workshop.landscape}
            onChange={(file) => update("landscape", file)}
            error={errors.landscape}
          />
        </div>
      </TabsContent>

      <TabsContent value="fonts">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FileField
            label="Heading font"
            value={workshop.headingFont}
            onChange={(file) => update("headingFont", file)}
            error={errors.headingFont}
            accept=".woff,.woff2,.ttf,.otf"
            preview="file"
          />
          <FileField
            label="Body font"
            value={workshop.bodyFont}
            onChange={(file) => update("bodyFont", file)}
            error={errors.bodyFont}
            accept=".woff,.woff2,.ttf,.otf"
            preview="file"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function ColorPickerField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: ColorValue
  onChange: (value: ColorValue) => void
  error?: string
}) {
  const [draftHex, setDraftHex] = useState(value.hex)
  const [open, setOpen] = useState(false)

  const updateHex = (hex: string) => {
    onChange({ ...value, hex })
    setDraftHex(hex)
  }

  const commitHex = (input: string) => {
    const normalized = input.trim().startsWith("#")
      ? input.trim()
      : `#${input.trim()}`
    if (isHexColor(normalized)) updateHex(normalized.toUpperCase())
    else setDraftHex(input)
  }

  const handlePickerChange = (nextValue: string) => {
    const nextColor = fromPickerColor(nextValue)
    onChange(nextColor)
    setDraftHex(nextColor.hex)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Field data-invalid={!!error}>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex h-8 items-center gap-2 border border-input px-2">
          <PopoverTrigger
            aria-label={`Choose ${label.toLowerCase()}`}
            className="size-5 shrink-0 border border-foreground/20"
            style={{
              backgroundColor: value.hex,
              opacity: value.alpha / 100,
            }}
          />
          <Input
            aria-label={`${label} hex value`}
            value={draftHex}
            onChange={(event) => setDraftHex(event.target.value)}
            onBlur={(event) => commitHex(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitHex(event.currentTarget.value)
            }}
            className="h-7 border-0 px-0 uppercase shadow-none focus-visible:ring-0"
          />
          <span className="text-xs text-muted-foreground">{value.alpha}%</span>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <PopoverContent
        sideOffset={8}
        className="w-fit border border-border bg-popover p-3 text-popover-foreground shadow-md"
      >
        <div className="color-picker-layout">
          <HexAlphaColorPicker
            color={toPickerColor(value)}
            onChange={handlePickerChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FileField({
  label,
  value,
  onChange,
  error,
  accept = "image/*",
  preview = "image",
}: {
  label: string
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

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        aria-label={label}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="flex items-center gap-3 border border-input p-2">
          <div className="flex size-14 shrink-0 items-center justify-center bg-muted">
            {preview === "image" ? (
              <FilePreview
                key={`${value.name}-${value.lastModified}-${value.size}`}
                file={value}
              />
            ) : (
              <FileIcon className="size-5 text-muted-foreground" />
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-xs" title={value.name}>
            {value.name}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
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
          className="w-full justify-start"
          onClick={selectFile}
        >
          <UploadIcon />
          Choose {label.toLowerCase()}
        </Button>
      )}
      {error && <FieldError>{error}</FieldError>}
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
}: {
  workshop: Workshop
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
  errors: Record<string, string>
}) {
  const change = (index: number, field: keyof Pillar, value: string) =>
    setWorkshop((current) => ({
      ...current,
      pillars: current.pillars.map((pillar, itemIndex) =>
        itemIndex === index ? { ...pillar, [field]: value } : pillar
      ),
    }))
  return (
    <div className="space-y-4">
      {errors.pillars && (
        <p className="text-xs text-destructive">{errors.pillars}</p>
      )}
      <div className="grid grid-cols-1 gap-4">
        {workshop.pillars.map((pillar, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <CardTitle>Pillar {index + 1}</CardTitle>
              {workshop.pillars.length > 1 && (
                <CardAction>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() =>
                      setWorkshop((current) => ({
                        ...current,
                        pillars: current.pillars.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      }))
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field data-invalid={!!errors[`pillar-${index}-title`]}>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={pillar.title}
                  onChange={(event) =>
                    change(index, "title", event.target.value)
                  }
                />
                {errors[`pillar-${index}-title`] && (
                  <FieldError>{errors[`pillar-${index}-title`]}</FieldError>
                )}
              </Field>
              <Field data-invalid={!!errors[`pillar-${index}-context`]}>
                <FieldLabel>Context</FieldLabel>
                <Textarea
                  value={pillar.context}
                  onChange={(event) =>
                    change(index, "context", event.target.value)
                  }
                />
                {errors[`pillar-${index}-context`] && (
                  <FieldError>{errors[`pillar-${index}-context`]}</FieldError>
                )}
              </Field>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setWorkshop((current) => ({
            ...current,
            pillars: [...current.pillars, { title: "", context: "" }],
          }))
        }
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
}: {
  workshop: Workshop
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
  errors: Record<string, string>
}) {
  const change = (
    index: number,
    field: keyof Team,
    value: string | Upload | ColorValue
  ) =>
    setWorkshop((current) => ({
      ...current,
      teams: current.teams.map((team, itemIndex) =>
        itemIndex === index ? { ...team, [field]: value } : team
      ),
    }))
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium">Passcode protection</p>
          <p className="text-xs text-muted-foreground">
            Require one PIN for all teams.
          </p>
        </div>
        <Switch
          checked={workshop.usePasscode}
          onCheckedChange={(checked) => update("usePasscode", checked)}
        />
      </div>
      {errors.teams && (
        <p className="text-xs text-destructive">{errors.teams}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {workshop.teams.map((team, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <CardTitle>Team {index + 1}</CardTitle>
              {workshop.teams.length > 1 && (
                <CardAction>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() =>
                      setWorkshop((current) => ({
                        ...current,
                        teams: current.teams.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      }))
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <Field data-invalid={!!errors[`team-${index}-name`]}>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={team.name}
                  onChange={(event) =>
                    change(index, "name", event.target.value)
                  }
                />
                {errors[`team-${index}-name`] && (
                  <FieldError>{errors[`team-${index}-name`]}</FieldError>
                )}
              </Field>
              <ColorPickerField
                label={`Team ${index + 1} color`}
                value={team.color}
                onChange={(value) => change(index, "color", value)}
                error={errors[`team-${index}-color`]}
              />
              <FileField
                label="Thumbnail"
                value={team.thumbnail}
                onChange={(file) => change(index, "thumbnail", file)}
                error={errors[`team-${index}-thumbnail`]}
              />
              <Field data-invalid={!!errors[`team-${index}-description`]}>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={team.description}
                  onChange={(event) =>
                    change(index, "description", event.target.value)
                  }
                />
                {errors[`team-${index}-description`] && (
                  <FieldError>{errors[`team-${index}-description`]}</FieldError>
                )}
              </Field>
              {workshop.usePasscode && (
                <Field data-invalid={!!errors[`team-${index}-passcode`]}>
                  <FieldLabel>Four-digit passcode</FieldLabel>
                  <InputOTP
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={team.passcode}
                    onChange={(value) => change(index, "passcode", value)}
                    aria-label={`Passcode for team ${index + 1}`}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                  {errors[`team-${index}-passcode`] && (
                    <FieldError>{errors[`team-${index}-passcode`]}</FieldError>
                  )}
                </Field>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setWorkshop((current) => ({
            ...current,
            teams: [
              ...current.teams,
              {
                name: "",
                color: { hex: "#d9ff00", alpha: 100 },
                thumbnail: null,
                description: "",
                passcode: "",
              },
            ],
          }))
        }
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
}: {
  workshop: Workshop
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>
  errors: Record<string, string>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workshop.coaches.map((coach, index) => (
        <Card key={index} size="sm">
          <CardContent className="flex items-center gap-3">
            <img
              src={coach.avatar}
              alt=""
              className="size-12 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Field data-invalid={!!errors[`coach-${index}`]}>
                <FieldLabel>Coach {index + 1}</FieldLabel>
                <Input
                  value={coach.name}
                  onChange={(event) =>
                    setWorkshop((current) => ({
                      ...current,
                      coaches: current.coaches.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
                {errors[`coach-${index}`] && (
                  <FieldError>{errors[`coach-${index}`]}</FieldError>
                )}
              </Field>
              <div className="flex gap-1">
                {dummyAvatars.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    onClick={() =>
                      setWorkshop((current) => ({
                        ...current,
                        coaches: current.coaches.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, avatar } : item
                        ),
                      }))
                    }
                    className={`size-6 rounded-full border-2 ${coach.avatar === avatar ? "border-primary" : "border-transparent"}`}
                  >
                    <img
                      src={avatar}
                      alt="Choose avatar"
                      className="size-full rounded-full"
                    />
                  </button>
                ))}
              </div>
            </div>
            <Switch
              checked={coach.enabled}
              onCheckedChange={(enabled) =>
                setWorkshop((current) => ({
                  ...current,
                  coaches: current.coaches.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, enabled } : item
                  ),
                }))
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
