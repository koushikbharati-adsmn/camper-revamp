import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"
import { MoonIcon, SunIcon } from "lucide-react"

export function ModeToggle() {
  const { setTheme } = useTheme()

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <SunIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          </Button>
        }
      />
      <TooltipContent side="bottom">Toggle theme</TooltipContent>
    </Tooltip>
  )
}
