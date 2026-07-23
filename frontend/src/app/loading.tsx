export default function Loading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse select-none">
      {/* Greeting Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-9 w-48 bg-[#282828] rounded-md" />

        {/* 2x3 Grid Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-[#ffffff08] rounded-md overflow-hidden h-16 pr-4"
            >
              <div className="w-16 h-16 bg-[#282828] shrink-0" />
              <div className="h-4 bg-[#282828] rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Row 1 Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-7 w-40 bg-[#282828] rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#181818] p-4 rounded-md flex flex-col gap-3">
              <div className="w-full aspect-square bg-[#282828] rounded-md" />
              <div className="h-4 bg-[#282828] rounded w-3/4" />
              <div className="h-3 bg-[#282828] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
