import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth-session"
import { cn } from "@/lib/utils"
import { useGetOtp, useLogin } from "@/services/auth"
import { useForm } from "@tanstack/react-form"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import * as z from "zod"

const emailSchema = z.email({
  error: "Enter a valid email address.",
})

const emailStepSchema = z.object({
  email: emailSchema,
  otp: z.string(),
})

const otpStepSchema = emailStepSchema.extend({
  otp: z.string().regex(/^\d{6}$/, {
    error: "Enter a six-digit code.",
  }),
})

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z
      .string()
      .regex(/^\/app(?:\/|[?#]|$)/)
      .optional()
      .catch(undefined),

    otpId: z.string().optional().catch(undefined),

    email: emailSchema.optional().catch(undefined),
  }),

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
  const navigate = Route.useNavigate()
  const router = useRouter()

  const { redirect, otpId, email: searchEmail } = Route.useSearch()

  const getOtpMutation = useGetOtp()
  const loginMutation = useLogin()

  const [resendDelay, setResendDelay] = useState(0)

  const isOtpStep = Boolean(otpId)

  const form = useForm({
    defaultValues: {
      email: searchEmail ?? "",
      otp: "",
    },

    validators: {
      onSubmit: isOtpStep ? otpStepSchema : emailStepSchema,
    },

    onSubmit: async ({ value }) => {
      if (!otpId) {
        try {
          await sendOtp(value.email)
        } catch {
          return
        }

        return
      }

      try {
        await loginMutation.mutateAsync({
          email: value.email,
          otp: value.otp,
          otp_id: otpId,
        })
      } catch {
        return
      }

      if (redirect) {
        router.history.replace(redirect)
        return
      }

      await navigate({
        to: DEFAULT_AUTH_REDIRECT,
        replace: true,
      })
    },
  })

  async function sendOtp(email: string) {
    const response = await getOtpMutation.mutateAsync({
      email,
    })

    form.setFieldValue("otp", "")
    setResendDelay(60)

    await navigate({
      search: (prev) => ({
        ...prev,
        email,
        otpId: response.data.id,
      }),
      replace: true,
    })
  }

  useEffect(() => {
    if (!isOtpStep || resendDelay <= 0) return

    const timer = window.setTimeout(() => {
      setResendDelay((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [isOtpStep, resendDelay])

  const resendOtp = async () => {
    try {
      await sendOtp(form.state.values.email)
    } catch {
      return
    }
  }

  const returnToEmail = () => {
    setResendDelay(0)

    form.setFieldValue("otp", "")

    getOtpMutation.reset()
    loginMutation.reset()

    void navigate({
      search: (prev) => ({
        ...prev,
        otpId: undefined,
      }),
      replace: true,
    })
  }

  const isPending = getOtpMutation.isPending || loginMutation.isPending

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        noValidate
        aria-busy={isPending}
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <img className="h-12" src="/logo-ogilvy-b.svg" alt="ogilvy logo" />

            <FieldDescription>
              Please sign in to your account to continue
            </FieldDescription>
          </div>

          {isOtpStep ? (
            <form.Field
              name="otp"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="otp">One-time passcode</FieldLabel>

                    <InputOTP
                      id="otp"
                      name={field.name}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={field.state.value}
                      disabled={isPending}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      aria-invalid={isInvalid}
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
                      Please enter the one-time passcode sent to{" "}
                      {form.state.values.email}
                    </FieldDescription>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          ) : (
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>

                    <Input
                      id="email"
                      name={field.name}
                      type="email"
                      placeholder="username@example.com"
                      value={field.state.value}
                      disabled={isPending}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                    />

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          )}

          <Field>
            <Button type="submit" disabled={isPending}>
              {loginMutation.isPending ? (
                <>
                  <Spinner />
                  Verifying...
                </>
              ) : getOtpMutation.isPending && !isOtpStep ? (
                <>
                  <Spinner />
                  Sending code...
                </>
              ) : isOtpStep ? (
                "Verify code"
              ) : (
                "Login"
              )}
            </Button>

            {isOtpStep && (
              <Button
                type="button"
                variant="outline"
                disabled={resendDelay > 0 || isPending}
                onClick={() => void resendOtp()}
              >
                {getOtpMutation.isPending ? (
                  <>
                    <Spinner />
                    Resending...
                  </>
                ) : resendDelay > 0 ? (
                  `Resend code in ${resendDelay}s`
                ) : (
                  "Resend code"
                )}
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
                  disabled={isPending}
                  onClick={returnToEmail}
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
