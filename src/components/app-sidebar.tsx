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
import {
  BotIcon,
  CommandIcon,
  FolderKanbanIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

const data = {
  user: {
    name: "Koushik bharati",
    email: "koushik.b@adsmn.in",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    {
      title: "Workshops",
      url: "#",
      icon: <FolderKanbanIcon />,
    },
    {
      title: "Coaches",
      url: "#",
      icon: <BotIcon />,
    },
    {
      title: "Users",
      url: "#",
      icon: <UsersIcon />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
