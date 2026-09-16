import { IconCheck, IconChevronDown } from "@tabler/icons-react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"

export type SelectOption = {
  label: string
  value: string
  disabled?: boolean
}

type SelectProps = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

export default function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select",
  className,
  disabled,
  "aria-label": ariaLabel,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onChange?.(nextValue as string)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "border-theme7 bg-theme2 font-ogilvy-r text-base text-theme1 inline-flex w-44 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-lg border px-4 py-2 shadow-sm transition-all duration-200 outline-none hover:border-theme1 hover:shadow-md data-popup-open:border-theme1 data-popup-open:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        aria-label={ariaLabel}
      >
        <SelectPrimitive.Value className="truncate" placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-theme9 data-popup-open:text-theme1 inline-flex shrink-0 transition-transform duration-200 data-popup-open:rotate-180">
          <IconChevronDown size={16} stroke={2} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          className="z-999 outline-none"
          side="bottom"
          align="start"
          sideOffset={8}
          alignItemWithTrigger={false}
          collisionAvoidance={{ side: "none" }}
        >
          <SelectPrimitive.Popup className="border-theme7 bg-theme2 text-theme1 z-999 max-h-80 w-(--anchor-width) min-w-44 origin-(--transform-origin) overflow-y-auto rounded-2xl border p-2 shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="font-ogilvy-r text-theme1 flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm outline-none select-none data-highlighted:bg-theme10 data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <SelectPrimitive.ItemText className="truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="text-theme1 inline-flex shrink-0 items-center justify-center">
                    <IconCheck size={16} stroke={2} aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
