function IntegrationCardSkeleton() {
  return (
    <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-high p-6 backdrop-blur-md">
      <div className="h-6 w-40 animate-pulse rounded bg-surface-container" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded bg-surface-container-low" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-low" />
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-xl bg-surface-container-low" />
        ))}
      </div>
    </div>
  );
}

export default function LoadingIntegrationsOverview() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-10 w-72 rounded bg-surface-container" />
        <div className="mt-3 h-4 w-[32rem] rounded bg-surface-container-low" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <IntegrationCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
