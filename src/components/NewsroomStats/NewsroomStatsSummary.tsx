type NewsroomStatsSummaryProps = {
  metrics: string[];
  values: number[];
};

export default function NewsroomStatsSummary({ metrics, values }: NewsroomStatsSummaryProps) {
  return (
    <div className="newsroom-stats__summary" aria-label="Workshop summary">
      {metrics.map((metric, index) => (
        <div className="newsroom-stats__summary-card" key={metric}>
          <strong>{String(values[index] ?? 0).padStart(2, "0")}</strong>
          <h3 className="headTitle">{metric}</h3>
        </div>
      ))}
    </div>
  );
}
