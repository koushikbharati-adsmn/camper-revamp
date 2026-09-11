import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"

import "./index.css"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

// Import the generated route tree
import { routeTree } from "./routeTree.gen"
import { queryClient } from "./lib/query-client"
import { Toaster } from "./components/ui/toast"
import { subscribeAuthSession } from "./lib/auth-session"

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    user: undefined!,
    queryClient,
  },
  scrollRestoration: true,
  scrollToTopSelectors: ["#app-scroll-container"],
})

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

subscribeAuthSession(() => {
  queryClient.removeQueries({
    queryKey: ["ME"],
  })

  void router.invalidate()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </TooltipProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>
)
