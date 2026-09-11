import type { TextareaHTMLAttributes } from "react";
import "./TextArea.css";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export default function TextArea({ className = "", ...props }: TextAreaProps) {
  return <textarea className={`text-area ${className}`} {...props} />;
}
