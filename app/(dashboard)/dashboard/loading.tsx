import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-8 overflow-auto p-8">
      <Card className="border-outline-variant/20 bg-card/70">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-9 w-80 max-w-full" />
            <Skeleton className="h-4 w-[32rem] max-w-full" />
          </div>
          <Skeleton className="h-11 w-52 rounded-2xl" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-outline-variant/20 bg-card/70">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-12">
        <Card className="border-outline-variant/20 bg-card/70 2xl:col-span-4">
          <CardHeader><Skeleton className="h-6 w-44" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>

        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className={`border-outline-variant/20 bg-card/70 ${index === 0 ? "2xl:col-span-3" : index === 1 ? "2xl:col-span-5" : "2xl:col-span-6"}`}
          >
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: index < 2 ? 4 : 5 }).map((__, rowIndex) => (
                <Skeleton key={rowIndex} className="h-20 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-[450px] border-outline-variant/20 bg-card/70">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[340px] w-full rounded-2xl" />
        </CardContent>
      </Card>

      <Card className="border-outline-variant/20 bg-card/70">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

