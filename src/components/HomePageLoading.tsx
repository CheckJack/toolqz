import { BrandLogo } from "@/components/BrandLogo";
import { Header } from "@/components/Header";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-dark-surface skeleton-shimmer ${className}`}
      aria-hidden
    />
  );
}

function LoadingCard({ delayMs }: { delayMs: number }) {
  return (
    <article
      className="surface flex h-full flex-col overflow-hidden rounded-xl opacity-0 homepage-card-enter"
      style={{ animationDelay: `${delayMs}ms` }}
      aria-hidden
    >
      <Shimmer className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Shimmer className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Shimmer className="h-3.5 w-28" />
              <Shimmer className="h-2.5 w-20" />
            </div>
          </div>
          <Shimmer className="h-5 w-10 rounded-md" />
        </div>
        <Shimmer className="h-3 w-full" />
        <Shimmer className="mt-2 h-3 w-4/5" />
        <div className="mt-auto flex items-center justify-between pt-4">
          <Shimmer className="h-2.5 w-16" />
          <Shimmer className="h-2.5 w-20" />
        </div>
      </div>
    </article>
  );
}

export function HomePageLoading() {
  return (
    <>
      <div className="homepage-loading-bar" aria-hidden>
        <div className="homepage-loading-bar__track" />
      </div>

      <Header />

      <div
        className="relative -mt-[calc(var(--header-height)+env(safe-area-inset-top,0px))] min-h-[100dvh]"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading tools…</span>

        <main className="homepage-loading-enter">
          <section className="w-full pb-8 sm:pb-10">
            <div className="relative mx-auto max-w-6xl px-5 pt-[calc(var(--header-height)+env(safe-area-inset-top,0px)+2.75rem)] sm:px-8 sm:pt-[calc(var(--header-height)+env(safe-area-inset-top,0px)+4rem)]">
              <div className="mx-auto max-w-2xl text-center">
                <div className="mb-8 flex flex-col items-center gap-4">
                  <BrandLogo as="span" size="lg" className="homepage-brand-pulse text-[1.35rem] sm:text-[1.5rem]" />
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-neon/50 to-transparent" />
                </div>

                <div className="mx-auto space-y-3">
                  <Shimmer className="mx-auto h-9 w-[min(100%,18rem)] sm:h-10 sm:w-[22rem]" />
                  <Shimmer className="mx-auto h-9 w-[min(100%,14rem)] sm:h-10 sm:w-[16rem]" />
                </div>

                <div className="mx-auto mt-5 max-w-md space-y-2 px-2">
                  <Shimmer className="h-3.5 w-full" />
                  <Shimmer className="mx-auto h-3.5 w-4/5" />
                </div>

                <Shimmer className="mx-auto mt-4 h-3 w-36" />
              </div>

              <div className="relative mx-auto mt-6 max-w-xl sm:mt-8">
                <Shimmer className="h-12 w-full rounded-full sm:h-[3.25rem]" />
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <section className="pt-10 sm:pt-12 page-bottom-padding">
              <div className="scrollbar-hide -mx-5 overflow-x-auto px-5 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
                <div className="flex w-max min-w-full gap-1.5 pb-0.5">
                  {["w-14", "w-24", "w-20", "w-28", "w-[4.5rem]", "w-20", "w-24"].map(
                    (width, index) => (
                      <Shimmer
                        key={index}
                        className={`h-[2.125rem] shrink-0 rounded-full ${width}`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Shimmer className="h-4 w-28" />
                <Shimmer className="h-9 w-32 rounded-lg" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <LoadingCard key={index} delayMs={120 + index * 70} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
