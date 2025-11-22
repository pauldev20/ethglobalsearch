import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import SearchComponent from "./SearchComponent";
import FeaturedFinalists from "./FeaturedFinalists";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <DotPattern
        className={cn(
          "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
          "sm:mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
          "-z-10",
        )}
      />

      <main className="relative flex-1 flex w-full flex-col items-center justify-center py-8 sm:py-16">
        <div className="relative z-10 w-full max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mx-auto max-w-4xl">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-purple-600 via-blue-600 to-pink-600 blur opacity-0 transition-opacity duration-500 group-hover:opacity-30 group-focus-within:opacity-40 sm:rounded-2xl" />
              <SearchComponent />
            </div>
          </div>

          {/* Latest Finalists */}
		  <Suspense fallback={<FeaturedFinalists skeleton />}>
          	<FeaturedFinalists />
		  </Suspense>
        </div>
      </main>
    </>
  );
}