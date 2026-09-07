import type { User } from "@/services/users"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"

export interface MyRouterContext {
  queryClient: QueryClient
  user: User
}

const RootLayout = () => <Outlet />

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
})
