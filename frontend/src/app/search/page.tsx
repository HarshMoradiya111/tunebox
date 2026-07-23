import GenreCard from "@/components/GenreCard";
import { MOCK_GENRES } from "@/lib/mockData";

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-6 select-none">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        Browse all genres
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {MOCK_GENRES.map((genre) => (
          <GenreCard key={genre.id} genre={genre} />
        ))}
      </div>
    </div>
  );
}
