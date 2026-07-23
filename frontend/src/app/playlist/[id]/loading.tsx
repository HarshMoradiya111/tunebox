export default function PlaylistLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-6 border-b border-[#282828]">
        <div className="w-48 h-48 md:w-56 md:h-56 bg-[#282828] rounded-md shadow-2xl shrink-0" />
        <div className="flex flex-col gap-3 w-full">
          <div className="h-4 w-20 bg-[#282828] rounded" />
          <div className="h-10 w-2/3 bg-[#282828] rounded" />
          <div className="h-4 w-1/2 bg-[#282828] rounded" />
        </div>
      </div>

      {/* Track List Skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 px-3 bg-[#ffffff05] rounded-md">
            <div className="w-4 h-4 bg-[#282828] rounded shrink-0" />
            <div className="w-10 h-10 bg-[#282828] rounded shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-[#282828] rounded w-1/3" />
              <div className="h-3 bg-[#282828] rounded w-1/4" />
            </div>
            <div className="h-4 bg-[#282828] rounded w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
