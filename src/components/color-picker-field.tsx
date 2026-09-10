import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { HexColorPicker } from "react-colorful"

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function ColorPickerField({
  id,
  errorKey,
  label,
  description,
  value,
  onChange,
  onBlur,
  error,
  required = true,
  disabled = false,
}: {
  id: string
  errorKey?: string
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const commitHex = (input: string) => {
    const normalized = input.trim().startsWith("#")
      ? input.trim()
      : `#${input.trim()}`
    onChange(isHexColor(normalized) ? normalized.toUpperCase() : input)
  }

  const handlePickerChange = (nextValue: string) => {
    onChange(nextValue.toUpperCase())
  }

  const pickerColor = isHexColor(value) ? value : "#000000"
  const describedBy = [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(nextOpen) => {
        if (!disabled) setOpen(nextOpen)
      }}
    >
      <Field
        data-invalid={!!error}
        data-disabled={disabled || undefined}
        data-error-key={errorKey}
      >
        <div className="space-y-1">
          <FieldLabel htmlFor={`${id}-hex`}>{label}</FieldLabel>
          {description && (
            <FieldDescription id={`${id}-description`}>
              {description}
            </FieldDescription>
          )}
        </div>
        <div className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)] border border-input focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 sm:h-10">
          <PopoverTrigger
            disabled={disabled}
            aria-label={`Choose ${label.toLowerCase()}`}
            className="border-r border-input outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: pickerColor }}
          />
          <Input
            id={`${id}-hex`}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onBlur={(event) => {
              commitHex(event.target.value)
              onBlur?.()
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitHex(event.currentTarget.value)
              }
            }}
            aria-invalid={!!error}
            aria-required={required || undefined}
            aria-describedby={describedBy || undefined}
            data-error-control
            className="h-full border-0 px-3 text-base uppercase shadow-none focus-visible:ring-0 sm:text-sm md:text-sm"
          />
        </div>
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </Field>
      <PopoverContent
        sideOffset={8}
        aria-label={`${label} picker`}
        className="w-fit border border-border bg-popover p-3 text-popover-foreground shadow-md"
      >
        <div className="color-picker-layout">
          <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
