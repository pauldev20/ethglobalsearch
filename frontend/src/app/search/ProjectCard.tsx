"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Project } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

// biome-ignore lint/suspicious/noExplicitAny: no other way
export function ProjectCard({ project, highlights }: { project?: Project; highlights?: { [key: string]: any } }) {
    if (!project) {
        return (
            <Card className="overflow-hidden border-2 bg-card h-full animate-pulse pt-0 flex flex-col">
                {/* Skeleton Image */}
                <div className="aspect-video w-full bg-muted" />

                {/* Skeleton Info */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="h-7 bg-muted rounded w-3/4" />
                        <div className="h-5 bg-muted rounded w-20" />
                    </div>

                    <div className="space-y-2 mb-3">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                    </div>

                    <div className="space-y-2 mb-4 min-h-[60px]">
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-5/6" />
                        <div className="h-3 bg-muted rounded w-4/5" />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    <div className="pt-2 border-t border-border/40 h-[44px] flex items-center gap-1.5">
                        <div className="h-5 bg-muted rounded w-16" />
                        <div className="h-5 bg-muted rounded w-20" />
                        <div className="h-5 bg-muted rounded w-12" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Link key={project.uuid} href={`/search/${project.uuid}`}>
            <Card className="relative overflow-hidden border-2 bg-card transition-all hover:shadow-xl hover:border-foreground/20 h-full p-0 flex flex-col gap-0">
                <Badge variant="secondary" className="shrink-0 absolute top-0 left-0 z-10 m-2">
                    📍 {project.event_name}
                </Badge>

                {/* Project Image */}
                <div className="aspect-video w-full bg-linear-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 relative overflow-hidden">
                    {!project.banner_url && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl opacity-20">{project.name}</span>
                        </div>
                    )}
                    {project.banner_url && (
                        <Image
                            src={project.banner_url}
                            alt={project.name}
                            fill={true}
                            className="object-cover"
                            sizes="(min-width: 1024px) 369px, (min-width: 640px) 286px, 100vw"
                            priority={false}
                        />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Project Info */}
                <div className="p-4 flex flex-col flex-1">
                    {/* Title with Location Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
                            {project.name}
                        </h3>
                    </div>

                    {/* Tagline - Fixed height */}
                    <div className="mb-3">
                        {highlights?.tagline?.[0] ? (
                            <p
                                className="text-sm text-muted-foreground line-clamp-2 leading-relaxed [&_em]:font-semibold [&_em]:text-foreground [&_em]:not-italic"
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: no other way
                                dangerouslySetInnerHTML={{ __html: highlights.tagline[0] }}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {project.tagline}
                            </p>
                        )}
                    </div>

                    {/* Highlighted Snippets or Fallback Content - Fixed height */}
                    {highlights !== undefined && (
                        <div className="space-y-2 mb-4 min-h-[60px]">
                            {/* Description Highlights or Fallback */}
                            {highlights?.description && highlights.description.length > 0
                                ? highlights.description.slice(0, 2).map((snippet: string, index: number) => (
                                      <div
                                          // biome-ignore lint/suspicious/noArrayIndexKey: no other way
                                          key={`desc-${index}`}
                                          className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2"
                                      >
                                          <span
                                              className="[&_em]:font-semibold [&_em]:text-foreground [&_em]:not-italic [&_em]:bg-yellow-100/50 [&_em]:dark:bg-yellow-900/20 [&_em]:px-0.5"
                                              // biome-ignore lint/security/noDangerouslySetInnerHtml: no other way
                                              dangerouslySetInnerHTML={{ __html: snippet }}
                                          />
                                      </div>
                                  ))
                                : project.description && (
                                      <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-3">
                                          {project.description}
                                      </p>
                                  )}

                            {/* How It's Made Highlights or Fallback */}
                            {highlights?.how_its_made && highlights.how_its_made.length > 0
                                ? highlights.how_its_made.slice(0, 1).map((snippet: string, index: number) => (
                                      <div
                                          // biome-ignore lint/suspicious/noArrayIndexKey: no other way
                                          key={`tech-${index}`}
                                          className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2"
                                      >
                                          {" "}
                                          <span
                                              className="[&_em]:font-semibold [&_em]:text-foreground [&_em]:not-italic [&_em]:bg-blue-100/50 [&_em]:dark:bg-blue-900/20 [&_em]:px-0.5"
                                              // biome-ignore lint/security/noDangerouslySetInnerHtml: no other way
                                              dangerouslySetInnerHTML={{ __html: snippet }}
                                          />
                                      </div>
                                  ))
                                : (!highlights?.description || highlights.description.length === 0) &&
                                  project.how_its_made && (
                                      <div className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
                                          <span>{project.how_its_made}</span>
                                      </div>
                                  )}
                        </div>
                    )}

                    {/* Spacer to push prizes to bottom */}
                    <div className="flex-1" />

                    {/* Prizes - Fixed height at bottom */}
                    <div className="pt-2 border-t border-border/40 h-[38px] flex items-center overflow-hidden">
                        <div className="flex gap-1.5 items-center overflow-x-auto">
                            {project.prizes.map((prize, index) => (
                                <Badge key={`${prize.prize_name}-${index}`} className="text-xs whitespace-nowrap">
                                    {prize.sponsor_organization_square_logo_url ? (
                                        <Image
                                            src={prize.sponsor_organization_square_logo_url}
                                            alt={prize.sponsor_name}
                                            width={16}
                                            height={16}
                                            className="h-4 w-4 rounded-full bg-white"
                                        />
                                    ) : null}
                                    {prize.sponsor_name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
