import Card from "./Card";
import { MediaItem } from "@/types";

interface CarouselRowProps {
  title: string;
  items: MediaItem[];
  seeAllHref?: string;
}

export default function CarouselRow({
  title,
  items,
  seeAllHref = "#",
}: CarouselRowProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
          {title}
        </h2>
        <a
          href={seeAllHref}
          className="text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors"
        >
          Show all
        </a>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:pb-0 md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-visible" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <div key={item.id} className="snap-start shrink-0 w-[42vw] sm:w-[30vw] md:w-auto">
            <Card item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
