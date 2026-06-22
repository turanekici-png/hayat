export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-[#f6fafc] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1320px] space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-md bg-slate-200" />
        <div className="h-16 max-w-3xl animate-pulse rounded-md bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
