import { IconBell } from "@tabler/icons-react";
import "./TickerMarquee.css";

type TickerMarqueeProps = {
  items: string[];
};

export default function TickerMarquee({ items }: TickerMarqueeProps) {
  const repeatedItems = Array.from({ length: 10 }, () => items).flat();

  const renderItems = (isDuplicate = false) => (
    <div className="ticker-marquee__group" aria-hidden={isDuplicate}>
      {repeatedItems.map((item, index) => (
        <span className="ticker-marquee__item" key={`${item}-${index}`}>
          <IconBell className="ticker-marquee__icon " size={20} stroke={1.8} aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className="ticker-marquee" aria-label="Live updates">
      <span className="ticker-marquee__live">
        <span className="ticker-marquee__indicator" aria-hidden="true" />
        LIVE
      </span>
      <div className="ticker-marquee__track">
        {renderItems()}
        {renderItems(true)}
      </div>
    </div>
  );
}
