import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import "./Select.css";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export default function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select",
  className = "",
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
        className={`select-trigger ${className}`}
        aria-label={ariaLabel}
      >
        <SelectPrimitive.Value
          className="select-trigger__value"
          placeholder={placeholder}
        />
        <SelectPrimitive.Icon className="select-trigger__chevron">
          <IconChevronDown size={16} stroke={2} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          className="select-positioner"
          side="bottom"
          align="start"
          sideOffset={8}
          alignItemWithTrigger={false}
          collisionAvoidance={{ side: "none" }}
        >
          <SelectPrimitive.Popup className="select-popup">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="select-item"
                >
                  <SelectPrimitive.ItemText className="select-item__text">
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="select-item__indicator">
                    <IconCheck size={16} stroke={2} aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
