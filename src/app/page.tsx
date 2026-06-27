import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { DotPattern } from "@/components/ui/dot-pattern";
import { type Project, getLatestFinalists } from "@/lib/api";
import { cn } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import SearchComponent from "./SearchComponent";
import { ProjectCard } from "./search/ProjectCard";

// Render at request time, not build time — otherwise `next build` prerenders this
// page and fails if Convex is unreachable during the build. The finalists fetch is
// still cached across requests via unstable_cache below, so this stays cheap.
export const dynamic = "force-dynamic";

// Finalists change only on ingest, so cache the (relatively expensive) fetch and
// reuse it across requests instead of re-querying Convex on every page load.
// Revalidates hourly; bust early with revalidateTag("finalists").
const getCachedFinalists = unstable_cache(
    () => getLatestFinalists(10),
    ["latest-finalists"],
    { revalidate: 3600, tags: ["finalists"] },
);

async function FeaturedFinalists({ skeleton }: { skeleton?: boolean }) {
    if (skeleton) {
        return (
            <div className="space-y-6 sm:space-y-8">
                <div className="relative flex w-full items-center px-2 space-y-0">
                    <div className="grow border-t border-foreground/20" />
                    <h2 className="shrink-0 whitespace-nowrap px-4 text-lg font-bold text-foreground sm:px-6 sm:text-1xl md:text-2xl">
                        Latest Finalists
                    </h2>
                    <div className="grow border-t border-foreground/20" />
                </div>

                <div className="lg:px-12">
                    <Carousel opts={{ align: "start", loop: true }} className="w-full px-1">
                        <CarouselContent className="-ml-2 sm:-ml-4">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <CarouselItem
                                    // biome-ignore lint/suspicious/noArrayIndexKey: no other way
                                    key={index}
                                    className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3 xl:basis-1/4"
                                >
                                    <ProjectCard project={undefined} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        <CarouselPrevious className="-left-12 hidden lg:flex cursor-pointer" />
                        <CarouselNext className="-right-12 hidden lg:flex cursor-pointer" />
                    </Carousel>
                </div>
            </div>
        );
    }

    const { event_name, results } = await getCachedFinalists();
    const heading = event_name ? `${event_name} - Finalists` : "Latest Finalists";

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="relative flex w-full items-center px-2 space-y-0">
                <div className="grow border-t border-foreground/20" />
                <h2 className="shrink-0 whitespace-nowrap px-4 text-lg font-bold text-foreground sm:px-6 sm:text-1xl md:text-2xl">
                    {heading}
                </h2>
                <div className="grow border-t border-foreground/20" />
            </div>

            <div className="lg:px-12">
                <Carousel opts={{ align: "start", loop: true }} className="w-full px-1">
                    <CarouselContent className="-ml-2 sm:-ml-4">
                        {results.map((project: Project) => (
                            <CarouselItem
                                key={project.uuid}
                                className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3 xl:basis-1/4"
                            >
                                <ProjectCard project={project} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <CarouselPrevious className="-left-12 hidden lg:flex cursor-pointer" />
                    <CarouselNext className="-right-12 hidden lg:flex cursor-pointer" />
                </Carousel>
            </div>
        </div>
    );
}

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
                    <Suspense fallback={<FeaturedFinalists skeleton={true} />}>
                        <FeaturedFinalists />
                    </Suspense>
                </div>
            </main>
        </>
    );
}
