/**
 * PageSkeleton.tsx
 * Instant matching skeleton fallback for Suspense route transitions.
 * Eliminates blank screens and prevents layout shift (CLS).
 */

export function PageSkeleton() {
  return (
    <div className="w-full flex-1 p-4 md:p-8 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading content">
      {/* Header breadcrumb & title skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-[#1A1A1A]/[0.06] rounded-md" />
        <div className="h-8 w-56 bg-[#1A1A1A]/[0.08] rounded-lg" />
      </div>

      {/* Top metric/summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-28 bg-white/70 border border-[#E0DBCF]/60 rounded-xl p-4 space-y-3">
          <div className="h-4 w-20 bg-[#1A1A1A]/[0.06] rounded" />
          <div className="h-8 w-16 bg-[#1A1A1A]/[0.08] rounded" />
        </div>
        <div className="h-28 bg-white/70 border border-[#E0DBCF]/60 rounded-xl p-4 space-y-3">
          <div className="h-4 w-24 bg-[#1A1A1A]/[0.06] rounded" />
          <div className="h-8 w-20 bg-[#1A1A1A]/[0.08] rounded" />
        </div>
        <div className="h-28 bg-white/70 border border-[#E0DBCF]/60 rounded-xl p-4 space-y-3 hidden lg:block">
          <div className="h-4 w-20 bg-[#1A1A1A]/[0.06] rounded" />
          <div className="h-8 w-28 bg-[#1A1A1A]/[0.08] rounded" />
        </div>
      </div>

      {/* Main workspace skeleton */}
      <div className="h-80 bg-white/70 border border-[#E0DBCF]/60 rounded-2xl p-6 space-y-4">
        <div className="h-5 w-40 bg-[#1A1A1A]/[0.07] rounded" />
        <div className="space-y-2.5 pt-2">
          <div className="h-10 bg-[#1A1A1A]/[0.03] rounded-lg w-full" />
          <div className="h-10 bg-[#1A1A1A]/[0.03] rounded-lg w-full" />
          <div className="h-10 bg-[#1A1A1A]/[0.03] rounded-lg w-5/6" />
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
