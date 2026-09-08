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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { getInitials, getRolesLabel } from "@/lib/utils"
import {
  getUsersOptions,
  type User,
  type UserRole,
  useDeleteUser,
  useSaveUser,
} from "@/services/users"
import { useForm } from "@tanstack/react-form"
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  type ErrorComponentProps,
  useRouter,
} from "@tanstack/react-router"
import { format } from "date-fns"
import {
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react"
import { useDeferredValue, useState } from "react"
import * as z from "zod"
import {
  USER_ROLES,
  USER_ROLES_FILTER,
  USER_STATUS_FILTER,
} from "@/lib/constants"

const roleFilterSchema = z.enum(["all", "Admin", "SuperAdmin"])
const statusFilterSchema = z.enum(["all", "active", "inactive"])

const userFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.email({ error: "Enter a valid email address." }),
  role: z.enum(["Admin", "SuperAdmin"]),
  isActive: z.boolean(),
})

export const Route = createFileRoute("/_authenticated/users")({
  validateSearch: z.object({
    role: roleFilterSchema.optional().default("all"),
    status: statusFilterSchema.optional().default("all"),
  }),
  loaderDeps: ({ search }) => ({
    role: search.role ?? "all",
    status: search.status ?? "all",
  }),
  loader: ({ context, deps }) =>
    context.queryClient.query(getUsersOptions(getUsersParams(deps))),
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: UsersPending,
  errorComponent: UsersError,
  component: RouteComponent,
})

function getUsersParams({
  role,
  status,
}: {
  role: z.infer<typeof roleFilterSchema>
  status: z.infer<typeof statusFilterSchema>
}) {
  return {
    role: role === "all" ? null : role,
    is_active: status === "all" ? null : status === "active",
  }
}

function RouteComponent() {
  const navigate = Route.useNavigate()
  const filters = Route.useSearch()
  const { user: currentUser } = Route.useRouteContext()
  const { data: users } = useSuspenseQuery({
    ...getUsersOptions(getUsersParams(filters)),
    select: (response) => response.data,
  })
  const [search, setSearch] = useState("")
  const [editor, setEditor] = useState<
    { open: true; user: User | null } | { open: false; user: null }
  >({ open: false, user: null })
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const filteredUsers = deferredSearch
    ? users.filter((user) =>
        `${user.Name} ${user.EmailID}`.toLowerCase().includes(deferredSearch)
      )
    : users

  const updateRoleFilter = (value: unknown) => {
    const result = roleFilterSchema.safeParse(value)
    if (!result.success) return

    void navigate({
      search: (previous) => ({
        ...previous,
        role: result.data === "all" ? undefined : result.data,
      }),
      replace: true,
    })
  }

  const updateStatusFilter = (value: unknown) => {
    const result = statusFilterSchema.safeParse(value)
    if (!result.success) return

    void navigate({
      search: (previous) => ({
        ...previous,
        status: result.data === "all" ? undefined : result.data,
      }),
      replace: true,
    })
  }

  return (
    <div>
      <UsersHeader onAdd={() => setEditor({ open: true, user: null })} />

      <section
        aria-label="User filters"
        className="mb-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end"
      >
        <InputGroup className="w-full sm:max-w-xs">
          <InputGroupInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email..."
            aria-label="Search users"
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <Select
          items={USER_ROLES_FILTER}
          value={filters.role}
          onValueChange={updateRoleFilter}
        >
          <SelectTrigger
            className="w-full sm:max-w-40"
            aria-label="Filter by role"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES_FILTER.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={USER_STATUS_FILTER}
          value={filters.status}
          onValueChange={updateStatusFilter}
        >
          <SelectTrigger
            className="w-full sm:max-w-40"
            aria-label="Filter by status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_STATUS_FILTER.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {filteredUsers.length ? (
        <>
          <div className="hidden border border-border md:block">
            <UsersTable
              users={filteredUsers}
              currentUserId={currentUser.UserID}
              onEdit={(user) => setEditor({ open: true, user })}
              onDelete={setDeleteTarget}
            />
          </div>
          <div className="grid gap-3 md:hidden">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.UserID}
                user={user}
                isCurrentUser={user.UserID === currentUser.UserID}
                onEdit={() => setEditor({ open: true, user })}
                onDelete={() => setDeleteTarget(user)}
              />
            ))}
          </div>
        </>
      ) : (
        <UsersEmpty hasSearch={Boolean(deferredSearch)} />
      )}

      {editor.open && (
        <UserEditorDialog
          key={editor.user?.UserID ?? "new-user"}
          open
          user={editor.user}
          currentUser={currentUser}
          onOpenChange={(open) => {
            if (!open) setEditor({ open: false, user: null })
          }}
        />
      )}

      <DeleteUserDialog
        user={deleteTarget}
        currentUserId={currentUser.UserID}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      />
    </div>
  )
}

