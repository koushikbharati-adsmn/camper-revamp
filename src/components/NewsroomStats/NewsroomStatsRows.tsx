type TeamStats = {
  title: string;
  submitted: number;
  shortlisted: number;
  sharpened: number;
  total: number;
};

type NewsroomStatsRowsProps = {
  teams: TeamStats[];
  metrics: string[];
};

export default function NewsroomStatsRows({ teams, metrics }: NewsroomStatsRowsProps) {
  return (
    <div className="newsroom-stats__rows">
      {teams.map((team) => {
        const values = [team.submitted, team.shortlisted, team.sharpened, team.total];

        return (
          <div className="newsroom-stats__row" key={team.title}>
            <div className="newsroom-stats__team">
              <strong>TEAM NAME</strong>
              <small>{team.title}</small>
            </div>
            {values.map((value, index) => (
              <div className="newsroom-stats__metric" key={metrics[index]}>
                <strong>{String(value).padStart(2, "0")}</strong>
                <small>{metrics[index]}</small>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
