"use client";

import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface MediaCarouselProps {
    screenshots: string[];
    videoUrl?: string | null;
    projectName: string;
}

export function MediaCarousel({ screenshots, videoUrl, projectName }: MediaCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

    const totalItems = (videoUrl ? 1 : 0) + screenshots.length;

    const handleImageLoad = (idx: number) => {
        setLoadingStates((prev) => ({ ...prev, [idx]: false }));
    };

    const handleImageLoadStart = (idx: number) => {
        setLoadingStates((prev) => ({ ...prev, [idx]: true }));
    };

    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="relative w-full space-y-4">
            <Carousel
                className="w-full"
                opts={{
                    align: "center",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 5000,
                        stopOnInteraction: true,
                        stopOnMouseEnter: true,
                    }),
                ]}
                setApi={setApi}
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {videoUrl && (
                        <CarouselItem className="pl-2 md:pl-4">
                            <div className="relative rounded-xl transition-all">
                                <div className="overflow-hidden rounded-xl border-2 border-border/50 bg-white">
                                    <div className="aspect-video w-full flex items-center justify-center bg-white">
                                        <video
                                            src={videoUrl}
                                            className="h-full w-full object-contain"
                                            controls={true}
                                            preload="metadata"
                                            playsInline={true}
                                        >
                                            <track kind="captions" />
                                        </video>
                                    </div>
                                </div>
                                {/* Video badge */}
                                <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                    🎥 Demo Video
                                </div>
                            </div>
                        </CarouselItem>
                    )}

                    {screenshots.map((screenshot, idx) => (
                        <CarouselItem key={screenshot} className="pl-2 md:pl-4">
                            <div className="relative rounded-xl transition-all">
                                <div className="overflow-hidden rounded-xl border-2 border-border/50 bg-white">
                                    <div className="aspect-video w-full relative flex items-center justify-center bg-white">
                                        {/* Loading spinner */}
                                        {loadingStates[idx] !== false && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            </div>
                                        )}

                                        <Image
                                            src={screenshot}
                                            alt={`${projectName} screenshot ${idx + 1}`}
                                            className="h-full w-full object-contain transition-opacity duration-300"
                                            width={1200}
                                            height={675}
                                            priority={idx === 0 && !videoUrl}
                                            loading={idx === 0 && !videoUrl ? "eager" : "lazy"}
                                            quality={90}
                                            onLoadingComplete={() => handleImageLoad(idx)}
                                            onLoadStart={() => handleImageLoadStart(idx)}
                                            style={{
                                                opacity: loadingStates[idx] === false ? 1 : 0,
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Image counter badge */}
                                <div className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                    📸 {idx + 1} / {screenshots.length}
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Navigation buttons */}
                <CarouselPrevious className="left-2 size-10 border-2 border-border bg-background/80 shadow-lg backdrop-blur-sm transition-all hover:bg-background disabled:opacity-50 sm:left-4 cursor-pointer" />
                <CarouselNext className="right-2 size-10 border-2 border-border bg-background/80 shadow-lg backdrop-blur-sm transition-all hover:bg-background disabled:opacity-50 sm:right-4 cursor-pointer" />
            </Carousel>

            {/* Dot indicators */}
            {count > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <div className="flex gap-1.5">
                        {Array.from({ length: count }).map((_, idx) => (
                            <button
                                // biome-ignore lint/suspicious/noArrayIndexKey: no other way
                                key={`${idx}-dot`}
                                type="button"
                                onClick={() => api?.scrollTo(idx)}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300",
                                    current === idx + 1
                                        ? "w-8 bg-primary"
                                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                                )}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                        {current} / {count}
                    </span>
                </div>
            )}
        </div>
    );
}
