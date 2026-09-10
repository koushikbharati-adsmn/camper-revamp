import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorPickerField, isHexColor } from "@/components/color-picker-field"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { COACH_PRESET_AVATARS } from "@/lib/constants"
import { cn, getInitials } from "@/lib/utils"
import {
  type CoachItem,
  getCoachesOptions,
  useDeleteCoach,
  useSaveCoach,
} from "@/services/coaches"
import { useForm } from "@tanstack/react-form"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  type ErrorComponentProps,
  useRouter,
} from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import {
  EllipsisIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react"
import { useState } from "react"
import * as z from "zod"

const coachFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  bgColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, "Enter a valid hex color."),
  primaryTextColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, "Enter a valid hex color."),
  secondaryTextColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, "Enter a valid hex color."),
  avatarUrl: z.string().trim().min(1, "Choose an avatar."),
  isActive: z.boolean(),
})

const coachPromptSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required."),
})

const DEFAULT_COACH_COLORS = {
  background: "#FFFFFF",
  primaryText: "#111111",
  secondaryText: "#6B7280",
} as const

export const Route = createFileRoute("/_authenticated/coaches")({
  loader: ({ context }) => context.queryClient.query(getCoachesOptions()),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: CoachesPending,
  errorComponent: CoachesError,
  component: RouteComponent,
})

function RouteComponent() {
  const { data: response } = useSuspenseQuery(getCoachesOptions())
  const [editor, setEditor] = useState<
    { open: true; coach: CoachItem | null } | { open: false; coach: null }
  >({ open: false, coach: null })
  const [deleteTarget, setDeleteTarget] = useState<CoachItem | null>(null)
  const [promptTarget, setPromptTarget] = useState<CoachItem | null>(null)

  return (
    <div>
      <CoachesHeader onAdd={() => setEditor({ open: true, coach: null })} />

      {response.data.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {response.data.map((coach) => (
            <CoachCard
              key={coach.ID}
              coach={coach}
              onEdit={() => setEditor({ open: true, coach })}
              onEditPrompt={() => setPromptTarget(coach)}
              onDelete={() => setDeleteTarget(coach)}
            />
          ))}
        </div>
      ) : (
        <CoachesEmpty />
      )}

      {editor.open && (
        <CoachEditorDialog
          key={editor.coach?.ID ?? "new-coach"}
          open
          coach={editor.coach}
          onOpenChange={(open) => {
            if (!open) setEditor({ open: false, coach: null })
          }}
        />
      )}

      {promptTarget && (
        <CoachPromptDialog
          key={promptTarget.ID}
          coach={promptTarget}
          open
          onOpenChange={(open) => {
            if (!open) setPromptTarget(null)
          }}
        />
      )}

      <DeleteCoachDialog
        coach={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      />
    </div>
  )
}

function CoachesHeader({ onAdd }: { onAdd?: () => void }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Coaches</h1>
        <p className="text-sm text-muted-foreground">
          Create and maintain the coaching team available to workshops.
        </p>
      </div>
      {onAdd && (
        <Button className="w-full sm:w-auto" onClick={onAdd}>
          <PlusIcon />
          New Coach
        </Button>
      )}
    </header>
  )
}

