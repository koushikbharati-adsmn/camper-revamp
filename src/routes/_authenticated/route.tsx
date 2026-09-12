import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getAuthToken } from "@/lib/auth-session"
import { loggedInUserQueryOptions } from "@/services/auth"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const loginRedirect = {
      to: "/login" as const,
      search: {
        redirect: location.href,
      },
      replace: true,
    }

    if (!getAuthToken()) {
      throw redirect(loginRedirect)
    }

    try {
      const user = await context.queryClient.query(loggedInUserQueryOptions())
      return { user }
    } catch (error) {
      if (!getAuthToken()) {
        throw redirect(loginRedirect)
      }
      throw error
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = Route.useRouteContext()

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar user={user} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 py-3 md:h-16 md:py-3.5">
          <SidebarTrigger className="-ml-1" />
          <img
            className="h-full w-full dark:invert"
            src="/logo-ogilvy-b.svg"
            alt="ogilvy logo"
          />
          <ModeToggle />
        </header>
        <div
          id="app-scroll-container"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
