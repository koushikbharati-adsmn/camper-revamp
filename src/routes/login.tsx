import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

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
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpStep, setIsOtpStep] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isOtpStep) {
      setIsOtpStep(true)
      return
    }

    if (otp.length !== 6) return

    console.log({ email, otp })
    navigate({ to: "/app/workshops" })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <img className="h-12" src="/logo-ogilvy-b.svg" alt="ogilvy logo" />
            <FieldDescription>
              Please sign in to your account to continue
            </FieldDescription>
          </div>
          {isOtpStep ? (
            <>
              <Field>
                <FieldLabel htmlFor="otp">One-time passcode</FieldLabel>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={setOtp}
                  aria-label="Six-digit one-time passcode"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>
                  Please enter the one-time passcode sent to {email}
                </FieldDescription>
              </Field>
            </>
          ) : (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
          )}
          <Field>
            <Button type="submit" disabled={isOtpStep && otp.length !== 6}>
              {isOtpStep ? "Verify code" : "Login"}
            </Button>
            {isOtpStep && (
              <Button type="button" variant="outline">
                Resend code in 30s
              </Button>
            )}
          </Field>

          {isOtpStep && (
            <Field>
              <p className="text-center text-xs text-muted-foreground">
                Entered wrong email?&nbsp;
                <button
                  className="underline underline-offset-4"
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                >
                  Go back
                </button>
              </p>
            </Field>
          )}
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
