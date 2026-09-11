import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import FieldInput from "../../components/FieldInput/FieldInput";
import IdeaViewModal from "../../components/IdeaViewModal/IdeaViewModal";
import IdeaVoteCard from "../../components/IdeaVoteCard/IdeaVoteCard";
import ModalOverlay from "../../components/ModalOverlay/ModalOverlay";
import Select from "../../components/Select/Select";
import Tabbed, { type TabOption } from "../../components/Tabbed/Tabbed";
import TextArea from "../../components/TextArea/TextArea";
import TickerMarqueeSection from "../../components/TickerSection/TickerMarqueeSection";
import "./StagePage.css";

const pillars: TabOption[] = [
  { label: "Pillar 1", value: "pillar-1" },
  { label: "Pillar 2", value: "pillar-2" },
  { label: "Pillar 3", value: "pillar-3" },
];

const teams = [
  { label: "Team A", value: "team-a" },
  { label: "Team B", value: "team-b" },
  { label: "Team C", value: "team-c" },
  { label: "Team D", value: "team-d" },
];

const stages: TabOption[] = [
  { label: "All Ideas", value: "all" },
  { label: "Shortlisted Ideas", value: "shortlisted" },
  { label: "Sharpened Ideas", value: "sharpened" },
];

const ideas = [
  {
    stage: "shortlisted",
    pillar: "pillar-1",
    title: "Ideas That Move People",
    description: "A bold idea that turns everyday moments into meaningful connections and gives people a reason to take part.",
    age: "2 minutes ago",
    count: "1/2",
  },
  {
    stage: "sharpened",
    pillar: "pillar-1",
    title: "The Better Brief",
    description: "A simple way to bring sharper thinking, stronger collaboration, and more useful ideas into every brief.",
    age: "5 minutes ago",
    count: "2/2",
  },
  {
    stage: "shortlisted",
    pillar: "pillar-1",
    title: "Make Room for Wonder",
    description: "Create a little more space for curiosity and let unexpected ideas find their way into the room.",
    age: "8 minutes ago",
    count: "1/2",
  },
  {
    stage: "sharpened",
    pillar: "pillar-2",
    title: "Small Acts, Big Impact",
    description: "A practical platform for small changes that add up to a visible difference in people’s everyday lives.",
    age: "12 minutes ago",
    count: "1/2",
  },
  {
    stage: "shortlisted",
    pillar: "pillar-2",
    title: "Ideas in Motion",
    description: "Turn a strong thought into a clear action with a system designed to keep momentum moving forward.",
    age: "15 minutes ago",
    count: "2/2",
  },
  {
    stage: "shortlisted",
    pillar: "pillar-3",
    title: "The Open Invitation",
    description: "Invite more voices into the conversation and build a richer point of view together.",
    age: "18 minutes ago",
    count: "1/2",
  },
  {
    stage: "sharpened",
    pillar: "pillar-1",
    title: "Beyond the Expected",
    description: "Challenge the obvious answer, explore a new angle, and find the idea that people did not see coming.",
    age: "21 minutes ago",
    count: "2/2",
  },
  {
    stage: "shortlisted",
    pillar: "pillar-1",
    title: "The Everyday Spark",
    description: "Find a fresh reason to notice the ordinary and turn a familiar moment into something worth sharing.",
    age: "24 minutes ago",
    count: "1/2",
  },
  {
    stage: "sharpened",
    pillar: "pillar-2",
    title: "Built to Belong",
    description: "Design experiences that feel open, useful, and made for everyone who joins the conversation.",
    age: "27 minutes ago",
    count: "2/2",
  },
  {
    stage: "shortlisted",
    pillar: "pillar-2",
    title: "A Clearer Tomorrow",
    description: "Make progress easier to understand with a simple idea that turns ambition into visible action.",
    age: "30 minutes ago",
    count: "1/2",
  },
  {
    stage: "sharpened",
    pillar: "pillar-3",
    title: "Start with Why Not",
    description: "Replace hesitation with possibility and give the team permission to explore a more interesting path.",
    age: "34 minutes ago",
    count: "2/2",
  },
  {
    stage: "shortlisted",
    pillar: "pillar-3",
    title: "Make It Matter",
    description: "Connect creativity to real human needs and create work that stays useful long after the first impression.",
    age: "38 minutes ago",
    count: "1/2",
  },
];

