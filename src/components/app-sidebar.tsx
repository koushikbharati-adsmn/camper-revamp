"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { User } from "@/services/users"
import { Link } from "@tanstack/react-router"
import {
  BotIcon,
  CommandIcon,
  FolderKanbanIcon,
  LightbulbIcon,
  UsersIcon,
} from "lucide-react"

const navItems = [
  {
    title: "Workshops",
    to: "/workshops" as const,
    icon: <FolderKanbanIcon />,
  },
  {
    title: "Coaches",
    to: "/coaches" as const,
    icon: <BotIcon />,
  },
  {
    title: "Users",
    to: "/users" as const,
    icon: <UsersIcon />,
  },
  {
    title: "Walkthroughs",
    to: "/walkthroughs" as const,
    icon: <LightbulbIcon />,
  },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  return (
    <Sidebar variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <CommandIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Basecamp</span>
                <span className="truncate text-xs">Powered by Ogilvy</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
