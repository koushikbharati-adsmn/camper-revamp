import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link, useMatchRoute } from "@tanstack/react-router"

type NavItem = {
  title: string
  to: string
  icon: React.ReactNode
}

export function NavMain({ items }: { items: NavItem[] }) {
  const matchRoute = useMatchRoute()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = Boolean(matchRoute({ to: item.to, fuzzy: true }))

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="data-active:bg-primary/5 data-active:text-primary hover:data-active:bg-primary/5 hover:data-active:text-primary dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:hover:data-active:bg-primary dark:hover:data-active:text-primary-foreground"
                tooltip={item.title}
                isActive={isActive}
                render={
                  <Link
                    to={item.to}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                  />
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
