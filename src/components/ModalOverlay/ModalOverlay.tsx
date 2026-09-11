import { IconX } from "@tabler/icons-react";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import "./ModalOverlay.css";

type ModalOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
};

export default function ModalOverlay({ isOpen, onClose, title, children, className = "", closeOnOverlayClick = true }: ModalOverlayProps) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={handleOverlayClick}>
      <section className={`modal-overlay__dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={title ? "modal-overlay-title" : undefined}>
        <div className="modal-overlay__header">
          {title && <h2 id="modal-overlay-title">{title}</h2>}
          <button className="modal-overlay__close" type="button" onClick={onClose} aria-label="Close dialog">
            <IconX size={18} stroke={1.8} />
          </button>
        </div>
        <div className="modal-overlay__content">{children}</div>
      </section>
    </div>
  );
}
