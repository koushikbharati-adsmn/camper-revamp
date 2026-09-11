import { IconExclamationCircleFilled } from "@tabler/icons-react";

import "./ActivityList.css";

type Activity = {
  id: number;
  message: string;
  detail: string;
};

type ActivityListProps = {
  activities: Activity[];
  showTooltip?: boolean;
  onShowScanQr?: () => void;
};

export default function ActivityList({ activities, showTooltip = false, onShowScanQr }: ActivityListProps) {
  return (
    <section className="activity-list" aria-label="Latest activity">
      <div className="activity-list__header">
        <h2>Latest Activity</h2>

        {onShowScanQr && (
          <button type="button" className="sectionTwo__activity" onClick={onShowScanQr}>
            Show QR
          </button>
        )}
      </div>

      <div className="notificationBlock lg:max-h-[calc(100%-70px)] overflow-y-auto">
        {activities.map((activity) => (
          <div className="activity-list__item" key={activity.id}>
            <span className={showTooltip ? "activity-list__tooltip-trigger" : "activity-list__icon"} tabIndex={showTooltip ? 0 : undefined} aria-label={showTooltip ? `More details: ${activity.detail}` : undefined}>
              <IconExclamationCircleFilled />

              {showTooltip && <span className="activity-list__tooltip">{activity.detail}</span>}
            </span>

            <span>
              <strong>{activity.message}</strong>
              <small>{activity.detail}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
