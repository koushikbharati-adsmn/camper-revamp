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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import {
  getWalkthroughOptions,
  type Walkthrough,
  useDeleteWalkthrough,
  useSaveWalkthrough,
} from "@/services/walkthroughs"
import { useForm } from "@tanstack/react-form"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  createFileRoute,
  type ErrorComponentProps,
  useRouter,
} from "@tanstack/react-router"
import { format } from "date-fns"
import {
  GripVerticalIcon,
  InfoIcon,
  ListOrderedIcon,
  PencilIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import * as z from "zod"

const walkthroughFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  isActive: z.boolean(),
})

export const Route = createFileRoute("/_authenticated/walkthroughs")({
  loader: ({ context }) => context.queryClient.query(getWalkthroughOptions()),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: WalkthroughsPending,
  errorComponent: WalkthroughsError,
  component: RouteComponent,
})

function RouteComponent() {
  const { data: walkthroughs } = useSuspenseQuery({
    ...getWalkthroughOptions(),
    select: (response) => response.data,
  })
  const [editor, setEditor] = useState<Walkthrough | "new" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Walkthrough | null>(null)
  const [orderOverride, setOrderOverride] = useState<string[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sortedWalkthroughs = [...walkthroughs].sort(
    (first, second) =>
      first.DisplayOrder - second.DisplayOrder ||
      first.Title.localeCompare(second.Title)
  )
  const walkthroughById = new Map(
    walkthroughs.map((walkthrough) => [walkthrough.ID, walkthrough])
  )
  const serverIds = new Set(walkthroughById.keys())
  const orderedIds = [
    ...orderOverride.filter((id) => serverIds.has(id)),
    ...sortedWalkthroughs
      .map((walkthrough) => walkthrough.ID)
      .filter((id) => !orderOverride.includes(id)),
  ]
  const orderedWalkthroughs = orderedIds.flatMap((id) => {
    const walkthrough = walkthroughById.get(id)
    return walkthrough ? [walkthrough] : []
  })

  const reorderWalkthroughs = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const previousIndex = orderedIds.indexOf(String(active.id))
    const nextIndex = orderedIds.indexOf(String(over.id))
    if (previousIndex < 0 || nextIndex < 0) return

    setOrderOverride(arrayMove(orderedIds, previousIndex, nextIndex))
  }

  return (
    <div>
      <WalkthroughsHeader onAdd={() => setEditor("new")} />

      {orderedWalkthroughs.length ? (
        <div className="mx-auto w-full max-w-5xl">
          <p
            id="walkthrough-reorder-instructions"
            className="mb-4 flex items-start gap-2 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          >
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Drag walkthroughs to change their display order. Keyboard users
              can press Space, then use the arrow keys.
            </span>
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={reorderWalkthroughs}
          >
            <SortableContext
              items={orderedIds}
              strategy={verticalListSortingStrategy}
            >
              <ol
                aria-label="Walkthrough display order"
                aria-describedby="walkthrough-reorder-instructions"
              >
                {orderedWalkthroughs.map((walkthrough, index) => (
                  <SortableWalkthroughCard
                    key={walkthrough.ID}
                    walkthrough={walkthrough}
                    position={index + 1}
                    isLast={index === orderedWalkthroughs.length - 1}
                    onEdit={() => setEditor(walkthrough)}
                    onDelete={() => setDeleteTarget(walkthrough)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <WalkthroughsEmpty />
      )}

      {editor && (
        <WalkthroughEditorDialog
          key={editor === "new" ? "new" : editor.ID}
          open
          walkthrough={editor === "new" ? null : editor}
          onOpenChange={(open) => {
            if (!open) setEditor(null)
          }}
        />
      )}

      <DeleteWalkthroughDialog
        walkthrough={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      />
    </div>
  )
}

function WalkthroughsHeader({ onAdd }: { onAdd?: () => void }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Walkthroughs</h1>
        <p className="text-sm text-muted-foreground">
          Manage the messages that guide participants through workshops.
        </p>
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="w-full sm:w-auto">
          <PlusIcon /> Add walkthrough
        </Button>
      )}
    </header>
  )
}

function SortableWalkthroughCard({
  walkthrough,
  position,
  isLast,
  onEdit,
  onDelete,
}: {
  walkthrough: Walkthrough
  position: number
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: walkthrough.ID })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group/step relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3 pb-3 last:pb-0",
        isDragging && "z-10"
      )}
    >
      <div className="relative flex justify-center" aria-hidden="true">
        <span
          className={cn(
            "relative z-10 flex size-8 items-center justify-center border border-primary/30 bg-primary/5 text-xs font-semibold text-primary transition-colors group-hover/step:border-primary/60 group-hover/step:bg-primary/10",
            isDragging && "border-primary bg-primary text-primary-foreground"
          )}
        >
          {position}
        </span>
        {!isLast && (
          <span className="absolute top-8 -bottom-3 w-px bg-primary/20" />
        )}
      </div>

      <Card
        size="sm"
        className={cn(
          "py-0 transition-[background-color,box-shadow] hover:shadow-sm hover:ring-foreground/20",
          !walkthrough.IsActive && "bg-muted/20",
          isDragging && "bg-card opacity-90 shadow-lg ring-primary/40"
        )}
      >
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-stretch">
          <div className="flex items-center justify-center border-r border-border bg-muted/30 transition-colors group-hover/step:bg-muted/50">
            <Button
              {...attributes}
              {...listeners}
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Move ${walkthrough.Title}. Current position ${position}.`}
            >
              <GripVerticalIcon />
            </Button>
          </div>

          <div className="min-w-0 p-3 sm:p-4">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {walkthrough.Title}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm/relaxed text-muted-foreground">
              {walkthrough.Description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge isActive={walkthrough.IsActive} />
              <span className="h-3 w-px bg-border" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">
                Created {formatCreatedDate(walkthrough.CreatedDttm)}
              </p>
            </div>
          </div>

          <div className="self-start p-2 sm:p-3">
            <WalkthroughActions
              walkthrough={walkthrough}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </Card>
    </li>
  )
}

function WalkthroughActions({
  walkthrough,
  onEdit,
  onDelete,
}: {
  walkthrough: Walkthrough
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${walkthrough.Title}`}
        title="Edit walkthrough"
        onClick={onEdit}
      >
        <PencilIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${walkthrough.Title}`}
        title="Delete walkthrough"
        onClick={onDelete}
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400"
          : "text-muted-foreground"
      }
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-muted-foreground"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )
}

function WalkthroughEditorDialog({
  open,
  walkthrough,
  onOpenChange,
}: {
  open: boolean
  walkthrough: Walkthrough | null
  onOpenChange: (open: boolean) => void
}) {
  const saveMutation = useSaveWalkthrough()
  const form = useForm({
    defaultValues: {
      title: walkthrough?.Title ?? "",
      description: walkthrough?.Description ?? "",
      isActive: walkthrough?.IsActive ?? true,
    },
    validators: {
      onSubmit: walkthroughFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await saveMutation.mutateAsync({
          ...(walkthrough ? { ID: walkthrough.ID } : {}),
          Title: value.title.trim(),
          Description: value.description.trim(),
          IsActive: value.isActive,
        })

        toast.add({
          type: "success",
          title: walkthrough ? "Walkthrough updated" : "Walkthrough created",
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
        if (!saveMutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form
          noValidate
          aria-busy={saveMutation.isPending}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {walkthrough ? "Edit walkthrough" : "Add walkthrough"}
            </DialogTitle>
            <DialogDescription>
              Configure the message and its availability in workshops.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.Field
              name="title"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="walkthrough-title">Title</FieldLabel>
                    <Input
                      id="walkthrough-title"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Welcome to the workshop"
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
                    <FieldLabel htmlFor="walkthrough-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      id="walkthrough-description"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Explain what participants should do next."
                      className="h-28 resize-none"
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
              name="isActive"
              children={(field) => (
                <Field
                  orientation="horizontal"
                  className="items-start border border-border p-3"
                >
                  <div className="flex-1">
                    <FieldLabel htmlFor="walkthrough-active">
                      Available in workshops
                    </FieldLabel>
                    <FieldDescription>
                      Turn this off to hide the walkthrough when configuring a
                      workshop.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="walkthrough-active"
                    checked={field.state.value}
                    disabled={saveMutation.isPending}
                    onCheckedChange={field.handleChange}
                    aria-label="Available in workshops"
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Spinner />}
              {saveMutation.isPending
                ? "Saving..."
                : walkthrough
                  ? "Save changes"
                  : "Create walkthrough"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteWalkthroughDialog({
  walkthrough,
  onOpenChange,
}: {
  walkthrough: Walkthrough | null
  onOpenChange: (open: boolean) => void
}) {
  const deleteMutation = useDeleteWalkthrough()

  const removeWalkthrough = async () => {
    if (!walkthrough) return

    try {
      const response = await deleteMutation.mutateAsync({ id: walkthrough.ID })
      toast.add({
        type: "success",
        title: "Walkthrough deleted",
        description: response.message,
      })
      onOpenChange(false)
    } catch {
      return
    }
  }

  return (
    <AlertDialog
      open={Boolean(walkthrough)}
      onOpenChange={(open) => {
        if (!deleteMutation.isPending) onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <ShieldAlertIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {walkthrough?.Title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the walkthrough message. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!walkthrough || deleteMutation.isPending}
            onClick={() => void removeWalkthrough()}
          >
            {deleteMutation.isPending && <Spinner />}
            {deleteMutation.isPending ? "Deleting..." : "Delete walkthrough"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function WalkthroughsEmpty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center bg-muted">
        <ListOrderedIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-sm font-semibold">No walkthroughs found</h2>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Add a walkthrough to start guiding workshop participants.
      </p>
    </div>
  )
}

function formatCreatedDate(value: number) {
  const date = new Date(value < 1_000_000_000_000 ? value * 1000 : value)
  return Number.isNaN(date.getTime()) ? "Unknown" : format(date, "MMM d, yyyy")
}

function WalkthroughsPending() {
  return (
    <div>
      <WalkthroughsHeader />
      <div className="mx-auto w-full max-w-5xl">
        <Skeleton className="mb-4 h-9 w-full" />
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 pb-3 last:pb-0"
            >
              <div className="relative flex justify-center">
                <Skeleton className="relative z-10 size-8" />
                {index < 4 && (
                  <span className="absolute top-8 -bottom-3 w-px bg-primary/20" />
                )}
              </div>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-stretch border border-border">
                <div className="flex items-center justify-center border-r border-border bg-muted/30">
                  <Skeleton className="size-7" />
                </div>
                <div className="min-w-0 space-y-2.5 p-3 sm:p-4">
                  <Skeleton className="h-5 w-48 max-w-full" />
                  <Skeleton className="h-8 w-96 max-w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <div className="flex gap-1 self-start p-2 sm:p-3">
                  <Skeleton className="size-7" />
                  <Skeleton className="size-7" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WalkthroughsError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div>
      <WalkthroughsHeader />
      <div className="border border-destructive/40 p-10 text-center">
        <h2 className="font-semibold">Unable to load walkthroughs</h2>
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
