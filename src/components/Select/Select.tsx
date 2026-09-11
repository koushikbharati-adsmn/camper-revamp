import { IconChevronDown } from "@tabler/icons-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import "./Select.css";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children?: ReactNode;
  className?: string;
  options?: SelectOption[];
};

export default function Select({ children, className = "", options, ...props }: SelectProps) {
  return (
    <div className={`select-wrapper ${className}`}>
      <select className="select" {...props}>
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      <IconChevronDown className="select__chevron" size={16} stroke={2} aria-hidden="true" />
    </div>
  );
}
