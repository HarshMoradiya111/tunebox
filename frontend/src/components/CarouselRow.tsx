import Card from "./Card";
import { MockMediaItem } from "@/lib/mockData";

interface CarouselRowProps {
  title: string;
  items: MockMediaItem[];
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