function UsersHeader({ onAdd }: { onAdd?: () => void }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage account access, roles, and status.
        </p>
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="w-full sm:w-auto">
          <PlusIcon /> Add user
        </Button>
      )}
    </header>
  )
}

function UsersTable({
  users,
  currentUserId,
  onEdit,
  onDelete,
}: {
  users: User[]
  currentUserId: number
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden lg:table-cell">Created At</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.UserID}>
            <TableCell>
              <UserIdentity
                user={user}
                isCurrentUser={user.UserID === currentUserId}
              />
            </TableCell>
            <TableCell>
              <RoleBadge role={user.Role} />
            </TableCell>
            <TableCell>
              <StatusBadge isActive={user.isActive} />
            </TableCell>
            <TableCell className="hidden text-muted-foreground lg:table-cell">
              {formatCreatedDate(user.CreatedDttm)}
            </TableCell>
            <TableCell>
              <UserActions
                user={user}
                isCurrentUser={user.UserID === currentUserId}
                onEdit={() => onEdit(user)}
                onDelete={() => onDelete(user)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function UserCard({
  user,
  isCurrentUser,
  onEdit,
  onDelete,
}: {
  user: User
  isCurrentUser: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <UserIdentity user={user} isCurrentUser={isCurrentUser} />
        <CardAction>
          <UserActions
            user={user}
            isCurrentUser={isCurrentUser}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <RoleBadge role={user.Role} />
        <StatusBadge isActive={user.isActive} />
        <span className="ml-auto text-xs text-muted-foreground">
          {formatCreatedDate(user.CreatedDttm)}
        </span>
      </CardContent>
    </Card>
  )
}

function UserIdentity({
  user,
  isCurrentUser,
}: {
  user: User
  isCurrentUser: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback>{getInitials(user.Name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{user.Name}</p>
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">(You)</span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{user.EmailID}</p>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={role === "SuperAdmin" ? "default" : "secondary"}>
      {getRolesLabel(role)}
    </Badge>
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

function UserActions({
  user,
  isCurrentUser,
  onEdit,
  onDelete,
}: {
  user: User
  isCurrentUser: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${user.Name}`}
        render={
          <Button variant="ghost" size="icon-sm">
            <EllipsisIcon />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onEdit}>
          <PencilIcon /> Edit user
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isCurrentUser}
          onClick={onDelete}
        >
          <Trash2Icon /> {isCurrentUser ? "Current user" : "Delete user"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserEditorDialog({
  open,
  user,
  currentUser,
  onOpenChange,
}: {
  open: boolean
  user: User | null
  currentUser: User
  onOpenChange: (open: boolean) => void
}) {
  const saveUserMutation = useSaveUser()
  const queryClient = useQueryClient()
  const router = useRouter()
  const isCurrentUser = user?.UserID === currentUser.UserID
  const isProtectedRole = isCurrentUser && user.Role === "SuperAdmin"
  const form = useForm({
    defaultValues: {
      name: user?.Name ?? "",
      email: user?.EmailID ?? "",
      role: (user?.Role ?? "Admin") as UserRole,
      isActive: user?.isActive ?? true,
    },
    validators: {
      onSubmit: userFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (
        isCurrentUser &&
        (!value.isActive ||
          (user.Role === "SuperAdmin" && value.role === "Admin"))
      ) {
        toast.add({
          type: "error",
          title: "Account protection",
          description: "You cannot deactivate or demote your own account.",
        })
        return
      }

      try {
        const response = await saveUserMutation.mutateAsync({
          ...(user ? { user_id: user.UserID } : {}),
          name: value.name.trim(),
          email: value.email.trim(),
          role: value.role,
          is_active: value.isActive,
        })

        if (isCurrentUser) {
          await queryClient.invalidateQueries({ queryKey: ["ME"] })
          await router.invalidate()
        }

        toast.add({
          type: "success",
          title: user ? "User updated" : "User created",
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
        if (!saveUserMutation.isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-hidden sm:max-w-md">
        <form
          noValidate
          aria-busy={saveUserMutation.isPending}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {user
                ? "Update account details, access level, and status."
                : "Create an account and choose its access level."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="min-h-0 flex-1 overflow-y-auto p-4">
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="user-name">Name</FieldLabel>
                    <Input
                      id="user-name"
                      name={field.name}
                      value={field.state.value}
                      disabled={saveUserMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Full name"
                      autoComplete="name"
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
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="user-email">Email</FieldLabel>
                    <Input
                      id="user-email"
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      disabled={saveUserMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="name@example.com"
                      autoComplete="email"
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
              name="role"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field
                    data-invalid={isInvalid}
                    data-disabled={isProtectedRole}
                  >
                    <FieldLabel htmlFor="user-role">Role</FieldLabel>
                    <Select
                      items={USER_ROLES}
                      value={field.state.value}
                      disabled={saveUserMutation.isPending || isProtectedRole}
                      onValueChange={(value) => {
                        if (value === "Admin" || value === "SuperAdmin") {
                          field.handleChange(value)
                        }
                      }}
                    >
                      <SelectTrigger
                        id="user-role"
                        className="w-full"
                        aria-invalid={isInvalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Roles</SelectLabel>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {isProtectedRole && (
                      <FieldDescription>
                        You cannot demote your own Super Admin account.
                      </FieldDescription>
                    )}
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
                  data-disabled={isCurrentUser}
                  className="items-start border border-border p-3"
                >
                  <div className="flex-1">
                    <FieldLabel htmlFor="user-active">
                      Active account
                    </FieldLabel>
                    <FieldDescription>
                      {isCurrentUser
                        ? "You cannot deactivate your own account."
                        : "Inactive users cannot access the application."}
                    </FieldDescription>
                  </div>
                  <Switch
                    id="user-active"
                    checked={field.state.value}
                    disabled={saveUserMutation.isPending || isCurrentUser}
                    onCheckedChange={field.handleChange}
                    aria-label="Active account"
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saveUserMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveUserMutation.isPending}>
              {saveUserMutation.isPending && <Spinner />}
              {saveUserMutation.isPending
                ? "Saving..."
                : user
                  ? "Save changes"
                  : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({
  user,
  currentUserId,
  onOpenChange,
}: {
  user: User | null
  currentUserId: number
  onOpenChange: (open: boolean) => void
}) {
  const deleteUserMutation = useDeleteUser()
  const isCurrentUser = user?.UserID === currentUserId

  const removeUser = async () => {
    if (!user || isCurrentUser) return

    try {
      const response = await deleteUserMutation.mutateAsync({ id: user.UserID })
      toast.add({
        type: "success",
        title: "User deleted",
        description: response.message,
      })
      onOpenChange(false)
    } finally {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!deleteUserMutation.isPending) onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <ShieldAlertIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {user?.Name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes access for {user?.EmailID}. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteUserMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!user || isCurrentUser || deleteUserMutation.isPending}
            onClick={() => void removeUser()}
          >
            {deleteUserMutation.isPending && <Spinner />}
            {deleteUserMutation.isPending ? "Deleting..." : "Delete user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function UsersEmpty({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center bg-muted">
        <UserRoundIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-sm font-semibold">
        {hasSearch ? "No matching users" : "No users found"}
      </h2>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {hasSearch
          ? "Try a different name or email, or adjust the current filters."
          : "Adjust the role or status filter, or add a new user."}
      </p>
    </div>
  )
}

function formatCreatedDate(value: number) {
  const date = new Date(value < 1_000_000_000_000 ? value * 1000 : value)
  return Number.isNaN(date.getTime()) ? "Unknown" : format(date, "PPPp")
}

function UsersPending() {
  return (
    <div>
      <UsersHeader />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Skeleton className="h-8 w-full sm:w-80" />
        <Skeleton className="h-8 w-full sm:w-40" />
        <Skeleton className="h-8 w-full sm:w-40" />
        <Skeleton className="h-8 w-full sm:w-24" />
      </div>
      <div className="space-y-px border border-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b p-3 last:border-b-0"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div>
      <UsersHeader />
      <div className="border border-destructive/40 p-10 text-center">
        <h2 className="font-semibold">Unable to load users</h2>
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
