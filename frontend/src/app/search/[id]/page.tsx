import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { notFound } from "next/navigation";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getProject, Project } from "@/lib/api";
import { SimilarProjects } from "./SimilarProjects";
import Link from "next/link";


export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project: Project = await getProject(id);
  if (!project) notFound();

  const demoUrl = undefined;

  return (
    <main className="min-h-screen w-full pb-8">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Images at the very top */}
        {/* {images && images.length > 0 && (
          <Carousel className="w-full" opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-1">
              {images.map((image, idx) => (
                <CarouselItem key={idx} className="pl-1 md:basis-1/2">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={image}
                      alt={`${name} screenshot ${idx + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-2 sm:-left-4" />
            <CarouselNext className="-right-2 sm:-right-4" />
          </Carousel>
        )} */}

         {/* Header */}
         <div className="space-y-4">
           <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
             {/* Left: Logo & Title */}
             <div className="flex items-center gap-4">
               {project.logo_url && (
                 <img
                   src={project.logo_url}
                   alt={project.name}
                   className="h-12 w-12 rounded-lg border-2 border-border object-cover sm:h-14 sm:w-14"
                 />
               )}

               <div className="min-w-0 flex-1">
                 <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                   {project.name}
                 </h1>
                 <p className="mt-0.5 text-sm text-muted-foreground">
                   {project.event_name}
                 </p>
               </div>
             </div>

             {/* Right: CTAs - Desktop only */}
             {(demoUrl || project.source_code_url) && (
               <div className="hidden sm:flex gap-3 shrink-0">
                 {demoUrl && (
                   <Button asChild size="default" className="gap-2">
                     <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                       <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                       <span>Live Demo</span>
                     </a>
                   </Button>
                 )}

                 {project.source_code_url && (
                   <Button asChild size="default" variant="outline" className="gap-2">
                     <a href={project.source_code_url} target="_blank" rel="noopener noreferrer">
                       <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
                       <span>Source Code</span>
                     </a>
                   </Button>
                 )}
               </div>
             )}
           </div>

           <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
             {project.tagline}
           </p>

           {project.prizes.length > 0 && (
             <div className="flex flex-wrap items-center gap-2">
               {project.prizes.map((prize, idx) => (
                 <Badge
                   key={idx}
                   variant="default"
                   className="gap-1 px-2 py-1 text-xs"
                 >
                   <span>{prize.emoji}</span>
                   <span>{prize.detail}</span>
                 </Badge>
               ))}
             </div>
           )}

           {/* Mobile CTAs - Full Width */}
           {(demoUrl || project.source_code_url) && (
             <div className="flex flex-col gap-2 sm:hidden">
               {demoUrl && (
                 <Button asChild size="lg" className="w-full gap-2">
                   <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                     <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                     <span>Live Demo</span>
                   </a>
                 </Button>
               )}

               {project.source_code_url && (
                 <Button asChild size="lg" variant="outline" className="w-full gap-2">
                   <a href={project.source_code_url} target="_blank" rel="noopener noreferrer">
                     <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
                     <span>Source Code</span>
                   </a>
                 </Button>
               )}
             </div>
           )}
         </div>

        {/* Content cards */}
        <div className="space-y-8">
          <Card className="border-2 p-6 sm:p-8">
            <h2 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">
              About this project
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {project.description}
            </p>
          </Card>

          {project.how_its_made && (
            <Card className="border-2 p-6 sm:p-8">
              <h2 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">
                How it&apos;s Made
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {project.how_its_made}
              </p>
            </Card>
          )}
        </div>

		<SimilarProjects uuid={id} />
      </section>
    </main>
  );
}