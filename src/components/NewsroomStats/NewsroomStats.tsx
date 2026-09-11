import "./NewsroomStats.css";
import NewsroomStatsRows from "./NewsroomStatsRows";

type TeamStats = {
  title: string;
  submitted: number;
  shortlisted: number;
  sharpened: number;
  total: number;
};

type NewsroomStatsProps = {
  teams?: TeamStats[];
  metrics?: string[];
  showSummary?: boolean;
};

const defaultMetrics = ["Drafts", "Shortlisted", "Sharpened", "Total Ideas"];

export default function NewsroomStats({ teams, metrics = defaultMetrics, showSummary = true }: NewsroomStatsProps) {
  const safeTeams = teams ?? [];

  const summaryValues = [safeTeams.reduce((sum, team) => sum + team.submitted, 0), safeTeams.reduce((sum, team) => sum + team.shortlisted, 0), safeTeams.reduce((sum, team) => sum + team.sharpened, 0), safeTeams.reduce((sum, team) => sum + team.total, 0)];

  return (
    <div className="newsroom-stats" aria-label="Team performance">
      {showSummary && (
        <div className="newsroom-stats__summary">
          {metrics.map((metric, index) => (
            <div className="newsroom-stats__summary-card" key={metric}>
              <strong>{String(summaryValues[index]).padStart(2, "0")}</strong>
              <h3 className="headTitle">{metric}</h3>
            </div>
          ))}
        </div>
      )}

      <NewsroomStatsRows teams={safeTeams} metrics={metrics} />
    </div>
  );
}
