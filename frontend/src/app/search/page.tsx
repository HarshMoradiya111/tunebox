import Image from "next/image";
import { fetchCategories, ApiCategory } from "@/lib/api";
import { MOCK_GENRES, MockGenre } from "@/lib/mockData";

// Vibrant gradient colors for categories
const GRADIENT_COLORS = [
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-red-600 to-rose-800",
  "from-teal-500 to-emerald-700",
  "from-purple-600 to-indigo-800",
  "from-blue-500 to-cyan-600",
  "from-yellow-500 to-amber-600",
  "from-emerald-600 to-green-800",
  "from-fuchsia-600 to-pink-700",
  "from-indigo-500 to-violet-700",
  "from-sky-500 to-blue-700",
  "from-lime-500 to-green-600",
  "from-orange-500 to-red-600",
  "from-violet-500 to-purple-700",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-teal-700",
  "from-amber-600 to-yellow-700",
  "from-stone-500 to-neutral-700",
  "from-slate-500 to-gray-700",
  "from-red-500 to-orange-600",
];

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  let genres: MockGenre[];

  try {
    const categories: ApiCategory[] = await fetchCategories();
    genres = categories.map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      color: GRADIENT_COLORS[i % GRADIENT_COLORS.length],
      image: cat.icon || `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop`,
    }));
  } catch {
    genres = MOCK_GENRES;
  }

  return (
    <div className="flex flex-col gap-6 select-none">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        Browse all
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {genres.map((genre) => (
          <div
            key={genre.id}
            className={`aspect-square p-4 rounded-xl overflow-hidden relative font-bold text-2xl text-white cursor-pointer hover:scale-[1.03] transition-all duration-300 shadow-md bg-gradient-to-br ${genre.color}`}
          >
            <span className="relative z-10 drop-shadow-md">{genre.name}</span>
            <div className="absolute -bottom-2 -right-3 w-28 h-28 rotate-[25deg] shadow-2xl rounded-md overflow-hidden">
              <Image
                src={genre.image}
                alt={genre.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
