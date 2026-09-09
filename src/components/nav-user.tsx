"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { clearAuthToken } from "@/lib/auth-session"
import { getInitials } from "@/lib/utils"
import type { User } from "@/services/users"
import { LogOutIcon } from "lucide-react"

export function NavUser({ user }: { user: User }) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const initials = getInitials(user.Name)
  const role = user.Role === "SuperAdmin" ? "Super Admin" : "Admin"

  const handleLogout = () => {
    clearAuthToken()
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2">
            {/* User Information */}
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.Name}</span>

                <span className="truncate text-xs text-muted-foreground">
                  {role}
                </span>
              </div>
            </div>

            {/* Logout */}
            <SidebarMenuButton
              type="button"
              className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              tooltip="Log out"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOutIcon className="size-4" />
              <span className="sr-only">Log out</span>
            </SidebarMenuButton>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Logout Confirmation */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="text-destructive">
              <LogOutIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Log out?</AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