function CoachCard({
  coach,
  onEdit,
  onEditPrompt,
  onDelete,
}: {
  coach: CoachItem
  onEdit: () => void
  onEditPrompt: () => void
  onDelete: () => void
}) {
  const backgroundColor = getCoachColor(
    coach.BGColor,
    DEFAULT_COACH_COLORS.background
  )
  const primaryTextColor = getCoachColor(
    coach.PrimaryTxtColor,
    DEFAULT_COACH_COLORS.primaryText
  )
  const secondaryTextColor = getCoachColor(
    coach.SecondaryTxtColor,
    DEFAULT_COACH_COLORS.secondaryText
  )

  return (
    <Card style={{ backgroundColor }}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <CoachAvatar coach={coach} className="size-11" />
          <div className="min-w-0">
            <CardTitle className="truncate" style={{ color: primaryTextColor }}>
              {coach.CoachName}
            </CardTitle>
            <CardDescription
              className="truncate"
              style={{ color: secondaryTextColor }}
            >
              {coach.Title}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${coach.CoachName}`}
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  style={{ color: primaryTextColor }}
                >
                  <EllipsisIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon /> Edit coach
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditPrompt}>
                <FileTextIcon /> Edit system prompt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2Icon /> Delete coach
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex-1">
        <p
          className="line-clamp-3 text-sm"
          style={{ color: secondaryTextColor }}
        >
          {coach.Description}
        </p>
      </CardContent>

      <CardFooter className="mt-auto justify-between gap-3">
        <CoachStatusBadge isActive={coach.IsActive} />
        <span
          className="truncate text-xs"
          style={{ color: secondaryTextColor }}
        >
          {formatCreatedDate(coach.CreatedDttm)}
        </span>
      </CardFooter>
    </Card>
  )
}

function CoachAvatar({
  coach,
  className,
}: {
  coach: CoachItem
  className?: string
}) {
  return (
    <Avatar className={className}>
      <AvatarImage
        src={coach.AvatarFileName + `?${crypto.randomUUID()}`}
        alt={`${coach.CoachName} avatar`}
      />
      <AvatarFallback>{getInitials(coach.CoachName, "C")}</AvatarFallback>
    </Avatar>
  )
}

function CoachStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-green-600" : "bg-muted-foreground"
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )
}

function CoachEditorDialog({
  open,
  coach,
  onOpenChange,
}: {
  open: boolean
  coach: CoachItem | null
  onOpenChange: (open: boolean) => void
}) {
  const saveCoachMutation = useSaveCoach()
  const form = useForm({
    defaultValues: {
      name: coach?.CoachName ?? "",
      title: coach?.Title ?? "",
      description: coach?.Description ?? "",
      bgColor: getCoachColor(coach?.BGColor, DEFAULT_COACH_COLORS.background),
      primaryTextColor: getCoachColor(
        coach?.PrimaryTxtColor,
        DEFAULT_COACH_COLORS.primaryText
      ),
      secondaryTextColor: getCoachColor(
        coach?.SecondaryTxtColor,
        DEFAULT_COACH_COLORS.secondaryText
      ),
      avatarUrl: coach?.AvatarFileName ?? COACH_PRESET_AVATARS[0],
      isActive: coach?.IsActive ?? true,
    },
    validators: {
      onSubmit: coachFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await saveCoachMutation.mutateAsync({
          ...(coach ? { id: coach.ID } : {}),
          name: value.name.trim(),
          title: value.title.trim(),
          description: value.description.trim(),
          bg_color: value.bgColor.trim().toUpperCase(),
          primary_txt_color: value.primaryTextColor.trim().toUpperCase(),
          secondary_txt_color: value.secondaryTextColor.trim().toUpperCase(),
          prompt: coach?.Prompt ?? "",
          avatarUrl: value.avatarUrl,
          is_active: value.isActive,
        })

        toast.add({
          type: "success",
          title: coach ? "Coach updated" : "Coach created",
          description: response.message,
        })
        onOpenChange(false)
      } catch {
        return
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saveCoachMutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <form
          noValidate
          aria-busy={saveCoachMutation.isPending}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{coach ? "Edit coach" : "Add coach"}</DialogTitle>
            <DialogDescription>
              {coach
                ? "Update the coach profile and status."
                : "Create a coach that can be included in workshops."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="coach-name">Name</FieldLabel>
                    <Input
                      id="coach-name"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Coach name"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <form.Field
              name="title"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="coach-title">Title</FieldLabel>
                    <Input
                      id="coach-title"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="e.g. Creative director"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="coach-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      id="coach-description"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Describe how this coach supports participants."
                      className="min-h-24 resize-none"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field
                name="bgColor"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <ColorPickerField
                      id="coach-background-color"
                      label="Background color"
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      error={
                        isInvalid
                          ? field.state.meta.errors[0]?.message
                          : undefined
                      }
                    />
                  )
                }}
              />

              <form.Field
                name="primaryTextColor"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <ColorPickerField
                      id="coach-primary-text-color"
                      label="Primary text color"
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      error={
                        isInvalid
                          ? field.state.meta.errors[0]?.message
                          : undefined
                      }
                    />
                  )
                }}
              />

              <form.Field
                name="secondaryTextColor"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <ColorPickerField
                      id="coach-secondary-text-color"
                      label="Secondary text color"
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      error={
                        isInvalid
                          ? field.state.meta.errors[0]?.message
                          : undefined
                      }
                    />
                  )
                }}
              />
            </div>

            <form.Field
              name="avatarUrl"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Avatar</FieldLabel>
                    <FieldDescription>
                      Choose the profile image shown for this coach.
                    </FieldDescription>
                    <div className="flex flex-wrap gap-3">
                      {COACH_PRESET_AVATARS.map((avatar, index) => (
                        <button
                          type="button"
                          key={avatar}
                          disabled={saveCoachMutation.isPending}
                          aria-label={`Use avatar ${index + 1}`}
                          aria-pressed={field.state.value === avatar}
                          onClick={() => field.handleChange(avatar)}
                          className={cn(
                            "rounded-full border-2 border-transparent p-0.5 transition-opacity outline-none hover:opacity-80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                            field.state.value === avatar && "border-primary"
                          )}
                        >
                          <Avatar className="size-12">
                            <AvatarImage
                              src={avatar}
                              alt={`Coach avatar ${index + 1}`}
                            />
                            <AvatarFallback>{index + 1}</AvatarFallback>
                          </Avatar>
                        </button>
                      ))}
                    </div>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <form.Field
              name="isActive"
              children={(field) => (
                <Field
                  orientation="horizontal"
                  className="items-start border border-border p-3"
                >
                  <div className="flex-1">
                    <FieldLabel htmlFor="coach-active">Active coach</FieldLabel>
                    <FieldDescription>
                      Inactive coaches are unavailable for new workshops.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="coach-active"
                    checked={field.state.value}
                    disabled={saveCoachMutation.isPending}
                    onCheckedChange={field.handleChange}
                    aria-label="Active coach"
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saveCoachMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveCoachMutation.isPending}>
              {saveCoachMutation.isPending && <Spinner />}
              {saveCoachMutation.isPending
                ? "Saving..."
                : coach
                  ? "Save changes"
                  : "Create coach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CoachPromptDialog({
  open,
  coach,
  onOpenChange,
}: {
  open: boolean
  coach: CoachItem
  onOpenChange: (open: boolean) => void
}) {
  const saveCoachMutation = useSaveCoach()
  const form = useForm({
    defaultValues: {
      prompt: coach.Prompt ?? "",
    },
    validators: {
      onSubmit: coachPromptSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await saveCoachMutation.mutateAsync({
          id: coach.ID,
          name: coach.CoachName,
          title: coach.Title,
          description: coach.Description,
          bg_color: getCoachColor(
            coach.BGColor,
            DEFAULT_COACH_COLORS.background
          ),
          primary_txt_color: getCoachColor(
            coach.PrimaryTxtColor,
            DEFAULT_COACH_COLORS.primaryText
          ),
          secondary_txt_color: getCoachColor(
            coach.SecondaryTxtColor,
            DEFAULT_COACH_COLORS.secondaryText
          ),
          prompt: value.prompt.trim(),
          avatarUrl: coach.AvatarFileName,
          is_active: coach.IsActive,
        })

        toast.add({
          type: "success",
          title: "Coach prompt updated",
          description: response.message,
        })
        onOpenChange(false)
      } catch {
        return
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saveCoachMutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <form
          noValidate
          aria-busy={saveCoachMutation.isPending}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{coach.CoachName}&apos;s prompt</DialogTitle>
            <DialogDescription>
              Review and update the instructions this coach uses to guide
              participants.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.Field
              name="prompt"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="coach-prompt">
                      System Prompt
                    </FieldLabel>
                    <Textarea
                      id="coach-prompt"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveCoachMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Define how this coach should guide participants."
                      className="h-80 resize-none"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saveCoachMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveCoachMutation.isPending}>
              {saveCoachMutation.isPending && <Spinner />}
              {saveCoachMutation.isPending ? "Saving..." : "Save prompt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteCoachDialog({
  coach,
  onOpenChange,
}: {
  coach: CoachItem | null
  onOpenChange: (open: boolean) => void
}) {
  const deleteCoachMutation = useDeleteCoach()

  const removeCoach = async () => {
    if (!coach) return

    try {
      const response = await deleteCoachMutation.mutateAsync({ id: coach.ID })
      toast.add({
        type: "success",
        title: "Coach deleted",
        description: response.message,
      })
      onOpenChange(false)
    } catch {
      return
    }
  }

  return (
    <AlertDialog
      open={Boolean(coach)}
      onOpenChange={(open) => {
        if (!deleteCoachMutation.isPending) onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <ShieldAlertIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {coach?.CoachName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the coach. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCoachMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!coach || deleteCoachMutation.isPending}
            onClick={() => void removeCoach()}
          >
            {deleteCoachMutation.isPending && <Spinner />}
            {deleteCoachMutation.isPending ? "Deleting..." : "Delete coach"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CoachesEmpty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center bg-muted">
        <UserRoundIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="font-semibold">No coaches yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add a coach to make them available when configuring workshops.
      </p>
    </div>
  )
}

function formatCreatedDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Created date unavailable"

  return `Created ${formatDistanceToNow(date, { addSuffix: true })}`
}

function getCoachColor(value: string | null | undefined, fallback: string) {
  return value && isHexColor(value) ? value.toUpperCase() : fallback
}

function CoachesPending() {
  return (
    <div>
      <CoachesHeader />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-14 w-full" />
            </CardContent>
            <CardFooter className="justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CoachesError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div>
      <CoachesHeader />
      <div className="border border-destructive/40 p-10 text-center">
        <h2 className="font-semibold">Unable to load coaches</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            reset()
            void router.invalidate()
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
