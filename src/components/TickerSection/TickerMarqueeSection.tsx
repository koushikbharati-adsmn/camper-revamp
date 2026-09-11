import TickerMarquee from "./TickerMarquee";

type TickerMarqueeSectionProps = {
  items?: string[];
};

const defaultItems = ["Lorem Ipsum is simply dummy text"];

export default function TickerMarqueeSection({ items = defaultItems }: TickerMarqueeSectionProps) {
  return (
    <section className="w-full" aria-label="News ticker">
      <TickerMarquee items={items} />
    </section>
  );
}
