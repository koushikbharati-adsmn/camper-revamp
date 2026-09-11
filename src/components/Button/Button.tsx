import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  label?: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  loading?: boolean;
}

export default function Button({ children, label, variant = "primary", className = "", type = "button", loading = false, disabled, ...props }: ButtonProps) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading ? (
        <span className="btn__loading" aria-label="Loading">
          <span className="btn__spinner" aria-hidden="true" />
        </span>
      ) : (
        (children ?? label)
      )}
    </button>
  );
}