export default function StagePage() {
  const [team, setTeam] = useState("team-a");
  const [pillar, setPillar] = useState("pillar-1");
  const [stage, setStage] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(0);
  const [editingIdea, setEditingIdea] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const visibleIdeas = ideas.filter((idea) => idea.pillar === pillar && (stage === "all" || idea.stage === stage));
  const selectedPillar = pillars.find((option) => option.value === pillar);
  const selectedIdea = visibleIdeas[selectedIdeaIndex];

  const handleIdeaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Replace this with the real API request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsModalOpen(false);
      setEditingIdea(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditIdea = (title: string, description: string) => {
    setIdeaTitle(title);
    setIdeaDescription(description);
    setEditingIdea(true);
    setIsModalOpen(true);
  };

  const handleCloseIdeaModal = () => {
    setIsModalOpen(false);
    setEditingIdea(false);
  };

  const handleViewIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    setIsViewModalOpen(true);
  };

  return (
    <div className="stage-page-root">
      <div className="stage-page">
        <div className="container">
          <div className="innerStage">
            <div className="stage-page__header grid gap-5">
              <div className="tabbedBlock w-full xl:flex-row flex-col flex gap-5">
                <Select options={teams} value={team} onChange={(event) => setTeam(event.target.value)} aria-label="Select team" className="w-fit" />
                <Tabbed options={pillars} value={pillar} onChange={setPillar} />
                <Tabbed options={stages} value={stage} onChange={setStage} className="stage-page__stage-tabs" />
              </div>
            </div>

            <div className="stage-page__grid">
              {visibleIdeas.map((idea, index) => (
                <div className="stage-page__grid-item" key={`${idea.pillar}-${idea.stage}-${index}`}>
                  <IdeaVoteCard title={idea.title} description={idea.description} age={idea.age} votes={Number.parseInt(idea.count, 10)} image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80" onView={() => handleViewIdea(index)} onEdit={() => handleEditIdea(idea.title, idea.description)} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <TickerMarqueeSection />
      </div>

      <ModalOverlay isOpen={isModalOpen} onClose={handleCloseIdeaModal} title={editingIdea ? "Edit Idea" : "Add New Idea"} className="stage-page__idea-modal">
        {/* <p className="stage-page__idea-intro">Pick a pillar. Write the boldest idea you can.</p> */}
        <h3 className="stage-page__selected-pillar">{selectedPillar?.label}</h3>
        {/* <Tabbed options={pillars} value={pillar} onChange={setPillar} /> */}
        <form className="stage-page__idea-form" onSubmit={handleIdeaSubmit}>
          <div className="stage-page__idea-fields">
            <label>
              <TextArea aria-label="Idea description" placeholder="Enter your idea here" rows={4} value={ideaDescription} onChange={(event) => setIdeaDescription(event.target.value)} required />
            </label>
          </div>
          <div className="stage-page__idea-fields">
            <label className="flex gap-2">
              Add Title <span>(Optional)</span>
            </label>
            <FieldInput value={ideaTitle} onChange={(event) => setIdeaTitle(event.target.value)} placeholder="Enter a Title" className="stage-page__idea-input" />
          </div>
          <div className="stage-page__idea-fields">
            <label className="flex gap-2">
              Add Context <span>(Optional)</span>
            </label>
            <TextArea aria-label="Add context" placeholder="Enter a context" rows={3} />
          </div>
          <Button type="submit" loading={isLoading} className="stage-page__submit-button w-full!">
            {editingIdea ? "Save Changes" : "Submit"}
          </Button>
        </form>
      </ModalOverlay>

      <IdeaViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} idea={selectedIdea} pillarLabel={selectedPillar?.label} className="stage-page__view-modal" onNext={() => setSelectedIdeaIndex((index) => (index + 1) % visibleIdeas.length)} />
    </div>
  );
}
