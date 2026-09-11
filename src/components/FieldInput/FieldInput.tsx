import type { ChangeEvent } from "react";
import "./FieldInput.css";

interface InputProps {
  value: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function FieldInput({ value, placeholder, maxLength, className = "", onChange }: InputProps) {
  return <input type="text" value={value} placeholder={placeholder} maxLength={maxLength} onChange={onChange} className={`field-input ${className}`} />;
}
