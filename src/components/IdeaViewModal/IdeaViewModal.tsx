import Button from "../Button/Button";
import ModalOverlay from "../ModalOverlay/ModalOverlay";
import "./IdeaViewModal.css";

type Idea = { title: string; description: string };
type IdeaViewModalProps = { isOpen: boolean; idea?: Idea; pillarLabel?: string; className?: string; onClose: () => void; onNext: () => void };

export default function IdeaViewModal({ isOpen, idea, pillarLabel, className = "", onClose, onNext }: IdeaViewModalProps) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} title="" className={className}>
      {idea && (
        <div className="idea-view-modal__content">
          <div className="idea-view-modal__image-wrapper">
            <img className="idea-view-modal__image" src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80" alt="" />
          </div>
          <div className="idea-view-modal__details">
            <div className="idea-view-modal__meta">
              <span>Team A</span>
              <span>{pillarLabel}</span>
            </div>
            <div className="caption grid gap-4">
              <h2>{idea.title}</h2>
              <p>{idea.description}</p>
            </div>
            <Button type="button" onClick={onNext}>
              Next
            </Button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}
