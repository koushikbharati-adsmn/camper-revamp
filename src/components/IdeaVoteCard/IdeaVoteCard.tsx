import { IconEdit, IconSparkles, IconStar } from "@tabler/icons-react";
import { useState } from "react";
import Button from "../Button/Button";
import "./IdeaVoteCard.css";

type IdeaVoteCardProps = {
  votes?: number;
  title?: string;
  description?: string;
  age?: string;
  image?: string;
  onView?: () => void;
  onEdit?: () => void;
  viewLabel?: string;
  onSparkles?: () => void;
  showEdit?: boolean;
  showSparkles?: boolean;
};

export default function IdeaVoteCard({ votes = 0, title = "Idea Title", description = "Some quick example text to build on the card title and make up the bulk of the card's content.", age = "2 minutes ago", image, onView, onEdit, viewLabel = "View", onSparkles, showEdit = true, showSparkles = true }: IdeaVoteCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [_showSparklesConfetti, setShowSparklesConfetti] = useState(false);

  const handleFavorite = () => {
    setIsFavorite((favorite) => {
      const nextFavorite = !favorite;
      if (nextFavorite) {
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 700);
      }
      return nextFavorite;
    });
  };

  const handleSparkles = () => {
    setShowSparklesConfetti(false);

    // Allows animation to restart on every click
    window.requestAnimationFrame(() => {
      setShowSparklesConfetti(true);

      window.setTimeout(() => {
        setShowSparklesConfetti(false);
      }, 700);
    });

    onSparkles?.();
  };

  return (
    <div className="idea-vote-card">
      <div className="idea-vote-card__votes">
        {image && <img className="idea-vote-card__votes-image" src={image} alt="" />}
        <div className="idea-vote-card__votes-overlay" aria-hidden="true" />
        <div className="caption relative z-999 flex flex-col">
          <h2 className="headTitle">{String(votes).padStart(2, "0")}</h2>
          <span className="textVote">VOTES</span>
        </div>
        {/* <i aria-hidden="true" /> */}
      </div>
      <div className="idea-vote-card__body">
        <div className="idea-vote-card__actions">
          <div className="leftContent flex gap-2">
            <button type="button" className={`idea-vote-card__action idea-vote-card__favorite ${isFavorite ? "idea-vote-card__favorite--active" : ""}`} onClick={handleFavorite} aria-label={isFavorite ? "Unfavorite idea" : "Favorite idea"} aria-pressed={isFavorite}>
              <IconStar size={20} stroke={1.8} fill={isFavorite ? "currentColor" : "none"} />
              {showConfetti && (
                <span className="idea-vote-card__confetti" aria-hidden="true">
                  ✦
                </span>
              )}
            </button>
            {showEdit && (
              <button type="button" className="idea-vote-card__action idea-vote-card__edit" onClick={onEdit} aria-label="Edit idea">
                <IconEdit size={20} stroke={1.8} />
              </button>
            )}
          </div>
          <div className="rightContent">
            {showSparkles && (
              <div className="rightContent">
                <button type="button" onClick={handleSparkles} className="idea-vote-card__action idea-vote-card__sparkles" aria-label="AI suggestions">
                  <IconSparkles size={20} stroke={1.8} />
                </button>
              </div>
            )}
          </div>
        </div>
        <h2>{title}</h2>
        <small>{age}</small>
        <p>{description}</p>
        <div className="btnBlock">
          <Button type="button" className="idea-vote-card__view" onClick={onView}>
            {viewLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
