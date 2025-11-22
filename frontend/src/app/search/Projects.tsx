import { Project } from "next/dist/build/swc/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProjectData {
	uuid: string;
	score: number;
	name: string;
	tagline: string;
	description: string;
	how_its_made: string;
	source_code_url: string;
	event_name: string;
	logo_url: string;
	banner_url: string;
	highlights: { [key: string]: string[] };
}

interface Response {
	results: ProjectData[];
	pagination: {
		page: number;
		page_size: number;
		total: number;
		total_pages: number;
	};
}

export async function ProjectsComponent({ query, page }: { query: string, page: number }) {
	const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			// event_name: null,
			// prize_type: null,
			// sponsor_organization: null,
			query: query,
			page: page,
			page_size: 50,
		}),
	});
	const jsonData: Response = await response.json();
	const data = jsonData.results;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{data.map((project: ProjectData) => (
				<a 
					key={project.uuid}
					href={`/search/${project.uuid}`}
					className="group block"
				>
					<Card className="overflow-hidden border-2 bg-card transition-all hover:shadow-xl hover:border-foreground/20 h-full">
						{/* Project Image */}
						<div className="aspect-video w-full bg-linear-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 relative overflow-hidden">
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="text-6xl opacity-20">{project.name}</span>
							</div>
							{/* Hover overlay */}
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
						</div>
						
						{/* Project Info */}
						<div className="p-5 space-y-3">
							<div className="flex items-start justify-between gap-2">
								<h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
									{project.name}
								</h3>
							</div>
							
							<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
								{project.tagline}
							</p>
							
							<div className="flex items-center justify-between pt-2">
								<Badge variant="secondary" className="text-xs">
									{project.event_name}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{project.source_code_url}
								</span>
							</div>
						</div>
					</Card>
				</a>
			))}
		</div>
	);
}