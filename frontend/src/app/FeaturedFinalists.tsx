import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { ProjectCard } from "./search/ProjectCard";
import { Project, searchProjects } from "@/lib/api";


export default async function FeaturedFinalists({skeleton}: {skeleton?: boolean}) {
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

				<Carousel
					opts={{ align: "start", loop: true }}
					className="w-full px-1"
				>
					<CarouselContent className="-ml-2 sm:-ml-4">
						{Array.from({ length: 10 }).map((_, index) => (
							<CarouselItem
							key={index}
							className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3 xl:basis-1/4"
						  >
							<ProjectCard project={undefined} />
						  </CarouselItem>
						))}
					</CarouselContent>

					<CarouselPrevious className="-left-8 hidden lg:-left-12 lg:flex cursor-pointer" />
					<CarouselNext className="-right-8 hidden lg:-right-12 lg:flex cursor-pointer" />
				</Carousel>
			</div>
		);
	}
	
	const projects = await searchProjects("", 1, 10, undefined, "finalist", undefined);

	return (
		<div className="space-y-6 sm:space-y-8">
            <div className="relative flex w-full items-center px-2 space-y-0">
              <div className="grow border-t border-foreground/20" />
              <h2 className="shrink-0 whitespace-nowrap px-4 text-lg font-bold text-foreground sm:px-6 sm:text-1xl md:text-2xl">
                Latest Finalists
              </h2>
              <div className="grow border-t border-foreground/20" />
            </div>

            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full px-1"
            >
              <CarouselContent className="-ml-2 sm:-ml-4">
                {projects.results.map((project: Project) => (
                  <CarouselItem
                    key={project.uuid}
                    className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3 xl:basis-1/4"
                  >
                    <ProjectCard project={project} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="-left-8 hidden lg:-left-12 lg:flex cursor-pointer" />
              <CarouselNext className="-right-8 hidden lg:-right-12 lg:flex cursor-pointer" />
            </Carousel>
		</div>
	);
}
