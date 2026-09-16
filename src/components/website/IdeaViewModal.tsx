import Button from "./Button"
import ModalOverlay from "./ModalOverlay"

type Idea = { title: string; description: string }
type IdeaViewModalProps = {
  isOpen: boolean
  idea?: Idea
  pillarLabel?: string
  className?: string
  onClose: () => void
  onNext: () => void
}

export default function IdeaViewModal({
  isOpen,
  idea,
  pillarLabel,
  className = "",
  onClose,
  onNext,
}: IdeaViewModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className={className}
      headerClassName="absolute top-4 right-4 z-10"
      closeClassName="bg-theme10 hover:bg-theme5"
    >
      {idea && (
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="aspect-4/3 w-full overflow-hidden rounded-2xl">
            <img
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80"
              alt=""
            />
          </div>
          <div className="flex h-full flex-col gap-4">
            <div className="font-phudu-b text-base flex gap-6 uppercase">
              <span>Team A</span>
              <span>{pillarLabel}</span>
            </div>
            <div className="grid gap-4 overflow-y-auto pe-5">
              <h2 className="font-phudu-b text-2xl m-0 uppercase">{idea.title}</h2>
              <p className="text-base text-theme3 m-0 max-h-[20vh] max-w-[48ch] leading-[1.5]">
                {idea.description}
              </p>
            </div>
            <Button
              type="button"
              className="text-base mt-auto ml-auto w-fit px-8"
              onClick={onNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </ModalOverlay>
  )
}
