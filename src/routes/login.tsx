import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}

function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <img className="h-12" src="/logo-ogilvy-b.svg" alt="ogilvy logo" />
            <FieldDescription>
              Please sign in to your account to continue
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </Field>
          <Field>
            <Button type="submit">Login</Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our&nbsp;
        <Link to="/terms-and-conditions" target="_blank">
          Terms and Conditions
        </Link>{" "}
        and&nbsp;
        <Link to="/privacy-policy" target="_blank">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  )
}
