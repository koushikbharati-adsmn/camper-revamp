"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BotIcon,
  Settings2Icon,
  UsersIcon,
  FolderKanbanIcon,
} from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "Koushik bharati",
    email: "koushik.b@adsmn.in",
    avatar: "/avatars/shadcn.jpg",
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <img className="h-10" src="/logo-ogilvy-b.svg" alt="logo" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
