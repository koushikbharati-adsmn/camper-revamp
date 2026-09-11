import type { ReactNode } from "react";
import "./Tabbed.css";

export type TabOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type TabbedProps = {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children?: ReactNode;
};

export default function Tabbed({ options, value, onChange, className = "", children }: TabbedProps) {
  return (
    <div className={`tabbed ${className}`} role="tablist" aria-label="Select pillar">
      {options.map((option) => (
        <button className={`tabbed__button ${option.value === value ? "tabbed__button--active" : ""}`} key={option.value} type="button" role="tab" aria-selected={option.value === value} disabled={option.disabled} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
      {children}
    </div>
  );
}
