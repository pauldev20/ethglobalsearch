import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { getSimilarProjects, Project } from "@/lib/api";
import { ProjectCard } from "../ProjectCard";

export async function SimilarProjects({ uuid }: { uuid: string }) {
	const projects = await getSimilarProjects(uuid);

	if (projects.length === 0) {
		return null;
	}

	return (
		<Carousel
			opts={{ align: "start", loop: true }}
			className="w-full px-1"
		>
			<CarouselContent className="-ml-2 sm:-ml-4">
			{projects.map((similarProject: Project, idx: number) => (
				<CarouselItem
				key={idx}
				className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3 xl:basis-1/4"
				>
					<ProjectCard project={similarProject} />
				</CarouselItem>
			))}
			</CarouselContent>

			<CarouselPrevious className="-left-8 hidden lg:-left-12 lg:flex cursor-pointer" />
			<CarouselNext className="-right-8 hidden lg:-right-12 lg:flex cursor-pointer" />
		</Carousel>
	);
}
