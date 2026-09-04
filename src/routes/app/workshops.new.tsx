/* eslint-disable react-refresh/only-export-components */

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createFileRoute } from "@tanstack/react-router"
import { HexAlphaColorPicker } from "react-colorful"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/app/workshops/new")({
  component: RouteComponent,
})

type Upload = File | null
type ColorValue = { hex: string; alpha: number }

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
      ] as const) {
        if (!workshop[field]) nextErrors[field] = `${label} is required.`
      }
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
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">New Workshop</h1>
        <p className="text-sm text-muted-foreground">
          Build a workshop by switching things on.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => index <= activeStep && setActiveStep(index)}
            className={`border p-3 text-left transition-colors ${index === activeStep ? "border-primary bg-primary text-primary-foreground" : index < activeStep ? "border-primary/40 bg-primary/5" : "border-border text-muted-foreground"}`}
          >
            <span className="mb-2 flex items-center gap-2 text-xs font-medium">
              <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">
                {index < activeStep ? (
                  <CheckIcon className="size-3" />
                ) : (
                  index + 1
                )}
              </span>
              {step.title}
            </span>
            <span className="hidden text-[11px] opacity-75 md:block">
              {step.description}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>
              Step {activeStep + 1}: {steps[activeStep].title}
            </CardTitle>
            <CardDescription>{steps[activeStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep(activeStep, workshop, update, setWorkshop, errors)}
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((step) => step - 1)}
            >
              <ArrowLeftIcon /> Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue <ArrowRightIcon />
              </Button>
            ) : (
              <Button type="submit">
                <CheckIcon /> Create workshop
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

function renderStep(
  step: number,
  workshop: Workshop,
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void,
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>,
  errors: Record<string, string>
) {
  if (step === 0)
    return <IdentityStep workshop={workshop} update={update} errors={errors} />
  if (step === 1)
    return <ThemeStep workshop={workshop} update={update} errors={errors} />
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

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
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
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Title" error={errors.title}>
        <Input
          value={workshop.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Workshop title"
        />
      </Field>
      <Field label="Assignee" error={errors.assignee}>
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
      </Field>
      <Field label="Brand" error={errors.brand}>
        <Input
          value={workshop.brand}
          onChange={(event) => update("brand", event.target.value)}
          placeholder="Brand name"
        />
      </Field>
      <Field label="Subtitle" error={errors.subtitle}>
        <Input
          value={workshop.subtitle}
          onChange={(event) => update("subtitle", event.target.value)}
          placeholder="A short supporting line"
        />
      </Field>
      <Field label="Workshop context" error={errors.context}>
        <Textarea
          value={workshop.context}
          onChange={(event) => update("context", event.target.value)}
          placeholder="What should participants know?"
        />
      </Field>
      <Field label="Brand guidelines" error={errors.guidelines}>
        <Textarea
          value={workshop.guidelines}
          onChange={(event) => update("guidelines", event.target.value)}
          placeholder="Tone, do's and don'ts, or visual guidance"
        />
      </Field>
    </div>
  )
}

function ThemeStep({
  workshop,
  update,
  errors,
}: {
  workshop: Workshop
  update: <K extends keyof Workshop>(field: K, value: Workshop[K]) => void
  errors: Record<string, string>
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
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
      <Field label={label} error={error}>
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
}: {
  label: string
  value: Upload
  onChange: (file: Upload) => void
  error?: string
}) {
  return (
    <Field label={label} error={error}>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border p-3 text-center hover:bg-muted/50">
        <UploadIcon className="size-4 text-muted-foreground" />
        <span className="text-xs">{value?.name ?? "Choose a file"}</span>
        <input
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {value && (
        <FilePreview key={`${value.name}-${value.lastModified}`} file={value} />
      )}
    </Field>
  )
}

function FilePreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file))
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <img
      src={url}
      alt="Selected preview"
      className="h-20 w-full object-cover"
    />
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
      <div className="grid grid-cols-2 gap-4">
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
              <Field label="Title" error={errors[`pillar-${index}-title`]}>
                <Input
                  value={pillar.title}
                  onChange={(event) =>
                    change(index, "title", event.target.value)
                  }
                />
              </Field>
              <Field label="Context" error={errors[`pillar-${index}-context`]}>
                <Textarea
                  value={pillar.context}
                  onChange={(event) =>
                    change(index, "context", event.target.value)
                  }
                />
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
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Name" error={errors[`team-${index}-name`]}>
              <Input
                value={team.name}
                onChange={(event) => change(index, "name", event.target.value)}
              />
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
            <Field
              label="Description"
              error={errors[`team-${index}-description`]}
            >
              <Textarea
                value={team.description}
                onChange={(event) =>
                  change(index, "description", event.target.value)
                }
              />
            </Field>
            {workshop.usePasscode && (
              <Field
                label="Four-digit passcode"
                error={errors[`team-${index}-passcode`]}
              >
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
              </Field>
            )}
          </CardContent>
        </Card>
      ))}
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
              <Field
                label={`Coach ${index + 1}`}
                error={errors[`coach-${index}`]}
              >
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
